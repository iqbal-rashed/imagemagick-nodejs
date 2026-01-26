/**
 * ImageMagick Node.js Wrapper - Binary Detection
 *
 * Handles detection and validation of ImageMagick binaries.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { BinaryNotFoundError, ExecutionError } from '../utils/errors';
import { BIN_DIR } from '../utils/paths';
import { validateFilePath } from '../utils/validation';
import { debug } from '../utils/logger';

/** Cached binary path */
let cachedBinaryPath: string | null = null;

/** Custom binary path set by user */
let customBinaryPath: string | null = null;

/** Cached major version */
let cachedMajorVersion: number | null = null;

/**
 * Get the path to the vendor-bundled binary (downloaded during npm install)
 */
function getVendorBinaryPath(): string {
  const binaryName = process.platform === 'win32' ? 'magick.exe' : 'magick';
  return path.join(BIN_DIR, binaryName);
}

/**
 * Common installation paths for ImageMagick on different platforms
 *
 * These are well-known installation directories for ImageMagick.
 * You can add custom search paths using `addBinarySearchPath()`.
 */
const COMMON_PATHS: Record<string, string[]> = {
  win32: [
    'C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.1.0-Q16-HDRI\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.0.0-Q16-HDRI\\magick.exe',
    'C:\\Program Files (x86)\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe',
    'C:\\Program Files (x86)\\ImageMagick-7.1.0-Q16-HDRI\\magick.exe',
  ],
  darwin: ['/opt/homebrew/bin/magick', '/usr/local/bin/magick', '/opt/local/bin/magick'],
  linux: ['/usr/bin/magick', '/usr/local/bin/magick', '/snap/bin/magick'],
};

/**
 * User-defined additional search paths for ImageMagick binaries
 */
let additionalSearchPaths: string[] = [];

/**
 * ImageMagick version information
 */
export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
  features: string[];
  delegates: string[];
}

/**
 * Set a custom path to the ImageMagick binary
 */
export function setBinaryPath(binaryPath: string): void {
  // Validate the binary path to prevent path traversal
  const validatedPath = validateFilePath(binaryPath);
  customBinaryPath = validatedPath;
  cachedBinaryPath = null; // Clear cache so it re-validates
}

/**
 * Get the current binary path setting
 */
export function getBinaryPathSetting(): string | null {
  return customBinaryPath;
}

/**
 * Clear the cached binary path
 */
export function clearBinaryCache(): void {
  cachedBinaryPath = null;
}

/**
 * Add a custom search path for the ImageMagick binary
 *
 * @param searchPath - Path to search for the ImageMagick binary
 *
 * @example
 * ```typescript
 * import { addBinarySearchPath } from 'imagemagick-nodejs';
 *
 * // Add a custom installation path
 * addBinarySearchPath('/opt/custom/bin/magick');
 * ```
 */
export function addBinarySearchPath(searchPath: string): void {
  const validatedPath = validateFilePath(searchPath);
  additionalSearchPaths.push(validatedPath);
  cachedBinaryPath = null; // Clear cache to force re-search
}

/**
 * Get the list of additional search paths
 *
 * @returns Array of additional search paths
 */
export function getAdditionalSearchPaths(): string[] {
  return [...additionalSearchPaths];
}

/**
 * Clear all additional search paths
 */
export function clearAdditionalSearchPaths(): void {
  additionalSearchPaths = [];
  cachedBinaryPath = null; // Clear cache to force re-search
}

/**
 * Check if a file exists and is executable
 */
function isExecutable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the binary name based on the platform
 */
function getBinaryName(): string {
  return process.platform === 'win32' ? 'magick.exe' : 'magick';
}

/**
 * Find binary in PATH environment variable
 */
