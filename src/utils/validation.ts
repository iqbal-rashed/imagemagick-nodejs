/**
 * ImageMagick Node.js Wrapper - Input Validation Utilities
 *
 * Security utilities for validating and sanitizing inputs.
 */

import * as path from 'path';
import { warn } from './logger';

/**
 * Sanitize a command argument to prevent command injection
 *
 * This function validates that arguments don't contain potentially dangerous patterns
 * that could lead to command injection, even when using spawn() with array arguments.
 *
 * @param arg - The argument to validate
 * @returns The sanitized argument
 * @throws Error if the argument contains dangerous patterns
 */
export function sanitizeArgument(arg: string): string {
  if (typeof arg !== 'string') {
    throw new Error(`Argument must be a string, got ${typeof arg}`);
  }

  // Check for null bytes
  if (arg.includes('\0')) {
    throw new Error('Argument contains null byte, which is not allowed');
  }

  // Warn about potentially dangerous shell characters
  // Note: These are allowed in ImageMagick (e.g., for geometry strings like "800x600+10+20")
  // but we document them for awareness
  const dangerousChars = ['$', '`', '\\', '"', "'"];
  const foundDangerous = dangerousChars.filter((char) => arg.includes(char));

  if (foundDangerous.length > 0) {
    warn(
      `Argument contains special characters: ${foundDangerous.join(', ')}. ` +
        'Ensure this argument is properly sanitized.'
    );
  }

  // Check for suspicious patterns that might indicate injection attempts
  const injectionPatterns = [
    /\|\s*\w+/, // Pipe to command
    /;\s*\w+/, // Command separator
    /&\s*\w+/, // Command separator
    /\$\([^)]+\)/, // Command substitution
    /`[^`]+`/, // Backtick command substitution
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(arg)) {
      throw new Error(
        `Argument contains potentially dangerous pattern: ${arg}. ` +
          'This may indicate a command injection attempt.'
      );
    }
  }

  return arg;
}

/**
 * Sanitize an array of command arguments
 *
 * @param args - Array of arguments to sanitize
 * @returns Sanitized array of arguments
 */
export function sanitizeArguments(args: string[]): string[] {
  if (!Array.isArray(args)) {
    throw new Error('Arguments must be an array');
  }

  return args.map((arg, index) => {
    try {
      return sanitizeArgument(arg);
    } catch (error) {
      throw new Error(
        `Invalid argument at index ${index}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * Validate and sanitize a file path
 *
 * Ensures the path is within the allowed directory (if specified) and doesn't
 * contain path traversal attempts.
 *
 * @param filePath - The file path to validate
 * @param allowedDir - Optional allowed base directory
 * @returns The resolved, validated path
 * @throws Error if the path is invalid or contains traversal attempts
 */
export function validateFilePath(filePath: string, allowedDir?: string): string {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('File path must be a non-empty string');
  }

  // Resolve to absolute path
  const resolved = path.resolve(filePath);

  // If an allowed directory is specified, ensure the path is within it
  if (allowedDir) {
    const allowedResolved = path.resolve(allowedDir);

    if (!resolved.startsWith(allowedResolved)) {
      throw new Error(
        `Path traversal detected: ${filePath} is not within allowed directory: ${allowedDir}`
      );
    }
  }

  // Check for suspicious path components
  const pathParts = filePath.split(path.sep);
  for (const part of pathParts) {
    // Warn about potentially dangerous filenames
    if (part === '..' || part === '.') {
      warn(`Path contains ${part} component: ${filePath}`);
    }
  }

  return resolved;
}

/**
 * Validate a directory path
 *
 * @param dirPath - The directory path to validate
 * @returns The validated directory path
 */
export function validateDirectoryPath(dirPath: string): string {
  if (typeof dirPath !== 'string' || dirPath.trim() === '') {
    throw new Error('Directory path must be a non-empty string');
  }

  const resolved = path.resolve(dirPath);

  return resolved;
}

/**
 * Validate a numeric parameter
 *
 * @param value - The value to validate
 * @param paramName - Parameter name for error messages
 * @param min - Optional minimum value
 * @param max - Optional maximum value
 * @returns The validated number
 */
export function validateNumber(value: unknown, paramName: string, min?: number, max?: number): number {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;

  if (isNaN(num)) {
    throw new Error(`${paramName} must be a valid number, got: ${value}`);
  }

  if (min !== undefined && num < min) {
    throw new Error(`${paramName} must be at least ${min}, got: ${num}`);
  }

  if (max !== undefined && num > max) {
    throw new Error(`${paramName} must be at most ${max}, got: ${num}`);
  }

  return num;
}

/**
 * Validate a string parameter
 *
 * @param value - The value to validate
 * @param paramName - Parameter name for error messages
 * @param maxLength - Optional maximum length
 * @returns The validated string
 */
export function validateString(value: unknown, paramName: string, maxLength?: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${paramName} must be a string, got: ${typeof value}`);
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new Error(`${paramName} must not exceed ${maxLength} characters`);
  }

  return value;
}
