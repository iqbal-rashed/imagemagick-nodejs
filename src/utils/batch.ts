/**
 * ImageMagick Node.js Wrapper - Batch Processing Utilities
 *
 * Helpers for processing multiple images with progress tracking.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execute } from '../core/executor';
import { ExecuteOptions, ExecuteResult } from '../core/types';
import { validateFilePath, validateDirectoryPath } from './validation';

/**
 * Common image format extensions for validation
 */
const VALID_IMAGE_FORMATS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'heic',
  'heif',
  'tiff',
  'tif',
  'bmp',
  'ico',
  'pdf',
  'svg',
  'psd',
  'eps',
  'dng',
  'cr2',
  'nef',
  'raw',
  'jp2',
  'jxr',
]);

/**
 * Validate that a format is a supported image format
 */
function validateImageFormat(format: string): void {
  const normalizedFormat = format.toLowerCase().replace(/^\.+/, '');
  if (!VALID_IMAGE_FORMATS.has(normalizedFormat)) {
    throw new Error(
      `Unsupported image format: ${format}. ` +
        `Supported formats: ${Array.from(VALID_IMAGE_FORMATS).sort().join(', ')}`
    );
  }
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: BatchProgress) => void;

/**
 * Batch processing progress information
 */
export interface BatchProgress {
  /** Current file being processed */
  current: string;
  /** Index of current file (1-based) */
  index: number;
  /** Total number of files */
  total: number;
  /** Percentage complete (0-100) */
  percentage: number;
  /** Whether processing is complete */
  complete: boolean;
  /** Error if current file failed */
  error?: Error;
}

/**
 * Batch processing options
 */
export interface BatchOptions {
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Continue on error (default: true) */
  continueOnError?: boolean;
  /** Parallel processing count (default: 1) */
  parallel?: number;
  /** Command execution options */
  execOptions?: ExecuteOptions;
}

/**
 * Batch processing result
 */
export interface BatchResult {
  /** Successfully processed files */
  success: string[];
  /** Failed files with errors */
  failed: Array<{ file: string; error: Error }>;
  /** Total processing time in milliseconds */
  duration: number;
}

/**
 * Process a single file with the given command builder
 */
async function processFile(
  file: string,
  buildCommand: (file: string) => string[],
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  const args = buildCommand(file);
  return execute(args, options);
}

/**
 * Process multiple files with a command builder
 */
export async function processBatch(
  files: string[],
  buildCommand: (file: string) => string[],
  options?: BatchOptions
): Promise<BatchResult> {
  const startTime = Date.now();
  const success: string[] = [];
  const failed: Array<{ file: string; error: Error }> = [];
  const continueOnError = options?.continueOnError !== false;
  const parallel = Math.max(1, options?.parallel ?? 1);

  const reportProgress = (current: string, index: number, error?: Error): void => {
    if (options?.onProgress !== undefined) {
      options.onProgress({
        current,
        index: index + 1,
        total: files.length,
        percentage: Math.round(((index + 1) / files.length) * 100),
        complete: index === files.length - 1,
        error,
      });
    }
  };

  if (parallel === 1) {
    // Sequential processing
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue; // Skip if file is undefined (shouldn't happen with proper input)

      try {
        await processFile(file, buildCommand, options?.execOptions);
        success.push(file);
        reportProgress(file, i);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        failed.push({ file, error: err });
        reportProgress(file, i, err);

        if (!continueOnError) {
          break;
        }
      }
    }
  } else {
    // Parallel processing with limited concurrency
    const chunks: string[][] = [];
    for (let i = 0; i < files.length; i += parallel) {
      chunks.push(files.slice(i, i + parallel));
    }

    let processedCount = 0;

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map((file) => processFile(file, buildCommand, options?.execOptions))
      );

      for (let i = 0; i < results.length; i++) {
        const file = chunk[i];
        const result = results[i];

        // Skip if undefined (shouldn't happen with proper input)
        if (!file || !result) continue;

        if (result.status === 'fulfilled') {
          success.push(file);
          reportProgress(file, processedCount);
        } else {
          const error =
            result.reason instanceof Error ? result.reason : new Error(String(result.reason));
          failed.push({ file, error });
          reportProgress(file, processedCount, error);

          if (!continueOnError) {
            return {
              success,
              failed,
              duration: Date.now() - startTime,
            };
          }
        }

        processedCount++;
      }
    }
  }

  return {
    success,
    failed,
    duration: Date.now() - startTime,
  };
}

/**
 * Find image files in a directory
 */
