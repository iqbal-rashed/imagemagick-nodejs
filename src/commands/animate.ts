/**
 * ImageMagick Node.js Wrapper - Animate Command
 *
 * Wrapper for the `magick animate` command for creating and displaying animations.
 */

import { execute } from '../core/executor';
import { ExecuteOptions, ExecuteResult } from '../core/types';

/**
 * Arguments builder for creating animated images (using convert)
 */
export class AnimateArgs {
  private args: string[] = [];
  private inputFiles: string[] = [];
  private outputFile: string = '';

  /**
   * Add input frame(s)
   */
  input(file: string | string[]): this {
    if (Array.isArray(file)) {
      this.inputFiles.push(...file);
    } else {
      this.inputFiles.push(file);
    }
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
   * Set delay between frames (in hundredths of a second)
   */
  delay(value: number): this {
    this.args.push('-delay', String(value));
    return this;
  }

  /**
   * Set loop count (0 = infinite)
   */
  loop(count: number): this {
    this.args.push('-loop', String(count));
    return this;
  }

  /**
   * Set dispose method
   */
  dispose(method: 'Undefined' | 'None' | 'Background' | 'Previous'): this {
    this.args.push('-dispose', method);
    return this;
  }

  /**
   * Set coalesce to optimize animation
   */
  coalesce(): this {
    this.args.push('-coalesce');
    return this;
  }

  /**
   * Deconstruct animation to optimize
   */
  deconstruct(): this {
    this.args.push('-deconstruct');
    return this;
  }

  /**
   * Optimize the animation layers
   */
  layersOptimize(): this {
    this.args.push('-layers', 'Optimize');
    return this;
  }

  /**
   * Optimize transparency
   */
  layersOptimizeTransparency(): this {
    this.args.push('-layers', 'OptimizeTransparency');
    return this;
  }

  /**
   * Remove duplicate frames
   */
  layersRemoveDups(): this {
    this.args.push('-layers', 'RemoveDuplicates');
    return this;
  }

  /**
   * Resize all frames
   */
  resize(width: number, height?: number): this {
    let geometry = `${width}`;
    if (height !== undefined) geometry += `x${height}`;
    this.args.push('-resize', geometry);
    return this;
  }

  /**
   * Set the page geometry for animation canvas
   */
  page(geometry: string): this {
    this.args.push('-page', geometry);
    return this;
  }

  /**
   * Set background color
   */
  background(color: string): this {
    this.args.push('-background', color);
    return this;
  }

  /**
   * Set gravity for positioning
   */
  gravity(gravity: string): this {
    this.args.push('-gravity', gravity);
    return this;
  }

  /**
   * Flatten frames with alpha
   */
  flatten(): this {
    this.args.push('-flatten');
    return this;
  }

  /**
   * Append frames vertically or horizontally
   */
  append(vertical: boolean = false): this {
    if (vertical) {
      this.args.push('-append');
    } else {
      this.args.push('+append');
    }
    return this;
  }

  /**
   * Reverse frame order
   */
  reverse(): this {
    this.args.push('-reverse');
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
    const result: string[] = ['convert'];
    result.push(...this.args);
    result.push(...this.inputFiles);
    result.push(this.outputFile);
    return result;
  }
}

/**
 * Create a new animate arguments builder
 */
export function animate(input?: string | string[]): AnimateArgs {
  const builder = new AnimateArgs();
  if (input !== undefined) {
    builder.input(input);
  }
  return builder;
}

/**
 * Execute an animate/animation creation command
 */
export async function runAnimate(
  builder: AnimateArgs,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute(builder.build(), options);
}

/**
 * Create an animated GIF from multiple images
 */
export async function createGif(
  images: string[],
  output: string,
  options?: {
    delay?: number;
    loop?: number;
    resize?: { width: number; height?: number };
    optimize?: boolean;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = animate(images).output(output);

  builder.delay(options?.delay ?? 100);
  builder.loop(options?.loop ?? 0);

  if (options?.resize !== undefined) {
    builder.resize(options.resize.width, options.resize.height);
  }

  if (options?.optimize !== false) {
    builder.layersOptimize();
  }

  return runAnimate(builder, execOptions);
}

/**
 * Create an animated WebP from multiple images
 */
export async function createWebP(
  images: string[],
  output: string,
  options?: {
    delay?: number;
    loop?: number;
    quality?: number;
    resize?: { width: number; height?: number };
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = animate(images).output(output);

  builder.delay(options?.delay ?? 100);
  builder.loop(options?.loop ?? 0);

  if (options?.resize !== undefined) {
    builder.resize(options.resize.width, options.resize.height);
  }

  if (options?.quality !== undefined) {
    builder.raw('-quality', String(options.quality));
  }

  return runAnimate(builder, execOptions);
}

/**
 * Extract frames from an animated image
 */
export async function extractFrames(
  input: string,
  outputPattern: string,
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const args = ['convert', input, '-coalesce', outputPattern];
  return execute(args, execOptions);
}

/**
 * Get frame count from an animated image
 */
export async function getFrameCount(input: string, execOptions?: ExecuteOptions): Promise<number> {
  const args = ['identify', '-format', '%n\\n', input];
  const result = await execute(args, execOptions);
  const lines = result.stdout.trim().split('\n');
  return parseInt(lines[0] ?? '1', 10);
}

/**
 * Get frame delays from an animated image
 */
export async function getFrameDelays(
  input: string,
  execOptions?: ExecuteOptions
): Promise<number[]> {
  const args = ['identify', '-format', '%T\\n', input];
  const result = await execute(args, execOptions);
  const lines = result.stdout.trim().split('\n').filter(Boolean);
  return lines.map((line) => parseInt(line, 10));
}

/**
 * Optimize an animated GIF
 */
export async function optimizeGif(
  input: string,
  output: string,
  options?: {
    colors?: number;
    fuzz?: number;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const args = ['convert', input, '-coalesce'];

  if (options?.fuzz !== undefined) {
    args.push('-fuzz', `${options.fuzz}%`);
  }

  if (options?.colors !== undefined) {
    args.push('-colors', String(options.colors));
  }

  args.push('-layers', 'OptimizeTransparency', output);

  return execute(args, execOptions);
}

/**
 * Change animation speed
 */
export async function changeSpeed(
  input: string,
  output: string,
  delay: number,
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const args = ['convert', input, '-delay', String(delay), output];
  return execute(args, execOptions);
}

/**
 * Reverse animation
 */
export async function reverseAnimation(
  input: string,
  output: string,
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const args = ['convert', input, '-coalesce', '-reverse', '-layers', 'Optimize', output];
  return execute(args, execOptions);
}

/**
 * Create a bouncing (ping-pong) animation
 */
export async function createBouncingAnimation(
  input: string,
  output: string,
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  // Clone frames in reverse order to create bounce effect
  const args = [
    'convert',
    input,
    '-coalesce',
    '-duplicate',
    '1,-2-1',
    '-layers',
    'Optimize',
    output,
  ];
  return execute(args, execOptions);
}
