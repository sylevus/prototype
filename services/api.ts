const BASE_URL = 'http://localhost:5095/api';

const getAuthHeaders = () => {
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
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async post(endpoint: string, body: any) {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
};

export default api;
