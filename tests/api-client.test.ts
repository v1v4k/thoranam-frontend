import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../src/lib/api/client';
import { ApiError } from '../src/lib/api/types';

const fetchMock = vi.fn<typeof fetch>();
const health = {
  success: true,
  data: { status: 'ok' },
  meta: { requestId: 'test-request' },
};

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3001/api/v1');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('API transport', () => {
  it('uses the configured API with cookies, no caching and no redirects', async () => {
    fetchMock.mockResolvedValue(Response.json(health));
    await expect(apiRequest('health')).resolves.toEqual(health);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe('http://localhost:3001/api/v1/health');
    expect(init).toMatchObject({
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
    });
    expect(new Headers(init?.headers).get('Accept')).toBe('application/json');
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
  });

  it('serializes query parameters without letting them change the destination', async () => {
    fetchMock.mockResolvedValue(Response.json(health));
    await apiRequest('health', {
      query: new URLSearchParams({ cursor: 'a&next=/elsewhere' }),
    });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      'http://localhost:3001/api/v1/health?cursor=a%26next%3D%2Felsewhere',
    );
  });

  it.each([
    '',
    '/health',
    '//elsewhere.test',
    'https://elsewhere.test',
    '../health',
    'auth/../../health',
    'auth/%2e%2e/health',
    'auth%2flogout',
    'auth\\logout',
    'health?token=secret',
    'health#secret',
  ])('rejects unsafe path %s before fetching', async (path) => {
    await expect(apiRequest(path)).rejects.toMatchObject({
      code: 'INVALID_PATH',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards an explicitly supplied CSRF token and JSON body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await apiRequest('auth/logout', {
      method: 'POST',
      body: {},
      csrfToken: 'test-csrf',
    });
    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{}');
    expect(new Headers(init.headers).get('X-CSRF-Token')).toBe('test-csrf');
    expect(new Headers(init.headers).get('Content-Type')).toBe(
      'application/json',
    );
  });

  it('does not invent a CSRF token', async () => {
    fetchMock.mockResolvedValue(Response.json(health));
    await apiRequest('health');
    expect(
      new Headers(fetchMock.mock.calls[0]![1]?.headers).has('X-CSRF-Token'),
    ).toBe(false);
  });

  it('does not parse an empty 204 body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(
      apiRequest('auth/logout', { method: 'POST' }),
    ).resolves.toBeUndefined();
  });

  it('rejects a GET body before fetching', async () => {
    await expect(apiRequest('health', { body: {} })).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserves error codes, field feedback and request IDs without exposing raw messages', async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'secret server details',
            details: [{ field: 'code', code: 'INVALID_VALUE' }],
          },
          meta: { requestId: 'test-error' },
        },
        { status: 422 },
      ),
    );
    const error = await apiRequest('gallery-share/otp/verify', {
      method: 'POST',
      body: { code: '000000' },
    }).catch((error: unknown) => error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
      requestId: 'test-error',
      details: [{ field: 'code', code: 'INVALID_VALUE' }],
    });
    expect(String(error)).not.toContain('secret');
  });

  it.each([
    {},
    { success: true, data: null },
    { success: false, meta: { requestId: 'test' } },
    { ...health, meta: { requestId: 123 } },
    { ...health, meta: { requestId: 'test', nextCursor: 123 } },
  ])('rejects malformed success envelopes', async (payload) => {
    fetchMock.mockResolvedValue(Response.json(payload));
    await expect(apiRequest('health')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      status: 200,
    });
  });

  it('rejects non-JSON responses without exposing their body', async () => {
    fetchMock.mockResolvedValue(
      new Response('private upstream diagnostics', { status: 502 }),
    );
    const error = await apiRequest('health').catch((error: unknown) => error);
    expect(error).toMatchObject({ code: 'INVALID_RESPONSE', status: 502 });
    expect(String(error)).not.toContain('private');
  });

  it('rejects malformed error envelopes', async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          success: false,
          error: { code: 'ERROR', message: 'Failure', details: 'invalid' },
          meta: { requestId: 'test' },
        },
        { status: 400 },
      ),
    );
    await expect(apiRequest('health')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('does not retry failed mutations or expose network diagnostics', async () => {
    fetchMock.mockRejectedValue(new TypeError('secret network information'));
    const error = await apiRequest('auth/logout', { method: 'POST' }).catch(
      (error: unknown) => error,
    );
    expect(error).toMatchObject({ code: 'NETWORK_ERROR' });
    expect(String(error)).not.toContain('secret');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('passes cancellation to fetch and reports aborted requests', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(async (_url, init) => {
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    await expect(
      apiRequest('health', { signal: controller.signal }),
    ).rejects.toMatchObject({ code: 'REQUEST_ABORTED' });
  });
});
