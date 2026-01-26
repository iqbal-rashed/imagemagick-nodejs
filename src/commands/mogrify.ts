/**
 * ImageMagick Node.js Wrapper - Mogrify Command
 *
 * Wrapper for the `magick mogrify` command for in-place batch processing.
 */

import { execute } from '../core/executor';
import {
  ExecuteOptions,
  ExecuteResult,
  ResizeOptions,
  CropOptions,
  RotateOptions,
  ColorspaceType,
  ModulateOptions,
  BlurOptions,
  SharpenOptions,
} from '../core/types';

/**
 * Arguments builder for mogrify command
 */
export class MogrifyArgs {
  private args: string[] = [];
  private inputPatterns: string[] = [];

  /**
   * Add input file pattern(s)
   */
  input(pattern: string | string[]): this {
    if (Array.isArray(pattern)) {
      this.inputPatterns.push(...pattern);
    } else {
      this.inputPatterns.push(pattern);
    }
    return this;
  }

  /**
   * Set output directory (files will be written here instead of in-place)
   */
  outputPath(directory: string): this {
    this.args.push('-path', directory);
    return this;
  }

  /**
   * Set output format (converts files to this format)
   */
  format(format: string): this {
    this.args.push('-format', format);
    return this;
  }

  // ============================================================================
  // Resize Operations
  // ============================================================================

  /**
   * Resize images
   */
  resize(widthOrOptions: number | ResizeOptions, height?: number): this {
    if (typeof widthOrOptions === 'object') {
      const opts = widthOrOptions;
      if (opts.geometry !== undefined) {
        this.args.push('-resize', opts.geometry);
      } else {
        let geometry = '';
        if (opts.width !== undefined) geometry += opts.width;
        if (opts.height !== undefined) geometry += `x${opts.height}`;
        if (opts.onlyShrinkLarger === true) geometry += '>';
        else if (opts.onlyEnlargeSmaller === true) geometry += '<';
        else if (opts.keepAspectRatio === false) geometry += '!';
        this.args.push('-resize', geometry);
      }
      if (opts.filter !== undefined) {
        this.args.push('-filter', opts.filter);
      }
    } else {
      let geometry = `${widthOrOptions}`;
      if (height !== undefined) geometry += `x${height}`;
      this.args.push('-resize', geometry);
    }
    return this;
  }

  /**
   * Scale images (faster, no filtering)
   */
  scale(width: number, height?: number): this {
    let geometry = `${width}`;
    if (height !== undefined) geometry += `x${height}`;
    this.args.push('-scale', geometry);
    return this;
  }

  /**
   * Create thumbnails
   */
  thumbnail(width: number, height?: number): this {
    let geometry = `${width}`;
    if (height !== undefined) geometry += `x${height}`;
    this.args.push('-thumbnail', geometry);
    return this;
  }

  // ============================================================================
  // Crop Operations
  // ============================================================================

  /**
   * Crop images
   */
  crop(options: CropOptions): this {
    let geometry = `${options.width}x${options.height}`;
    if (options.x !== undefined || options.y !== undefined) {
      const x = options.x ?? 0;
      const y = options.y ?? 0;
      geometry += `${x >= 0 ? '+' : ''}${x}${y >= 0 ? '+' : ''}${y}`;
    }
    if (options.gravity !== undefined) {
      this.args.push('-gravity', options.gravity);
    }
    this.args.push('-crop', geometry);
    if (options.repage !== false) {
      this.args.push('+repage');
    }
    return this;
  }

  /**
   * Trim edges
   */
  trim(fuzz?: number | string): this {
    if (fuzz !== undefined) {
      this.args.push('-fuzz', String(fuzz));
    }
    this.args.push('-trim', '+repage');
    return this;
  }

  // ============================================================================
  // Transform Operations
  // ============================================================================

  /**
   * Rotate images
   */
  rotate(degrees: number | RotateOptions): this {
    if (typeof degrees === 'object') {
      if (degrees.background !== undefined) {
        this.args.push('-background', degrees.background);
      }
      this.args.push('-rotate', String(degrees.degrees));
    } else {
      this.args.push('-rotate', String(degrees));
    }
    return this;
  }

  /**
   * Flip vertically
   */
  flip(): this {
    this.args.push('-flip');
    return this;
  }

  /**
   * Flop horizontally
   */
  flop(): this {
    this.args.push('-flop');
    return this;
  }

