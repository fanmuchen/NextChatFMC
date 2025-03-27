import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// Environment variables for Elasticsearch configuration
const ENABLE_ELASTIC_LOG = process.env.ENABLE_ELASTIC_LOG === "true";
const ELASTIC_LOG_HOST = process.env.ELASTIC_LOG_HOST || "";
// Auth is optional for non-secure Elasticsearch
const ELASTIC_LOG_USERNAME = process.env.ELASTIC_LOG_USERNAME || "";
const ELASTIC_LOG_PASSWORD = process.env.ELASTIC_LOG_PASSWORD || "";
const ELASTIC_LOG_INDEX = process.env.ELASTIC_LOG_INDEX || "chat-fmc-ai";

// Maximum size of request body to log (1MB)
const MAX_BODY_SIZE = 1024 * 1024;

// Original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

/**
 * Format the index name with current date if it contains date placeholders
 */
function formatIndexName(indexName: string, suffix: string = ""): string {
  // Replace date pattern with actual date
  if (indexName.includes("%{+")) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    // Replace the date pattern with actual date
    const formattedDate = `${year}.${month}.${day}`;
    indexName = indexName.replace(/%\{\+YYYY\.MM\.dd\}/, formattedDate);
  }

  // Append suffix if provided and return lowercase (ES requirement)
  return (indexName + suffix).toLowerCase();
}

/**
 * Checks if the content type is text-based
 */
function isTextBasedContent(contentType: string | null): boolean {
  if (!contentType) return false;

  const textBasedTypes = [
    "text/",
    "application/json",
    "application/xml",
    "application/javascript",
    "application/x-www-form-urlencoded",
  ];

  return textBasedTypes.some((type) => contentType.includes(type));
}

/**
 * Safely extracts and parses the request body for logging
 */
async function extractRequestBody(req: NextRequest): Promise<any> {
  try {
    const contentType = req.headers.get("content-type");

    // Skip body extraction for non-text content types
    if (!contentType || !isTextBasedContent(contentType)) {
      return { _note: "Binary or non-text content not logged" };
    }

    // Skip for GET/HEAD requests which typically don't have bodies
    if (req.method === "GET" || req.method === "HEAD") {
      return null;
    }

    // Clone the request to avoid consuming the body
    const clonedReq = req.clone();

    // Handle different content types
    if (contentType.includes("application/json")) {
      const textBody = await clonedReq.text();

      // Check size before processing
      if (textBody.length > MAX_BODY_SIZE) {
        return {
          _note: "Request body too large to log",
          size: textBody.length,
        };
      }

      try {
        return JSON.parse(textBody);
      } catch (e) {
        return { raw: textBody };
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await clonedReq.formData();
      const result: Record<string, any> = {};

      // Convert FormData to regular object
      formData.forEach((value, key) => {
        // Skip large values and binary data
        if (typeof value === "string" && value.length <= MAX_BODY_SIZE) {
          result[key] = value;
        } else {
          result[key] = "[content too large or binary data]";
        }
      });

      return result;
    } else if (contentType.includes("text/")) {
      const textBody = await clonedReq.text();

      // Check size before including
      if (textBody.length > MAX_BODY_SIZE) {
        return {
          _note: "Request body too large to log",
          size: textBody.length,
        };
      }

      return { body: textBody };
    } else {
      return { _note: "Content type not handled for detailed logging" };
    }
  } catch (error) {
    return {
      _error: "Failed to extract request body",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send a log message to Elasticsearch
 */
async function sendLogToElastic(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  metadata?: Record<string, any>,
): Promise<void> {
  if (!ENABLE_ELASTIC_LOG || !ELASTIC_LOG_HOST) {
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const formattedIndexName = formatIndexName(ELASTIC_LOG_INDEX, `-${level}`);
    const url = `${ELASTIC_LOG_HOST}/${formattedIndexName}/_doc`;

    // Prepare the log entry
    const logEntry = {
      level,
      message,
      metadata,
      timestamp,
      "@timestamp": timestamp,
    };

    // Axios request options
    const options: any = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Add auth if available
    if (ELASTIC_LOG_USERNAME && ELASTIC_LOG_PASSWORD) {
      options.auth = {
        username: ELASTIC_LOG_USERNAME,
        password: ELASTIC_LOG_PASSWORD,
      };
    }

    // Send log to Elasticsearch
    await axios.post(url, logEntry, options);
  } catch (error) {
    // Use original console methods to avoid infinite loops
    originalConsole.error(
      "[ElasticLogger] Failed to send log to Elasticsearch:",
      error,
    );
  }
}

/**
 * Logs server-side request information to Elasticsearch
 */
export async function logToElastic(
  req: NextRequest,
  additionalData: Record<string, any> = {},
) {
  if (!ENABLE_ELASTIC_LOG || !ELASTIC_LOG_HOST) {
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    // Format the index name with the current date and server suffix
    const formattedIndexName = formatIndexName(ELASTIC_LOG_INDEX, "-server");
    const url = `${ELASTIC_LOG_HOST}/${formattedIndexName}/_doc`;

    // Extract request body if possible
    const requestBody = await extractRequestBody(req);

    // Extract relevant request information
    const requestInfo = {
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers),
      ip: req.ip || "",
      geo: req.geo || {},
      userAgent: req.headers.get("user-agent") || "",
      referrer: req.headers.get("referer") || "",
      // Include request body if available
      body: requestBody,
      ...additionalData,
      timestamp,
      "@timestamp": timestamp,
    };

    // Axios request options
    const options: any = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Add auth if available
    if (ELASTIC_LOG_USERNAME && ELASTIC_LOG_PASSWORD) {
      options.auth = {
        username: ELASTIC_LOG_USERNAME,
        password: ELASTIC_LOG_PASSWORD,
      };
    }

    // Send log to Elasticsearch
    await axios.post(url, requestInfo, options);
  } catch (error) {
    // Use original console to avoid infinite loops
    originalConsole.error("Failed to log to Elasticsearch:", error);
  }
}

/**
 * Middleware that logs all API requests to Elasticsearch
 */
export async function elasticLoggingMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Process the request
    const response = await handler(req);

    // Log the request with response info
    await logToElastic(req, {
      status: response.status,
      statusText: response.statusText,
      responseTime: Date.now() - startTime,
      level: "info",
    });

    return response;
  } catch (error) {
    // Log errors
    await logToElastic(req, {
      error: error instanceof Error ? error.message : String(error),
      level: "error",
      responseTime: Date.now() - startTime,
    });
    throw error;
  }
}

/**
 * Wraps an API route handler with Elasticsearch logging
 * @param handler The API route handler to wrap
 * @returns A new handler with logging
 */
export function withElasticLogging<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
): (req: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (req: NextRequest, ...args: T) => {
    const startTime = Date.now();

    try {
      // Process the request with all arguments
      const response = await handler(req, ...args);

      // Log the request with response info
      await logToElastic(req, {
        status: response.status,
        statusText: response.statusText,
        responseTime: Date.now() - startTime,
        level: "info",
        path: req.nextUrl.pathname,
        params: args[0]?.params, // Include route params if available
      });

      return response;
    } catch (error) {
      // Log errors
      await logToElastic(req, {
        error: error instanceof Error ? error.message : String(error),
        level: "error",
        responseTime: Date.now() - startTime,
        path: req.nextUrl.pathname,
      });
      throw error;
    }
  };
}

