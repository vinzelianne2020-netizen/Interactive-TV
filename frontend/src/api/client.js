import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const backendRootUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export const client = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
});

export function initCsrfCookie() {
  return axios.get(`${backendRootUrl}/sanctum/csrf-cookie`, {
    withCredentials: true,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
  });
}
