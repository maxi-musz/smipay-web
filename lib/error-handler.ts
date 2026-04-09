/**
 * Error Handler - Converts technical errors to user-friendly messages
 */

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * Convert API errors to user-friendly messages
 */
export function handleApiError(error: unknown): ApiError {
  const err = error as Record<string, unknown>;
  if (err && typeof err.statusCode === "number" && typeof err.message === "string") {
    const status = err.statusCode as number;
    const rawMsg = err.message as string;

    if (status === 404 || rawMsg.startsWith("Cannot GET") || rawMsg.startsWith("Cannot POST")) {
      return {
        message: "This service is temporarily unavailable. Please try again later.",
        code: "SERVICE_UNAVAILABLE",
        statusCode: status,
      };
    }

    if (status >= 500) {
      return {
        message: "Our servers are currently experiencing issues. Please try again in a few moments.",
        code: "SERVER_ERROR",
        statusCode: status,
      };
    }

    return {
      message: rawMsg,
      code: "API_ERROR",
      statusCode: status,
    };
  }

  if (!err.response) {
    if (err.code === "ECONNABORTED" || (err.message as string)?.includes("timeout")) {
      return {
        message:
          "Request timed out. Please check your internet connection and try again.",
        code: "TIMEOUT",
      };
    }

    if (err.code === "ERR_NETWORK" || (err.message as string)?.includes("Network Error")) {
      return {
        message:
          "Unable to connect to our servers. Please check your internet connection and try again.",
        code: "NETWORK_ERROR",
      };
    }

    return {
      message:
        "We're experiencing technical difficulties. Please try again in a few moments.",
      code: "UNKNOWN_ERROR",
    };
  }

  const response = err.response as { status?: number; data?: Record<string, unknown> } | undefined;
  const status = response?.status;
  const responseData = response?.data;

  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      // Bad request - validation errors
      if (responseData?.message) {
      if (Array.isArray(responseData.message)) {
        return {
          message: (responseData.message as string[]).join(", "),
            code: "VALIDATION_ERROR",
            statusCode: 400,
          };
        }
        return {
          message: responseData.message as string,
          code: "BAD_REQUEST",
          statusCode: 400,
        };
      }
      return {
        message: "Invalid request. Please check your information and try again.",
        code: "BAD_REQUEST",
        statusCode: 400,
      };

    case 401:
      // Unauthorized
      return {
        message:
          (responseData?.message as string) ||
          "Invalid credentials. Please check your email/phone and password.",
        code: "UNAUTHORIZED",
        statusCode: 401,
      };

    case 403:
      // Forbidden
      return {
        message:
          (responseData?.message as string) ||
          "You don't have permission to perform this action.",
        code: "FORBIDDEN",
        statusCode: 403,
      };

    case 404:
      // Not found - This is where we make it user-friendly!
      return {
        message:
          "We're experiencing technical difficulties. Our team has been notified. Please try again later.",
        code: "SERVICE_UNAVAILABLE",
        statusCode: 404,
      };

    case 409:
      return {
        message:
          (responseData?.message as string) ||
          "This information is already registered. Please use different details.",
        code: "CONFLICT",
        statusCode: 409,
      };

    case 429: {
      // Too many requests (Nest may put payload on `data` or at top level)
      const nested = (responseData?.data as Record<string, unknown>)?.retry_after;
      const top = responseData?.retry_after;
      const retryAfter =
        (typeof nested === "number" ? nested : undefined) ??
        (typeof top === "number" ? top : undefined) ??
        120;
      const retryMessage =
        retryAfter > 60
          ? `${Math.ceil(retryAfter / 60)} minute${Math.ceil(retryAfter / 60) === 1 ? "" : "s"}`
          : `${retryAfter} seconds`;

      const isTxCooldown = responseData?.error === "TX_FAILURE_COOLDOWN";
      const baseMsg =
        (responseData?.message as string) ||
        (isTxCooldown
          ? "Too many failed purchases recently."
          : "Too many attempts.");

      const message = isTxCooldown
        ? `${baseMsg} You can try again in ${retryMessage}.`
        : baseMsg.includes("try again")
          ? baseMsg
          : `${baseMsg} Please try again in ${retryMessage}.`;

      return {
        message,
        code: isTxCooldown ? "TX_FAILURE_COOLDOWN" : "RATE_LIMIT_EXCEEDED",
        statusCode: 429,
      };
    }

    case 500:
    case 502:
    case 503:
    case 504:
      // Server errors
      return {
        message:
          "Our servers are currently experiencing issues. Please try again in a few moments.",
        code: "SERVER_ERROR",
        statusCode: status,
      };

    default:
      return {
        message:
          (responseData?.message as string) ||
          "Something went wrong. Please try again or contact support if the issue persists.",
        code: "UNKNOWN_ERROR",
        statusCode: status,
      };
  }
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  const apiError = handleApiError(error);
  return apiError.message;
}

/**
 * Check if error is a network/connectivity issue
 */
export function isNetworkError(error: unknown): boolean {
  const err = error as Record<string, unknown>;
  if (!err.response) {
    return (
      err.code === "ERR_NETWORK" ||
      err.code === "ECONNABORTED" ||
      (err.message as string)?.includes("Network Error") ||
      (err.message as string)?.includes("timeout")
    );
  }
  return false;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  const err = error as { response?: { status?: number } };
  const status = err.response?.status;
  return typeof status === "number" && status >= 500 && status < 600;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: unknown): boolean {
  const err = error as { response?: { status?: number } };
  const status = err.response?.status;
  return typeof status === "number" && status >= 400 && status < 500;
}


