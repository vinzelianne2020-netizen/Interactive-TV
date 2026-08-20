import axios from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
const isLocalBrowser = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const apiBaseUrl = !isLocalBrowser && configuredApiBaseUrl.includes('localhost')
  ? '/api'
  : configuredApiBaseUrl;
const backendRootUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export const client = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
});

export function initCsrfCookie() {
  return axios.get(`${backendRootUrl}/sanctum/csrf-cookie`, {
    withCredentials: true,
    withXSRFToken: true,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
  });
}
