/**
 * SnipLink — API Helper (React version)
 * Centralized fetch wrapper with JWT token management
 */

const API_BASE = '/api';

/**
 * Get the stored JWT token
 */
export const getToken = () => localStorage.getItem('sniplink_token');

/**
 * Set the JWT token
 */
export const setToken = (token) => localStorage.setItem('sniplink_token', token);

/**
 * Remove the JWT token
 */
export const removeToken = () => localStorage.removeItem('sniplink_token');

/**
 * Get the stored user object
 */
export const getUser = () => {
  const user = localStorage.getItem('sniplink_user');
  return user ? JSON.parse(user) : null;
};

/**
 * Set the stored user object
 */
export const setUser = (user) =>
  localStorage.setItem('sniplink_user', JSON.stringify(user));

/**
 * Remove the stored user object
 */
export const removeUser = () => localStorage.removeItem('sniplink_user');

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => !!getToken();

/**
 * Make an API request
 */
export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};

/**
 * Convenience methods
 */
export const get = (endpoint) => request(endpoint, { method: 'GET' });

export const post = (endpoint, body) =>
  request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const patch = (endpoint, body) =>
  request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const del = (endpoint) => request(endpoint, { method: 'DELETE' });

/**
 * Logout — clear all auth data
 */
export const logout = () => {
  removeToken();
  removeUser();
};
