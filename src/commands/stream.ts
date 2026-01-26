/**
 * ImageMagick Node.js Wrapper - Stream Command
 *
 * Wrapper for the `magick stream` command for extracting raw pixel data.
 */

import { execute, executeStream, StreamResult } from '../core/executor';
import { ExecuteOptions, ExecuteResult } from '../core/types';

/**
 * Storage types for stream output
 */
export type StorageType = 'char' | 'double' | 'float' | 'integer' | 'long' | 'quantum' | 'short';

/**
 * Arguments builder for stream command
 */
export class StreamArgs {
  private args: string[] = [];
  private inputFile: string = '';
  private outputFile: string = '';

  /**
   * Set input file
   */
  input(file: string): this {
    this.inputFile = file;
    return this;
  }

  /**
   * Set output file
   */
  output(file: string): this {
    this.outputFile = file;
    return this;
  }

  /**
   * Set pixel map (e.g., "RGB", "RGBA", "BGR", "I" for intensity)
   */
  map(map: string): this {
    this.args.push('-map', map);
    return this;
  }

  /**
   * Set storage type for output
   */
  storageType(type: StorageType): this {
    this.args.push('-storage-type', type);
    return this;
  }

  /**
   * Set depth (bits per channel)
   */
  depth(bits: number): this {
    this.args.push('-depth', String(bits));
    return this;
  }

  /**
   * Set colorspace
   */
  colorspace(colorspace: string): this {
    this.args.push('-colorspace', colorspace);
    return this;
  }

  /**
   * Extract a region
   */
  extract(geometry: string): this {
    this.args.push('-extract', geometry);
    return this;
  }

  /**
   * Sample the image
   */
  sample(geometry: string): this {
    this.args.push('-sample', geometry);
    return this;
  }

  /**
   * Set density
   */
  density(value: number | string): this {
    this.args.push('-density', String(value));
    return this;
  }

  /**
   * Quantize colors
   */
  quantize(colorspace: string): this {
    this.args.push('-quantize', colorspace);
    return this;
  }

  /**
   * Add raw arguments
   */
  raw(...args: string[]): this {
    this.args.push(...args);
    return this;
  }

  /**
   * Build the final arguments array
   */
  build(): string[] {
    const result: string[] = ['stream'];
    result.push(...this.args);
    result.push(this.inputFile);
    if (this.outputFile !== '') {
      result.push(this.outputFile);
    }
    return result;
  }
}

/**
 * Create a new stream arguments builder
 */
export function stream(input?: string): StreamArgs {
  const builder = new StreamArgs();
  if (input !== undefined) {
    builder.input(input);
  }
  return builder;
}

/**
 * Execute a stream command
 */
export async function runStream(
  builder: StreamArgs,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute(builder.build(), options);
}

/**
 * Execute a stream command with streaming output
 */
export async function runStreamPipe(
  builder: StreamArgs,
  options?: ExecuteOptions
): Promise<StreamResult> {
  return executeStream(builder.build(), options);
}

/**
 * Extract RGB pixel data from an image
 */
export async function extractRGB(
  input: string,
  output: string,
  options?: {
    depth?: number;
    storageType?: StorageType;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = stream(input)
    .output(output)
    .map('RGB')
    .depth(options?.depth ?? 8);

  if (options?.storageType !== undefined) {
    builder.storageType(options.storageType);
  }

  return runStream(builder, execOptions);
}

/**
 * Extract RGBA pixel data from an image
 */
export async function extractRGBA(
  input: string,
  output: string,
  options?: {
    depth?: number;
    storageType?: StorageType;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = stream(input)
    .output(output)
    .map('RGBA')
    .depth(options?.depth ?? 8);

  if (options?.storageType !== undefined) {
    builder.storageType(options.storageType);
  }

  return runStream(builder, execOptions);
}

/**
 * Extract grayscale pixel data from an image
 */
export async function extractGrayscale(
  input: string,
  output: string,
  options?: {
    depth?: number;
    storageType?: StorageType;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = stream(input)
    .output(output)
    .map('I')
    .colorspace('Gray')
    .depth(options?.depth ?? 8);

  if (options?.storageType !== undefined) {
    builder.storageType(options.storageType);
  }

  return runStream(builder, execOptions);
}

/**
 * Extract a region of pixel data
 */
export async function extractRegion(
  input: string,
  output: string,
  region: { x: number; y: number; width: number; height: number },
  options?: {
    map?: string;
    depth?: number;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const geometry = `${region.width}x${region.height}+${region.x}+${region.y}`;

  const builder = stream(input)
    .output(output)
    .extract(geometry)
    .map(options?.map ?? 'RGB')
    .depth(options?.depth ?? 8);

  return runStream(builder, execOptions);
}

/**
 * Get raw pixel buffer from image (to stdout)
 */
export async function getPixelBuffer(
  input: string,
  options?: {
    map?: string;
    depth?: number;
    storageType?: StorageType;
  },
  execOptions?: ExecuteOptions
): Promise<Buffer> {
  const builder = stream(input)
    .output('-') // Output to stdout
    .map(options?.map ?? 'RGB')
    .depth(options?.depth ?? 8);

  if (options?.storageType !== undefined) {
    builder.storageType(options.storageType);
  }

  const streamResult = await runStreamPipe(builder, execOptions);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    streamResult.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    streamResult.stdout.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    streamResult.stdout.on('error', reject);
  });
}
