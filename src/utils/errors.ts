/**
 * ImageMagick Node.js Wrapper - Error Definitions
 *
 * Custom error classes for ImageMagick operations.
 */

/**
 * Base error class for all ImageMagick-related errors
 */
export class ImageMagickError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ImageMagickError';
    Object.setPrototypeOf(this, ImageMagickError.prototype);
  }
}

/**
 * Error thrown when ImageMagick binary is not found
 */
export class BinaryNotFoundError extends ImageMagickError {
  constructor(binaryPath?: string) {
    const message = binaryPath
      ? `ImageMagick binary not found at: ${binaryPath}`
      : 'ImageMagick binary not found. Please install ImageMagick and ensure it is in your PATH.';
    super(message, 'BINARY_NOT_FOUND');
    this.name = 'BinaryNotFoundError';
    Object.setPrototypeOf(this, BinaryNotFoundError.prototype);
  }
}

/**
 * Error thrown when a command execution fails
 */
export class ExecutionError extends ImageMagickError {
  constructor(
    message: string,
    public readonly command: string,
    public readonly args: string[],
    public readonly exitCode: number,
    public readonly stderr: string,
    public readonly stdout: string
  ) {
    super(message, 'EXECUTION_FAILED');
    this.name = 'ExecutionError';
    Object.setPrototypeOf(this, ExecutionError.prototype);
  }

  /**
   * Get the full command string that was executed
   */
  getFullCommand(): string {
    return `${this.command} ${this.args.join(' ')}`;
  }
}

/**
 * Error thrown when a command times out
 */
export class TimeoutError extends ImageMagickError {
  constructor(
    public readonly command: string,
    public readonly timeoutMs: number
  ) {
    super(`Command timed out after ${timeoutMs}ms: ${command}`, 'TIMEOUT');
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when input file is not found or invalid
 */
export class InputError extends ImageMagickError {
  constructor(
    message: string,
    public readonly filePath?: string
  ) {
    super(message, 'INPUT_ERROR');
    this.name = 'InputError';
    Object.setPrototypeOf(this, InputError.prototype);
  }
}

/**
 * Error thrown when output operation fails
 */
export class OutputError extends ImageMagickError {
  constructor(
    message: string,
    public readonly filePath?: string
  ) {
    super(message, 'OUTPUT_ERROR');
    this.name = 'OutputError';
    Object.setPrototypeOf(this, OutputError.prototype);
  }
}

/**
 * Error thrown when image format is not supported
 */
export class UnsupportedFormatError extends ImageMagickError {
  constructor(
    public readonly format: string,
    public readonly supportedFormats?: string[]
  ) {
    const supported = supportedFormats ? ` Supported formats: ${supportedFormats.join(', ')}` : '';
    super(`Unsupported format: ${format}.${supported}`, 'UNSUPPORTED_FORMAT');
    this.name = 'UnsupportedFormatError';
    Object.setPrototypeOf(this, UnsupportedFormatError.prototype);
  }
}

/**
 * Error thrown when image parsing fails
 */
export class ParseError extends ImageMagickError {
  constructor(
    message: string,
    public readonly rawOutput?: string
  ) {
    super(message, 'PARSE_ERROR');
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}
