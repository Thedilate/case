function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.dev')) {
    // В GitHub Codespaces: меняем порт 3000 → 8000 в текущем URL
    return window.location.origin.replace('-3000.', '-8000.');
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

const API_URL = getApiUrl();

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  console.log('[API] Fetching:', `${API_URL}${path}`);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-user-id': token } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  users: {
    me: () => fetcher('/api/v1/users/me'),
    profile: (id: string) => fetcher(`/api/v1/users/${id}/profile`),
  },
  courses: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetcher(`/api/v1/courses${qs}`);
    },
    get: (id: string) => fetcher(`/api/v1/courses/${id}`),
    recommended: () => fetcher('/api/v1/courses/recommended'),
    search: (q: string) => fetcher(`/api/v1/courses/search?q=${encodeURIComponent(q)}`),
  },
  enrollments: {
    list: () => fetcher('/api/v1/enrollments'),
    progress: () => fetcher('/api/v1/enrollments/progress'),
  },
  career: {
    myPath: () => fetcher('/api/v1/career/my-path'),
    gapAnalysis: () => fetcher('/api/v1/career/gap-analysis'),
    idp: () => fetcher('/api/v1/career/idp'),
  },
  chat: {
    history: () => fetcher('/api/v1/agents/tutor/history'),
    send: (message: string, sessionId?: string) =>
      fetcher('/api/v1/agents/tutor/chat', {
        method: 'POST',
        body: JSON.stringify({ message, session_id: sessionId }),
      }),
  },
  analytics: {
    dashboard: () => fetcher('/api/v1/analytics/dashboard'),
  },
};