function findInPath(): string | null {
  const pathEnv = process.env['PATH'] ?? '';
  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  const binaryName = getBinaryName();

  const paths = pathEnv.split(pathSeparator);

  for (const dir of paths) {
    const fullPath = path.join(dir, binaryName);
    if (fs.existsSync(fullPath) && isExecutable(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Find binary in common installation paths
 */
function findInCommonPaths(): string | null {
  // Check platform-specific common paths
  const platformPaths = COMMON_PATHS[process.platform] ?? [];

  // Combine with user-defined additional paths
  const allPaths = [...platformPaths, ...additionalSearchPaths];

  for (const p of allPaths) {
    if (fs.existsSync(p) && isExecutable(p)) {
      return p;
    }
  }

  return null;
}


/**
 * Find the ImageMagick binary
 *
 * @returns Path to the magick binary
 * @throws BinaryNotFoundError if binary cannot be found
 */
export async function findBinary(): Promise<string> {
  // Return cached path if available
  if (cachedBinaryPath) {
    return cachedBinaryPath;
  }

  // 1. Custom path
  if (customBinaryPath && fs.existsSync(customBinaryPath)) {
    cachedBinaryPath = customBinaryPath;
    return customBinaryPath;
  }

  // 2. Vendor-bundled binary
  const vendorBinary = getVendorBinaryPath();
  if (fs.existsSync(vendorBinary)) {
    cachedBinaryPath = vendorBinary;
    return vendorBinary;
  }

  // 3. PATH environment variable
  const pathBinary = findInPath();
  if (pathBinary) {
    cachedBinaryPath = pathBinary;
    return pathBinary;
  }

  // 4. Common installation paths
  const commonBinary = findInCommonPaths();
  if (commonBinary) {
    cachedBinaryPath = commonBinary;
    return commonBinary;
  }

  throw new BinaryNotFoundError();
}

/**
 * Get ImageMagick version information
 *
 * @returns Version information object
 */
export async function getVersion(): Promise<VersionInfo> {
  const binaryPath = await findBinary();

  return new Promise((resolve, reject) => {
    const proc = spawn(binaryPath, ['-version'], {
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(
          new ExecutionError(
            'Failed to get ImageMagick version',
            binaryPath,
            ['-version'],
            code ?? 1,
            stderr,
            stdout
          )
        );
        return;
      }

      try {
        const versionInfo = parseVersionOutput(stdout);
        cachedMajorVersion = versionInfo.major;
        resolve(versionInfo);
      } catch (error) {
        reject(error);
      }
    });

    proc.on('error', (_error) => {
      reject(new BinaryNotFoundError(binaryPath));
    });
  });
}

/**
 * Parse the version output from ImageMagick
 */
function parseVersionOutput(output: string): VersionInfo {
  const lines = output.split('\n');

  // Validate output is not empty
  if (lines.length === 0) {
    throw new Error('Empty version output');
  }

  const versionLine = lines[0] ?? '';

  // Parse version number (e.g., "Version: ImageMagick 7.1.1-21")
  const versionMatch = /ImageMagick (\d+)\.(\d+)\.(\d+)-?(\d+)?/.exec(versionLine);
  if (!versionMatch) {
    throw new Error(`Unable to parse version from: ${versionLine}`);
  }

  // Extract version components with null coalescing
  const majorStr = versionMatch[1] ?? '0';
  const minorStr = versionMatch[2] ?? '0';
  const patchStr = versionMatch[3] ?? '0';
  const revisionStr = versionMatch[4] ?? '0';

  // Parse and validate numbers
  const major = parseInt(majorStr, 10);
  const minor = parseInt(minorStr, 10);
  const patch = parseInt(patchStr, 10);

  // Validate parsed numbers
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new Error(`Invalid version numbers from: ${versionLine}`);
  }

  // Parse features (e.g., "Features: Cipher DPC HDRI Modules OpenMP(4.5)")
  const featuresLine = lines.find((line) => line.startsWith('Features:'));
  const features = featuresLine
    ? featuresLine.replace('Features:', '').trim().split(/\s+/).filter(Boolean)
    : [];

  // Parse delegates (e.g., "Delegates (built-in): bzlib cairo...")
  const delegatesLine = lines.find((line) => line.startsWith('Delegates'));
  const delegates = delegatesLine
    ? delegatesLine
        .replace(/Delegates.*?:\s*/, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    : [];

  return {
    version: `${major}.${minor}.${patch}-${revisionStr}`,
    major,
    minor,
    patch,
    features,
    delegates,
  };
}

/**
 * Check if ImageMagick is available
 *
 * @returns true if ImageMagick is available, false otherwise
 */
export async function isAvailable(): Promise<boolean> {
  try {
    await findBinary();
    return true;
  } catch (error) {
    // Log the error for debugging but don't throw
    debug('ImageMagick is not available:', error);
    return false;
  }
}

/**
 * Get a list of supported formats
 */
export async function getSupportedFormats(): Promise<string[]> {
  const binaryPath = await findBinary();

  return new Promise((resolve, reject) => {
    const proc = spawn(binaryPath, ['-list', 'format'], {
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(
          new ExecutionError(
            'Failed to list formats',
            binaryPath,
            ['-list', 'format'],
            code ?? 1,
            stderr,
            stdout
          )
        );
        return;
      }

      const formats: string[] = [];
      const lines = stdout.split('\n');

      for (const line of lines) {
        // Format lines start with spaces, then format name
        const match = /^\s*([A-Z0-9]+)\*?\s/.exec(line);
        if (match?.[1]) {
          formats.push(match[1].toLowerCase());
        }
      }

      resolve([...new Set(formats)].sort());
    });

    proc.on('error', (_error) => {
      reject(new BinaryNotFoundError(binaryPath));
    });
  });
}

/**
 * Check if the current ImageMagick version is 7 or newer
 */
export async function isVersion7(): Promise<boolean> {
  if (cachedMajorVersion !== null) {
    return cachedMajorVersion >= 7;
  }

  try {
    const version = await getVersion();
    return version.major >= 7;
  } catch {
    return false;
  }
}
