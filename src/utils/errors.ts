/**
 * Error Handling Utilities
 *
 * Provides consistent error handling across the application.
 * Includes custom error types, error classification, and user-friendly messages.
 */

// Custom error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error. Please check your connection.', originalError?: unknown) {
    super(message, 'NETWORK_ERROR', undefined, originalError);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required. Please sign in.', originalError?: unknown) {
    super(message, 'AUTH_ERROR', 401, originalError);
    this.name = 'AuthenticationError';
  }
}

export class SubscriptionError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'SUBSCRIPTION_ERROR', 403, originalError);
    this.name = 'SubscriptionError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'You have reached your usage limit.', originalError?: unknown) {
    super(message, 'RATE_LIMIT_ERROR', 429, originalError);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, originalError);
    this.name = 'ValidationError';
  }
}

export class PredictionError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'PREDICTION_ERROR', undefined, originalError);
    this.name = 'PredictionError';
  }
}

// Error classification
export function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout')
    ) {
      return new NetworkError(error.message, error);
    }

    // Auth errors
    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('signin') ||
      message.includes('jwt')
    ) {
      return new AuthenticationError(error.message, error);
    }

    // Rate limit errors
    if (
      message.includes('limit') ||
      message.includes('quota') ||
      message.includes('exceeded')
    ) {
      return new RateLimitError(error.message, error);
    }

    // Validation errors
    if (
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('validation')
    ) {
      return new ValidationError(error.message, error);
    }

    // Generic error with original message
    return new AppError(error.message, 'UNKNOWN_ERROR', undefined, error);
  }

  // Non-Error types
  return new AppError(
    typeof error === 'string' ? error : 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    undefined,
    error
  );
}

// User-friendly error messages
export function getErrorMessage(error: AppError): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.';
    case 'AUTH_ERROR':
      return 'Please sign in to continue.';
    case 'SUBSCRIPTION_ERROR':
      return error.message || 'This feature requires a Pro subscription.';
    case 'RATE_LIMIT_ERROR':
      return error.message || 'You have reached your usage limit. Upgrade to Pro for unlimited access.';
    case 'VALIDATION_ERROR':
      return error.message || 'Please check your input and try again.';
    case 'PREDICTION_ERROR':
      return error.message || 'Failed to generate prediction. Please try again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

// Error logging
export function logError(error: unknown, context?: string) {
  const classified = classifyError(error);
  const contextPrefix = context ? `[${context}] ` : '';

  if (classified.originalError instanceof Error) {
    console.error(`${contextPrefix}Error:`, classified.message, classified.originalError);
  } else {
    console.error(`${contextPrefix}Error:`, classified.message, classified);
  }

  // In production, you might want to send errors to a logging service
  // Example: sendToSentry(classified, context);
}

// Safe async wrapper - catches and classifies errors
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const classified = classifyError(error);
    logError(classified, context);
    return { data: null, error: classified };
  }
}

// Retry wrapper for network requests
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
    retryIf?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoff = true,
    retryIf = (error) => {
      const classified = classifyError(error);
      return classified.code === 'NETWORK_ERROR';
    },
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !retryIf(error)) {
        throw error;
      }

      const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Debounce utility for preventing duplicate API calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

// Throttle utility for limiting API call frequency
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limitMs);
    }
  };
}

// Abort controller helper for cancellable requests
export function createCancellableRequest<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs?: number
): { promise: Promise<T>; cancel: () => void } {
  const controller = new AbortController();
  const { signal } = controller;

  const promise = Promise.race([
    fn(signal),
    timeoutMs
      ? new Promise<never>((_, reject) =>
          setTimeout(() => {
            controller.abort();
            reject(new Error('Request timeout'));
          }, timeoutMs)
        )
      : Promise.reject(),
  ]);

  const cancel = () => controller.abort();

  return { promise, cancel };
}
