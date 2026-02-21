// API Helper utilities with retry logic and better error handling

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

// Retry logic for failed API calls
export const retryRequest = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => {
      // Retry on network errors or 5xx server errors
      return (
        !error.response ||
        (error.response.status >= 500 && error.response.status < 600)
      );
    }
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's the last attempt or if we shouldn't retry this error
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Check if error is a network error
export const isNetworkError = (error: any): boolean => {
  return (
    !error.response &&
    (error.message === 'Network Error' ||
      error.message === 'Failed to fetch' ||
      error.code === 'ECONNABORTED')
  );
};

// Get user-friendly error message
export const getErrorMessage = (error: any): string => {
  // Network error
  if (isNetworkError(error)) {
    return 'Unable to connect to server. Please check your internet connection and try again.';
  }

  // Server returned an error response
  if (error.response) {
    const { status, data } = error.response;

    // Specific status codes
    switch (status) {
      case 400:
        return data?.error || 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return data?.error || 'This item already exists.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Our team has been notified.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return data?.error || data?.message || 'An unexpected error occurred.';
    }
  }

  // Request timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Generic error
  return error.message || 'An unexpected error occurred. Please try again.';
};

// Validate input before sending to API
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  },

  pincode: (pincode: string): boolean => {
    const pincodeRegex = /^\d{6}$/;
    return pincodeRegex.test(pincode);
  },

  required: (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  },

  minLength: (value: string, min: number): boolean => {
    return value.trim().length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.trim().length <= max;
  },

  number: (value: any): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  positiveNumber: (value: any): boolean => {
    return validateInput.number(value) && parseFloat(value) > 0;
  }
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

// Format error for logging
export const formatErrorForLogging = (error: any, context?: string): object => {
  return {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    context,
    timestamp: new Date().toISOString(),
    url: error.config?.url,
    method: error.config?.method
  };
};

export default {
  retryRequest,
  isNetworkError,
  getErrorMessage,
  validateInput,
  sanitizeInput,
  formatErrorForLogging
};
