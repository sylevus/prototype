const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5095/api' : 'https://grokapi.fly.dev/api');

let refreshPromise: Promise<void> | null = null;

const parseJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const isTokenNearExpiry = (token: string): boolean => {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeUntilExpiry = expirationTime - currentTime;
  
  // Check if token expires in the next 30 minutes (30 * 60 * 1000 ms)
  return timeUntilExpiry <= 30 * 60 * 1000;
};

const refreshTokenIfNeeded = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token || !isTokenNearExpiry(token)) return;

  // Prevent multiple refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        console.log('Token refreshed successfully');
      } else {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('token');
      window.location.href = '/';
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const getAuthHeaders = async (): Promise<HeadersInit> => {
  await refreshTokenIfNeeded();
  
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // Ignore if response is not json
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

const api = {
  async get(endpoint: string) {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async post(endpoint: string, body: any) {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  // A version of post that doesn't require auth, for login/signup
  async postPublic(endpoint: string, body: any) {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async put(endpoint: string, body: any) {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async delete(endpoint: string) {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async startDmSession(sessionId: string) {
    const response = await fetch(`${BASE_URL}/dm/session/${sessionId}/start`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async submitPlayerAction(sessionId: string, action: string) {
    const response = await fetch(`${BASE_URL}/dm/session/${sessionId}/action`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action }),
    });
    return handleResponse(response);
  },

  async generateCharacterImage(description: string, style: string = 'fantasy') {
    const response = await fetch(`${BASE_URL}/image/generate`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ description, style }),
    });
    return handleResponse(response);
  },

  async saveCharacterImage(characterId: number, imageUrl: string) {
    const response = await fetch(`${BASE_URL}/image/character/${characterId}/image`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ imageUrl }),
    });
    return handleResponse(response);
  },

  async getSessionHistory(sessionId: string, limit: number = 5) {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/history?limit=${limit}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getApiProvider() {
    const response = await fetch(`${BASE_URL}/admin/api-provider`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async setApiProvider(provider: number) {
    const response = await fetch(`${BASE_URL}/admin/api-provider/set`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ provider }),
    });
    return handleResponse(response);
  },
};

export default api;
