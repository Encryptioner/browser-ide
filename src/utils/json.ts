/**
 * Safe JSON parsing utilities
 *
 * Provides safe alternatives to JSON.parse that handle errors gracefully
 * and protect against prototype pollution and other JSON-based attacks.
 */

import { logger } from '@/utils/logger';

/**
 * Safely parse JSON with error handling
 *
 * @param json - The JSON string to parse
 * @param fallback - The value to return if parsing fails
 * @returns The parsed object or the fallback value
 */
export function safeJSONParse<T>(json: string | null | undefined, fallback: T): T {
  if (json === null || json === undefined || json === '') {
    return fallback;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logger.warn('Failed to parse JSON:', error instanceof Error ? error.message : String(error));
    return fallback;
  }
}

/**
 * Safely parse JSON from localStorage
 *
 * @param key - The localStorage key
 * @param fallback - The value to return if parsing fails
 * @returns The parsed object or the fallback value
 */
export function safeParseFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const item = localStorage.getItem(key);
    return safeJSONParse(item, fallback);
  } catch (error) {
    logger.warn(`Failed to read from localStorage (${key}):`, error);
    return fallback;
  }
}

/**
 * Safely stringify an object for storage
 *
 * @param value - The value to stringify
 * @returns The JSON string or undefined if stringification fails
 */
export function safeJSONStringify<T>(value: T): string | undefined {
  try {
    return JSON.stringify(value);
  } catch (error) {
    logger.warn('Failed to stringify JSON:', error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

/**
 * Safely save to localStorage
 *
 * @param key - The localStorage key
 * @param value - The value to save
 * @returns true if successful, false otherwise
 */
export function safeSaveToStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const json = safeJSONStringify(value);
    if (json !== undefined) {
      localStorage.setItem(key, json);
      return true;
    }
    return false;
  } catch (error) {
    logger.warn(`Failed to save to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Parse JSON with prototype pollution protection
 *
 * This function creates a new object with null prototype to prevent
 * prototype pollution attacks via JSON.
 *
 * @param json - The JSON string to parse
 * @param fallback - The value to return if parsing fails
 * @returns The parsed object with null prototype or the fallback value
 */
export function safeJSONParseNoProto<T>(json: string, fallback: T): T {
  if (json === null || json === undefined || json === '') {
    return fallback;
  }

  try {
    // Parse with reviver to remove dangerous properties
    const dangerousProps = ['__proto__', 'constructor', 'prototype'];

    const parsed = JSON.parse(json, (key, value) => {
      // Filter out dangerous properties
      if (dangerousProps.includes(key)) {
        return undefined;
      }
      return value;
    }) as T;

    // If result is an object, freeze it to prevent modifications
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return Object.freeze(parsed) as T;
    }

    return parsed;
  } catch (error) {
    logger.warn('Failed to parse JSON safely:', error instanceof Error ? error.message : String(error));
    return fallback;
  }
}

/**
 * Validate JSON against a schema before parsing
 *
 * @param json - The JSON string to validate
 * @param schema - A function that validates the parsed object
 * @param fallback - The value to return if validation fails
 * @returns The validated object or the fallback value
 */
export function safeJSONParseWithSchema<T>(
  json: string,
  schema: (value: unknown) => value is T,
  fallback: T
): T {
  const parsed = safeJSONParse(json, null);

  if (parsed === null) {
    return fallback;
  }

  if (schema(parsed)) {
    return parsed;
  }

  logger.warn('JSON validation failed:', { json, parsed });
  return fallback;
}

/**
 * Clone an object safely (prevents prototype pollution)
 *
 * @param value - The value to clone
 * @returns A deep cloned copy of the value
 */
export function safeClone<T>(value: T): T {
  try {
    // Use structuredClone for modern browsers
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(value);
    }

    // Fallback to JSON parse/stringify for basic types
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    logger.warn('Failed to clone value:', error instanceof Error ? error.message : String(error));
    return value;
  }
}
