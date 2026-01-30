import Cookies from 'js-cookie';

export const handleUnauthorized = () => {
  Cookies.remove('accessToken');
  // Use window.location for a hard redirect to clear memory state
  window.location.href = '/login';
};
