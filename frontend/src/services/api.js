/*
 * Tiny wrapper around fetch for the Laravel API.
 * VITE_API_URL (e.g. http://localhost:8000/api) turns the API on; without it the
 * site keeps working with the bundled demo data, so the frontend never breaks.
 */

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const apiEnabled = Boolean(API_URL);

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // Laravel validation errors: { field: [messages] }
  }
}

export async function api(path, { method = 'GET', body, token, timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const isForm = body instanceof FormData; // file uploads: the browser sets the multipart header

  try {
    const response = await fetch(API_URL + path, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });

    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(data?.message || 'Request failed (' + response.status + ')', response.status, data?.errors);
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('The server took too long to answer.', 0);
    if (error instanceof ApiError) throw error;
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  } finally {
    clearTimeout(timer);
  }
}
