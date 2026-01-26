/**
 * ImageMagick Node.js Wrapper - Identify Command
 *
 * Wrapper for the `magick identify` command for getting image information.
 */

import { execute } from '../core/executor';
import { ExecuteOptions, ImageInfo } from '../core/types';
import { ParseError } from '../utils/errors';
import { debug } from '../utils/logger';

/**
 * Format string for JSON-like output parsing
 */
const IDENTIFY_FORMAT = '%m\\n%w\\n%h\\n%z\\n%r\\n%b\\n%C\\n%Q\\n%x\\n%y\\n%U\\n';

/**
 * Get basic image information
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Image information object
 */
export async function identify(input: string, options?: ExecuteOptions): Promise<ImageInfo> {
  const args = ['identify', '-format', IDENTIFY_FORMAT, input];
  const result = await execute(args, options);

  return parseIdentifyOutput(result.stdout, input);
}

/**
 * Get verbose image information including all metadata
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Detailed image information with all properties
 */
export async function identifyVerbose(
  input: string,
  options?: ExecuteOptions
): Promise<ImageInfo & { raw: string }> {
  const args = ['identify', '-verbose', input];
  const result = await execute(args, options);

  const basicInfo = await identify(input, options);
  const properties = parseVerboseOutput(result.stdout);

  return {
    ...basicInfo,
    properties,
    raw: result.stdout,
  };
}

/**
 * Get image format
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Format string (e.g., "JPEG", "PNG")
 */
export async function getFormat(input: string, options?: ExecuteOptions): Promise<string> {
  const args = ['identify', '-format', '%m', input];
  const result = await execute(args, options);
  return result.stdout.trim();
}

/**
 * Get image dimensions
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Object with width and height
 */
export async function getDimensions(
  input: string,
  options?: ExecuteOptions
): Promise<{ width: number; height: number }> {
  const args = ['identify', '-format', '%w %h', input];
  const result = await execute(args, options);

  const parts = result.stdout.trim().split(' ');
  const width = parseInt(parts[0] ?? '0', 10);
  const height = parseInt(parts[1] ?? '0', 10);

  if (isNaN(width) || isNaN(height)) {
    throw new ParseError(`Unable to parse dimensions from: ${result.stdout}`, result.stdout);
  }

  return { width, height };
}

/**
 * Get image colorspace
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Colorspace string
 */
export async function getColorspace(input: string, options?: ExecuteOptions): Promise<string> {
  const args = ['identify', '-format', '%r', input];
  const result = await execute(args, options);
  return result.stdout.trim();
}

/**
 * Get image depth (bits per channel)
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Depth in bits
 */
export async function getDepth(input: string, options?: ExecuteOptions): Promise<number> {
  const args = ['identify', '-format', '%z', input];
  const result = await execute(args, options);
  const depth = parseInt(result.stdout.trim(), 10);

  if (isNaN(depth)) {
    throw new ParseError(`Unable to parse depth from: ${result.stdout}`, result.stdout);
  }

  return depth;
}

/**
 * Get image quality (for JPEG)
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Quality percentage or undefined if not applicable
 */
export async function getQuality(
  input: string,
  options?: ExecuteOptions
): Promise<number | undefined> {
  const args = ['identify', '-format', '%Q', input];
  const result = await execute(args, options);
  const quality = parseInt(result.stdout.trim(), 10);

  return isNaN(quality) ? undefined : quality;
}

/**
 * Get file size
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns File size as string (e.g., "1.5MB")
 */
export async function getFilesize(input: string, options?: ExecuteOptions): Promise<string> {
  const args = ['identify', '-format', '%b', input];
  const result = await execute(args, options);
  return result.stdout.trim();
}

/**
 * Get number of unique colors
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Number of unique colors
 */
export async function getColorCount(input: string, options?: ExecuteOptions): Promise<number> {
  const args = ['identify', '-format', '%k', input];
  const result = await execute(args, options);
  const count = parseInt(result.stdout.trim(), 10);

  if (isNaN(count)) {
    throw new ParseError(`Unable to parse color count from: ${result.stdout}`, result.stdout);
  }

  return count;
}

