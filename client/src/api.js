import { useEffect, useState } from 'react';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get uncertain() {
    return this.code === 'OUTCOME_UNKNOWN' || this.code === 'NO_RESPONSE';
  }
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NO_RESPONSE', 'The server did not respond.');
  }
  const data = await response.json().catch(() => null);
  if (response.ok) {
    return data;
  }
  if (!data?.error) {
    throw new ApiError(response.status, 'NO_RESPONSE', 'The server did not respond.');
  }
  throw new ApiError(response.status, data.error.code, data.error.message, data.error.details);
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
};

export function useApi(path, { delay = 0, reload } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: path !== null });
  useEffect(() => {
    if (path === null) {
      setState({ data: null, error: null, loading: false });
      return undefined;
    }
    let current = true;
    setState((previous) => ({ ...previous, loading: true }));
    const timer = setTimeout(() => {
      api.get(path)
        .then((data) => current && setState({ data, error: null, loading: false, path }))
        .catch((error) => current && setState((previous) => ({ ...previous, error, loading: false })));
    }, delay);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [path, delay, reload]);
  return state;
}
