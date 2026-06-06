const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const getOrigin = () => {
  const configuredOrigin = import.meta.env.VITE_API_ORIGIN;
  if (configuredOrigin) {
    return trimTrailingSlash(configuredOrigin);
  }

  return '';
};

const API_ORIGIN = getOrigin();

export const publicApiUrl = (path = '') => `${API_ORIGIN}/api/public${path}`;
export const authApiUrl = (path = '') => `${API_ORIGIN}/api/auth${path}`;
export const staffApiUrl = (path = '') => `${API_ORIGIN}/api/staff${path}`;

export const socketUrl = import.meta.env.VITE_SOCKET_URL
  ? trimTrailingSlash(import.meta.env.VITE_SOCKET_URL)
  : API_ORIGIN || window.location.origin;
