/**
 * Error Handling Utility Tests
 *
 * Tests for error classification and handling functions.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyError,
  getErrorMessage,
  NetworkError,
  AuthenticationError,
  SubscriptionError,
  RateLimitError,
  ValidationError,
  PredictionError,
  safeAsync,
} from '../errors';

describe('Error Classes', () => {
  it('should create NetworkError with correct properties', () => {
    const error = new NetworkError('Connection failed');
    expect(error.name).toBe('NetworkError');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.message).toBe('Connection failed');
  });

  it('should create AuthenticationError with correct properties', () => {
    const error = new AuthenticationError('Please sign in');
    expect(error.name).toBe('AuthenticationError');
    expect(error.code).toBe('AUTH_ERROR');
    expect(error.statusCode).toBe(401);
  });

  it('should create SubscriptionError with correct properties', () => {
    const error = new SubscriptionError('Pro required');
    expect(error.name).toBe('SubscriptionError');
    expect(error.code).toBe('SUBSCRIPTION_ERROR');
    expect(error.statusCode).toBe(403);
  });

  it('should create RateLimitError with correct properties', () => {
    const error = new RateLimitError('Too many requests');
    expect(error.name).toBe('RateLimitError');
    expect(error.code).toBe('RATE_LIMIT_ERROR');
    expect(error.statusCode).toBe(429);
  });
});

describe('classifyError', () => {
  it('should return NetworkError for network-related errors', () => {
    const error = new Error('Network connection failed');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(NetworkError);
  });

  it('should return AuthenticationError for auth-related errors', () => {
    const error = new Error('Authentication failed');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(AuthenticationError);
  });

  it('should return RateLimitError for limit-related errors', () => {
    const error = new Error('Rate limit exceeded');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(RateLimitError);
  });

  it('should return ValidationError for validation-related errors', () => {
    const error = new Error('Invalid input data');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(ValidationError);
  });

  it('should return original AppError if already classified', () => {
    const original = new PredictionError('Prediction failed');
    const classified = classifyError(original);
    expect(classified).toBe(original);
  });

  it('should handle string errors', () => {
    const classified = classifyError('Something went wrong');
    expect(classified).toBeInstanceOf(PredictionError);
    expect(classified.message).toBe('Something went wrong');
  });
});

describe('getErrorMessage', () => {
  it('should return user-friendly message for NetworkError', () => {
    const error = new NetworkError();
    expect(getErrorMessage(error)).toContain('Network error');
  });

  it('should return user-friendly message for AuthenticationError', () => {
    const error = new AuthenticationError();
    expect(getErrorMessage(error)).toContain('sign in');
  });

  it('should return user-friendly message for SubscriptionError', () => {
    const error = new SubscriptionError('This feature requires Pro');
    expect(getErrorMessage(error)).toBe('This feature requires Pro.');
  });

  it('should return user-friendly message for RateLimitError', () => {
    const error = new RateLimitError();
    expect(getErrorMessage(error)).toContain('usage limit');
  });
});

describe('safeAsync', () => {
  it('should return data when function succeeds', async () => {
    const fn = async () => 'success';
    const result = await safeAsync(fn);
    expect(result.data).toBe('success');
    expect(result.error).toBeNull();
  });

  it('should return error when function fails', async () => {
    const fn = async () => {
      throw new Error('Test error');
    };
    const result = await safeAsync(fn);
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(PredictionError);
  });

  it('should classify errors correctly', async () => {
    const fn = async () => {
      throw new Error('Network error occurred');
    };
    const result = await safeAsync(fn);
    expect(result.error).toBeInstanceOf(NetworkError);
  });
});
