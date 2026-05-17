const API_PREFIX = "/v1";

export const endpoints = {
  auth: {
    register: `${API_PREFIX}/auth/register`,
    login: `${API_PREFIX}/auth/login`,
    refresh: `${API_PREFIX}/auth/refresh`,
    logout: `${API_PREFIX}/auth/logout`,
    me: `${API_PREFIX}/auth/me`,
    onboarding: `${API_PREFIX}/auth/onboarding`,
  },
  ai: {
    generate: `${API_PREFIX}/ai/generate`,
  },
  affirmations: {
    list: `${API_PREFIX}/affirmations`,
    detail: (id: string) => `${API_PREFIX}/affirmations/${id}`,
  },
  mood: {
    log: `${API_PREFIX}/mood`,
    history: `${API_PREFIX}/mood`,
    latest: `${API_PREFIX}/mood/latest`,
  },
  stats: `${API_PREFIX}/user/stats`,
  session: {
    today: `${API_PREFIX}/session/today`,
  },
} as const;
