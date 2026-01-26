/**
 * ImageMagick Node.js Wrapper - Utility Functions
 *
 * Format detection, conversion helpers, and common utilities.
 */

import { execute } from '../core/executor';
import { ExecuteOptions, ImageFormat } from '../core/types';
import { debug } from './logger';

/**
 * Common image formats with their MIME types
 */
export const FORMAT_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  psd: 'image/vnd.adobe.photoshop',
  eps: 'application/postscript',
};

/**
 * Raster formats that support lossy compression
 */
export const LOSSY_FORMATS = ['jpg', 'jpeg', 'webp', 'avif', 'heic', 'heif'];

/**
 * Formats that support transparency
 */
export const TRANSPARENT_FORMATS = ['png', 'gif', 'webp', 'avif', 'tiff', 'tif', 'psd', 'ico'];

/**
 * Formats that support animation
 */
export const ANIMATED_FORMATS = ['gif', 'webp', 'avif', 'png'];

/**
 * Get MIME type for a format
 */
export function getMimeType(format: string): string | undefined {
  return FORMAT_MIME_TYPES[format.toLowerCase()];
}

/**
 * Check if a format supports lossy compression
 */
export function isLossyFormat(format: string): boolean {
  return LOSSY_FORMATS.includes(format.toLowerCase());
}

/**
 * Check if a format supports transparency
 */
export function supportsTransparency(format: string): boolean {
  return TRANSPARENT_FORMATS.includes(format.toLowerCase());
}

/**
 * Check if a format supports animation
 */
export function supportsAnimation(format: string): boolean {
  return ANIMATED_FORMATS.includes(format.toLowerCase());
}

/**
 * Get format from file extension
 */
export function getFormatFromExtension(filePath: string): string | undefined {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext;
}

/**
 * Get file extension for a format
 */
export function getExtensionForFormat(format: ImageFormat | string): string {
  const formatLower = format.toLowerCase();

  // Handle special cases
  if (formatLower === 'jpeg') return 'jpg';
  if (formatLower === 'tiff') return 'tif';

  return formatLower;
}

/**
 * Check if ImageMagick supports a format
 */
export async function isFormatSupported(
  format: string,
  execOptions?: ExecuteOptions
): Promise<boolean> {
  try {
    const args = ['-list', 'format'];
    const result = await execute(args, execOptions);
    const formatUpper = format.toUpperCase();
    return result.stdout.includes(formatUpper);
  } catch (error) {
    // Log the error for debugging but don't throw
    debug(`Failed to check format support for ${format}:`, error);
    return false;
  }
}

/**
 * Get recommended quality setting for a format
 */
export function getRecommendedQuality(format: string): number {
  const formatLower = format.toLowerCase();

  switch (formatLower) {
    case 'jpg':
    case 'jpeg':
      return 85;
    case 'webp':
      return 82;
    case 'avif':
      return 65;
    case 'heic':
    case 'heif':
      return 75;
    default:
      return 100;
  }
}

/**
 * Normalize geometry string
 */
export function normalizeGeometry(width?: number, height?: number, x?: number, y?: number): string {
  let geometry = '';

  if (width !== undefined) {
    geometry += width;
  }

  if (height !== undefined) {
    geometry += `x${height}`;
  }

  if (x !== undefined || y !== undefined) {
    const xVal = x ?? 0;
    const yVal = y ?? 0;
    geometry += `${xVal >= 0 ? '+' : ''}${xVal}${yVal >= 0 ? '+' : ''}${yVal}`;
  }

  return geometry;
}

/**
 * Parse geometry string
 */
export function parseGeometry(geometry: string): {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
} {
  const result: {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
  } = {};

  // Match patterns like: 800x600+10+20, 800x600, 800, x600, etc.
  const match = /^(\d+)?(?:x(\d+))?(?:([+-]\d+)([+-]\d+))?/.exec(geometry);

  if (match !== null) {
    if (match[1] !== undefined) result.width = parseInt(match[1], 10);
    if (match[2] !== undefined) result.height = parseInt(match[2], 10);
    if (match[3] !== undefined) result.x = parseInt(match[3], 10);
    if (match[4] !== undefined) result.y = parseInt(match[4], 10);
  }

  return result;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Parse file size string to bytes
 */
export function parseFileSize(sizeStr: string): number {
  const match = /^([\d.]+)\s*([KMGT]?B)?$/i.exec(sizeStr.trim());

  if (match === null) {
    return 0;
  }

  const value = parseFloat(match[1] ?? '0');
  const unit = (match[2] ?? 'B').toUpperCase();

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  return value * (multipliers[unit] ?? 1);
}

/**
 * Escape a string for use in ImageMagick commands
 */
export function escapeArg(arg: string): string {
  // Escape special characters
  return arg.replace(/([\\'"$`])/g, '\\$1');
}

/**
 * Validate that a file appears to be an image
 */
export async function isImageFile(
  filePath: string,
  execOptions?: ExecuteOptions
): Promise<boolean> {
  try {
    const args = ['identify', '-ping', filePath];
    await execute(args, execOptions);
    return true;
  } catch (error) {
    // Log the error for debugging but don't throw
    debug(`Failed to identify image file ${filePath}:`, error);
    return false;
  }
}

/**
 * Get the actual format of an image file (from content, not extension)
 */
export async function detectFormat(
  filePath: string,
  execOptions?: ExecuteOptions
): Promise<string> {
  const args = ['identify', '-format', '%m', filePath];
  const result = await execute(args, execOptions);
  return result.stdout.trim().toLowerCase();
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Calculate dimensions while maintaining aspect ratio
 */
export function maintainAspectRatio(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth?: number,
  targetHeight?: number
): { width: number; height: number } {
  if (targetWidth === undefined && targetHeight === undefined) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const aspectRatio = sourceWidth / sourceHeight;

  if (targetWidth !== undefined && targetHeight !== undefined) {
    // Fit within both constraints
    const widthRatio = targetWidth / sourceWidth;
    const heightRatio = targetHeight / sourceHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    return {
      width: Math.round(sourceWidth * ratio),
      height: Math.round(sourceHeight * ratio),
    };
  }

  if (targetWidth !== undefined) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  // targetHeight !== undefined
  return {
    width: Math.round(targetHeight! * aspectRatio),
    height: targetHeight!,
  };
}

/**
 * Generate a color palette from an image
 */
export async function extractPalette(
  filePath: string,
  colors: number = 8,
  execOptions?: ExecuteOptions
): Promise<string[]> {
  const args = [
    'convert',
    filePath,
    '-colors',
    String(colors),
    '-unique-colors',
    '-format',
    '%c',
    'histogram:info:-',
  ];

  const result = await execute(args, execOptions);
  const palette: string[] = [];

  const lines = result.stdout.split('\n');
  for (const line of lines) {
    // Match hex colors like #RRGGBB
    const match = /#[0-9A-Fa-f]{6}/.exec(line);
    if (match?.[0] !== undefined) {
      palette.push(match[0]);
    }
  }

  return palette;
}
