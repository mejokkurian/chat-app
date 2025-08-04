// Authentication utility functions

// Get auth token from storage
export const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Get user data from storage
export const getUserData = () => {
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

// Set authentication state
export const setAuthenticated = (userData, token, rememberMe = false) => {
  if (rememberMe) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  } else {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('userData', JSON.stringify(userData));
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  const userData = getUserData();
  return !!(token && userData);
};

// Logout user
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
};

// Get user's full name
export const getUserFullName = () => {
  const userData = getUserData();
  if (userData) {
    return `${userData.firstName} ${userData.lastName}`;
  }
  return '';
};

// Get user's email
export const getUserEmail = () => {
  const userData = getUserData();
  return userData ? userData.email : '';
};

// Get user's ID
export const getUserId = () => {
  const userData = getUserData();
  return userData ? userData._id : '';
};

// Check if token is expired (basic check)
export const isTokenExpired = () => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    // Basic JWT expiration check (this is a simplified version)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true, message: '' };
};

// Format user data for API requests
export const formatUserData = (userData) => {
  return {
    firstName: userData.firstName?.trim(),
    lastName: userData.lastName?.trim(),
    email: userData.email?.toLowerCase().trim(),
    password: userData.password
  };
}; 