/**
 * Get image histogram
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Histogram data as string
 */
export async function getHistogram(input: string, options?: ExecuteOptions): Promise<string> {
  const args = ['identify', '-verbose', '-define', 'histogram:unique-colors=true', input];
  const result = await execute(args, options);

  // Extract histogram section
  const lines = result.stdout.split('\n');
  const histogramStart = lines.findIndex((line) => line.includes('Histogram:'));
  if (histogramStart === -1) {
    return '';
  }

  const histogramLines: string[] = [];
  for (let i = histogramStart + 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() === '' || !line.startsWith(' ')) {
      break;
    }
    histogramLines.push(line.trim());
  }

  return histogramLines.join('\n');
}

/**
 * Check if image is valid and not corrupt
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns true if image is valid, false otherwise
 */
export async function isValid(input: string, options?: ExecuteOptions): Promise<boolean> {
  try {
    const args = ['identify', '-regard-warnings', input];
    await execute(args, options);
    return true;
  } catch (error) {
    // Log the error for debugging but don't throw
    debug(`Failed to validate image ${input}:`, error);
    return false;
  }
}

/**
 * Get number of frames (for animated images)
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns Number of frames
 */
export async function getFrameCount(input: string, options?: ExecuteOptions): Promise<number> {
  const args = ['identify', '-format', '%n', input];
  const result = await execute(args, options);
  const count = parseInt(result.stdout.trim(), 10);

  return isNaN(count) ? 1 : count;
}

/**
 * Get EXIF data
 *
 * @param input - Path to the image file
 * @param options - Execution options
 * @returns EXIF data as key-value pairs
 */
export async function getExif(
  input: string,
  options?: ExecuteOptions
): Promise<Record<string, string>> {
  const args = ['identify', '-format', '%[EXIF:*]', input];
  const result = await execute(args, options);

  const exif: Record<string, string> = {};
  const lines = result.stdout.split('\n');

  for (const line of lines) {
    const match = /^exif:([^=]+)=(.*)$/i.exec(line.trim());
    if (match?.[1] !== undefined && match[2] !== undefined) {
      exif[match[1]] = match[2];
    }
  }

  return exif;
}

/**
 * Parse the identify output
 */
function parseIdentifyOutput(output: string, _filePath: string): ImageInfo {
  const lines = output.trim().split('\n');

  if (lines.length < 6) {
    throw new ParseError(`Unexpected identify output format: ${output}`, output);
  }

  const format = lines[0]?.trim() ?? '';
  const width = parseInt(lines[1]?.trim() ?? '0', 10);
  const height = parseInt(lines[2]?.trim() ?? '0', 10);
  const depth = parseInt(lines[3]?.trim() ?? '0', 10);
  const colorspace = lines[4]?.trim() ?? '';
  const filesize = lines[5]?.trim() ?? '';
  const compression = lines[6]?.trim();
  const qualityStr = lines[7]?.trim();
  const xDensity = lines[8]?.trim();
  const yDensity = lines[9]?.trim();
  const units = lines[10]?.trim();

  const quality = qualityStr !== undefined ? parseInt(qualityStr, 10) : undefined;

  return {
    format,
    width,
    height,
    depth,
    colorspace,
    filesize,
    compression: compression !== '' ? compression : undefined,
    quality: quality !== undefined && !isNaN(quality) ? quality : undefined,
    density:
      xDensity !== undefined && yDensity !== undefined
        ? {
            x: parseFloat(xDensity),
            y: parseFloat(yDensity),
            units: units ?? 'PixelsPerInch',
          }
        : undefined,
  };
}

/**
 * Parse verbose output to extract properties
 */
function parseVerboseOutput(output: string): Record<string, string> {
  const properties: Record<string, string> = {};
  const lines = output.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      if (key !== '' && value !== '') {
        properties[key] = value;
      }
    }
  }

  return properties;
}