export async function findImages(
  directory: string,
  options?: {
    extensions?: string[];
    recursive?: boolean;
  }
): Promise<string[]> {
  // Validate and resolve directory path to prevent path traversal
  const validatedDir = validateDirectoryPath(directory);

  const extensions = options?.extensions ?? [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.tiff',
    '.tif',
    '.bmp',
    '.heic',
    '.avif',
  ];
  const recursive = options?.recursive ?? false;
  const images: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        await scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          images.push(fullPath);
        }
      }
    }
  }

  await scanDir(validatedDir);
  return images.sort();
}

/**
 * Batch resize images
 */
export async function batchResize(
  files: string[],
  outputDir: string,
  size: { width?: number; height?: number },
  options?: BatchOptions & { quality?: number; format?: string }
): Promise<BatchResult> {
  // Validate and resolve output directory to prevent path traversal
  const validatedOutputDir = validateDirectoryPath(outputDir);

  // Ensure output directory exists
  await fs.promises.mkdir(validatedOutputDir, { recursive: true });

  // Validate output format if specified
  if (options?.format !== undefined) {
    validateImageFormat(options.format);
  }

  const buildCommand = (file: string): string[] => {
    // Validate input file path
    const validatedFile = validateFilePath(file);

    const ext = options?.format ?? path.extname(validatedFile).slice(1);
    const baseName = path.basename(validatedFile, path.extname(validatedFile));
    const outputFile = path.join(validatedOutputDir, `${baseName}.${ext}`);

    const args = ['convert', validatedFile];

    if (size.width !== undefined || size.height !== undefined) {
      const geometry = `${size.width ?? ''}x${size.height ?? ''}`;
      args.push('-resize', geometry);
    }

    if (options?.quality !== undefined) {
      args.push('-quality', String(options.quality));
    }

    args.push(outputFile);
    return args;
  };

  return processBatch(files, buildCommand, options);
}

/**
 * Batch convert format
 */
export async function batchConvert(
  files: string[],
  outputDir: string,
  format: string,
  options?: BatchOptions & { quality?: number }
): Promise<BatchResult> {
  // Validate output format
  validateImageFormat(format);

  // Validate and resolve output directory to prevent path traversal
  const validatedOutputDir = validateDirectoryPath(outputDir);

  // Ensure output directory exists
  await fs.promises.mkdir(validatedOutputDir, { recursive: true });

  const buildCommand = (file: string): string[] => {
    // Validate input file path
    const validatedFile = validateFilePath(file);

    const baseName = path.basename(validatedFile, path.extname(validatedFile));
    const outputFile = path.join(validatedOutputDir, `${baseName}.${format}`);

    const args = ['convert', validatedFile];

    if (options?.quality !== undefined) {
      args.push('-quality', String(options.quality));
    }

    args.push(outputFile);
    return args;
  };

  return processBatch(files, buildCommand, options);
}

/**
 * Batch optimize images
 */
export async function batchOptimize(
  files: string[],
  outputDir: string,
  options?: BatchOptions & { quality?: number; strip?: boolean }
): Promise<BatchResult> {
  // Validate and resolve output directory to prevent path traversal
  const validatedOutputDir = validateDirectoryPath(outputDir);

  // Ensure output directory exists
  await fs.promises.mkdir(validatedOutputDir, { recursive: true });

  const buildCommand = (file: string): string[] => {
    // Validate input file path
    const validatedFile = validateFilePath(file);

    const outputFile = path.join(validatedOutputDir, path.basename(validatedFile));

    const args = ['convert', validatedFile];

    if (options?.strip !== false) {
      args.push('-strip');
    }

    args.push('-interlace', 'Plane');

    if (options?.quality !== undefined) {
      args.push('-quality', String(options.quality));
    }

    args.push(outputFile);
    return args;
  };

  return processBatch(files, buildCommand, options);
}

/**
 * Batch apply watermark
 */
export async function batchWatermark(
  files: string[],
  watermark: string,
  outputDir: string,
  options?: BatchOptions & {
    gravity?: string;
    opacity?: number;
  }
): Promise<BatchResult> {
  // Validate and resolve output directory to prevent path traversal
  const validatedOutputDir = validateDirectoryPath(outputDir);

  // Validate watermark path
  const validatedWatermark = validateFilePath(watermark);

  // Ensure output directory exists
  await fs.promises.mkdir(validatedOutputDir, { recursive: true });

  const buildCommand = (file: string): string[] => {
    // Validate input file path
    const validatedFile = validateFilePath(file);

    const outputFile = path.join(validatedOutputDir, path.basename(validatedFile));

    const args = ['composite'];

    if (options?.opacity !== undefined) {
      args.push('-dissolve', String(options.opacity));
    }

    args.push('-gravity', options?.gravity ?? 'SouthEast');
    args.push(validatedWatermark, validatedFile, outputFile);
    return args;
  };

  return processBatch(files, buildCommand, options);
}
