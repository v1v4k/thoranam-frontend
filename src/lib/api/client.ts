import { getApiBaseUrl } from '../env';
import {
  ApiError,
  type ApiFailure,
  type ApiSuccess,
  type JsonValue,
} from './types';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: URLSearchParams;
  body?: JsonValue;
  csrfToken?: string;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasMeta(value: Record<string, unknown>): boolean {
  return (
    isRecord(value.meta) &&
    typeof value.meta.requestId === 'string' &&
    (value.meta.nextCursor === undefined ||
      value.meta.nextCursor === null ||
      typeof value.meta.nextCursor === 'string')
  );
}

function isFailure(value: unknown): value is ApiFailure {
  if (
    !isRecord(value) ||
    value.success !== false ||
    !hasMeta(value) ||
    !isRecord(value.error) ||
    typeof value.error.code !== 'string' ||
    typeof value.error.message !== 'string'
  )
    return false;
  return (
    value.error.details === undefined ||
    (Array.isArray(value.error.details) &&
      value.error.details.every(
        (detail: unknown) =>
          isRecord(detail) &&
          typeof detail.field === 'string' &&
          typeof detail.code === 'string',
      ))
  );
}

/** Browser transport for approved API routes. Domain payload validation belongs to each feature. */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiSuccess<T> | undefined> {
  // Only API-relative route segments; query parameters use URLSearchParams.
  // Reject absolute URLs, traversal and encoded separators before sending cookies.
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path)) {
    throw new ApiError('INVALID_PATH', undefined);
  }
  const url = new URL(`${getApiBaseUrl()}/${path}`);
  if (options.query) url.search = options.query.toString();

  const method = options.method ?? 'GET';
  if (method === 'GET' && options.body !== undefined) {
    throw new ApiError('INVALID_REQUEST', undefined);
  }
  const headers = new Headers({ Accept: 'application/json' });
  if (options.body !== undefined)
    headers.set('Content-Type', 'application/json');
  if (options.csrfToken) headers.set('X-CSRF-Token', options.csrfToken);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      signal: options.signal,
    });
  } catch {
    if (options.signal?.aborted)
      throw new ApiError('REQUEST_ABORTED', undefined);
    throw new ApiError('NETWORK_ERROR', undefined);
  }

  if (response.status === 204) return undefined;
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (options.signal?.aborted)
      throw new ApiError('REQUEST_ABORTED', undefined);
    throw new ApiError('INVALID_RESPONSE', response.status);
  }

  if (!response.ok) {
    if (isFailure(payload)) {
      throw new ApiError(
        payload.error.code,
        response.status,
        payload.meta.requestId,
        payload.error.details?.map(({ field, code }) => ({ field, code })),
      );
    }
    throw new ApiError('INVALID_RESPONSE', response.status);
  }
  if (
    !isRecord(payload) ||
    payload.success !== true ||
    !('data' in payload) ||
    !hasMeta(payload)
  ) {
    throw new ApiError('INVALID_RESPONSE', response.status);
  }
  // This validates the shared envelope, not the caller's generic domain type T.
  return payload as unknown as ApiSuccess<T>;
}