/**
 * Setup console method overrides to log to Elasticsearch
 * This should be called once during application initialization
 */
export function setupElasticConsoleLogger(): void {
  if (!ENABLE_ELASTIC_LOG) {
    return;
  }

  // Override console.log
  console.log = function (...args: any[]): void {
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");

    // Send to Elasticsearch asynchronously (don't await)
    sendLogToElastic("info", message).catch(() => {});

    // Call original method
    originalConsole.log.apply(console, args);
  };

  // Override console.info
  console.info = function (...args: any[]): void {
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");

    // Send to Elasticsearch asynchronously (don't await)
    sendLogToElastic("info", message).catch(() => {});

    // Call original method
    originalConsole.info.apply(console, args);
  };

  // Override console.warn
  console.warn = function (...args: any[]): void {
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");

    // Send to Elasticsearch asynchronously (don't await)
    sendLogToElastic("warn", message).catch(() => {});

    // Call original method
    originalConsole.warn.apply(console, args);
  };

  // Override console.error
  console.error = function (...args: any[]): void {
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");

    // Send to Elasticsearch asynchronously (don't await)
    sendLogToElastic("error", message).catch(() => {});

    // Call original method
    originalConsole.error.apply(console, args);
  };

  // Override console.debug
  console.debug = function (...args: any[]): void {
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");

    // Send to Elasticsearch asynchronously (don't await)
    sendLogToElastic("debug", message).catch(() => {});

    // Call original method
    originalConsole.debug.apply(console, args);
  };
}

// Initialize the console logger when this module is first imported
// This ensures the console logger is active for the server-side environment
if (typeof window === "undefined") {
  // Only run on server-side
  setupElasticConsoleLogger();
  originalConsole.log(
    "[ElasticLogger] Server-side console logging initialized",
  );
}
