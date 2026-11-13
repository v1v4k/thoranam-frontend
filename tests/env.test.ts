import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl, parseApiBaseUrl } from '../src/lib/env';

afterEach(() => vi.unstubAllEnvs());

describe('API environment', () => {
  it.each([
    'http://localhost:3001/api/v1',
    'http://127.0.0.1:3001/api/v1',
    'http://[::1]:3001/api/v1',
    'https://api.thoranam.com/api/v1',
  ])('accepts %s', (url) => {
    expect(parseApiBaseUrl(url)).toBe(url);
  });

  it('normalizes a trailing slash', () => {
    expect(parseApiBaseUrl('http://localhost:3001/api/v1/')).toBe(
      'http://localhost:3001/api/v1',
    );
  });

  it.each([
    undefined,
    '',
    ' /api/v1',
    '/api/v1',
    'http://api.thoranam.com/api/v1',
    'https://user:password@api.thoranam.com/api/v1',
    'https://api.thoranam.com/api/v1?token=secret',
    'https://api.thoranam.com/api/v1#secret',
    'https://api.thoranam.com/api/v2',
    'file:///api/v1',
  ])('rejects missing or unsafe configuration (%s)', (url) => {
    expect(() => parseApiBaseUrl(url)).toThrow('NEXT_PUBLIC_API_BASE_URL');
  });

  it('reads the configured public value without a production fallback', () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.thoranam.com/api/v1');
    expect(getApiBaseUrl()).toBe('https://api.thoranam.com/api/v1');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', undefined);
    expect(() => getApiBaseUrl()).toThrow('NEXT_PUBLIC_API_BASE_URL');
  });

  it('does not disclose invalid configuration in its error', () => {
    try {
      parseApiBaseUrl('https://user:secret@api.thoranam.com/api/v1');
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain('secret');
    }
  });
});
