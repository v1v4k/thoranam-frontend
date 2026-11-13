export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ApiMeta {
  requestId: string;
  nextCursor?: string | null;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiFieldError {
  field: string;
  code: string;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: ApiFieldError[] };
  meta: ApiMeta;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number | undefined,
    public readonly requestId?: string,
    public readonly details?: ApiFieldError[],
  ) {
    // Raw response text, request URLs and secrets never become error messages.
    super('The API request could not be completed.');
    this.name = 'ApiError';
  }
}