  /**
   * Auto-orient based on EXIF
   */
  autoOrient(): this {
    this.args.push('-auto-orient');
    return this;
  }

  // ============================================================================
  // Color Operations
  // ============================================================================

  /**
   * Set colorspace
   */
  colorspace(colorspace: ColorspaceType): this {
    this.args.push('-colorspace', colorspace);
    return this;
  }

  /**
   * Modulate brightness, saturation, hue
   */
  modulate(options: ModulateOptions): this {
    const values: number[] = [];
    values.push(options.brightness ?? 100);
    values.push(options.saturation ?? 100);
    values.push(options.hue ?? 100);
    this.args.push('-modulate', values.join(','));
    return this;
  }

  /**
   * Apply gamma correction
   */
  gamma(value: number): this {
    this.args.push('-gamma', String(value));
    return this;
  }

  /**
   * Normalize images
   */
  normalize(): this {
    this.args.push('-normalize');
    return this;
  }

  /**
   * Convert to grayscale
   */
  grayscale(): this {
    this.args.push('-colorspace', 'Gray');
    return this;
  }

  /**
   * Negate colors
   */
  negate(): this {
    this.args.push('-negate');
    return this;
  }

  // ============================================================================
  // Filter Operations
  // ============================================================================

  /**
   * Apply blur
   */
  blur(options: BlurOptions | number): this {
    if (typeof options === 'number') {
      this.args.push('-blur', `0x${options}`);
    } else {
      this.args.push('-blur', `${options.radius ?? 0}x${options.sigma}`);
    }
    return this;
  }

  /**
   * Sharpen images
   */
  sharpen(options: SharpenOptions | number): this {
    if (typeof options === 'number') {
      this.args.push('-sharpen', `0x${options}`);
    } else {
      this.args.push('-sharpen', `${options.radius ?? 0}x${options.sigma}`);
    }
    return this;
  }

  /**
   * Despeckle (noise reduction)
   */
  despeckle(): this {
    this.args.push('-despeckle');
    return this;
  }

  // ============================================================================
  // Output Options
  // ============================================================================

  /**
   * Set quality
   */
  quality(value: number): this {
    this.args.push('-quality', String(value));
    return this;
  }

  /**
   * Strip metadata
   */
  strip(): this {
    this.args.push('-strip');
    return this;
  }

  /**
   * Set interlace
   */
  interlace(method: 'None' | 'Line' | 'Plane' | 'Partition' | 'JPEG' | 'GIF' | 'PNG'): this {
    this.args.push('-interlace', method);
    return this;
  }

  /**
   * Set image depth
   */
  depth(bits: number): this {
    this.args.push('-depth', String(bits));
    return this;
  }

  /**
   * Set density (DPI)
   */
  density(value: number | string): this {
    this.args.push('-density', String(value));
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
    return ['mogrify', ...this.args, ...this.inputPatterns];
  }
}

/**
 * Create a new mogrify arguments builder
 */
export function mogrify(input?: string | string[]): MogrifyArgs {
  const builder = new MogrifyArgs();
  if (input !== undefined) {
    builder.input(input);
  }
  return builder;
}

/**
 * Execute a mogrify command
 */
export async function runMogrify(
  builder: MogrifyArgs,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute(builder.build(), options);
}

/**
 * Batch resize images in-place
 */
export async function batchResize(
  pattern: string,
  width: number,
  height?: number,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = mogrify(pattern).resize(width, height);
  return runMogrify(builder, options);
}

/**
 * Batch convert images to a different format
 */
export async function batchConvert(
  pattern: string,
  outputFormat: string,
  outputDir?: string,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = mogrify(pattern).format(outputFormat);
  if (outputDir !== undefined) {
    builder.outputPath(outputDir);
  }
  return runMogrify(builder, options);
}

/**
 * Batch strip metadata from images
 */
export async function batchStrip(
  pattern: string,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = mogrify(pattern).strip();
  return runMogrify(builder, options);
}

/**
 * Batch auto-orient images based on EXIF data
 */
export async function batchAutoOrient(
  pattern: string,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = mogrify(pattern).autoOrient();
  return runMogrify(builder, options);
}

/**
 * Batch optimize images for web
 */
export async function batchOptimize(
  pattern: string,
  quality: number = 85,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = mogrify(pattern).strip().interlace('Plane').quality(quality);
  return runMogrify(builder, options);
}
