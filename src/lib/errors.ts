import { ApiError, ErrorCode } from '@zk-email/sdk';

/**
 * Get a user-friendly error message from an error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Return specific messages based on error code
    switch (error.code) {
      case ErrorCode.NOT_FOUND:
      case ErrorCode.BLUEPRINT_NOT_FOUND:
        return 'The requested resource was not found';
      case ErrorCode.PROOF_NOT_FOUND:
        return 'The proof was not found';
      case ErrorCode.UNAUTHORIZED:
        return 'Please sign in to continue';
      case ErrorCode.FORBIDDEN:
        return 'You do not have permission to perform this action';
      case ErrorCode.INVALID_BODY:
      case ErrorCode.INVALID_REQUEST:
        return error.message || 'Invalid request';
      case ErrorCode.ALREADY_EXISTS:
        return 'This resource already exists';
      case ErrorCode.INTERNAL_ERROR:
        return 'An unexpected error occurred. Please try again later.';
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if an error is a specific API error code
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code;
}

/**
 * Check if error is a "not found" error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.isNotFoundError();
}

/**
 * Check if error is an authentication error (401/403)
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.isAuthError();
}

/**
 * Check if error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof ApiError && error.isValidationError();
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && error.isServerError();
}
