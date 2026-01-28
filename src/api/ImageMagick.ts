/**
 * ImageMagick Node.js Wrapper - High-Level Fluent API
 *
 * Provides a chainable, promise-based API for image processing.
 */

import { execute, executeStream, StreamResult } from '../core/executor';
import {
  ExecuteOptions,
  ExecuteResult,
  GravityType,
  ColorspaceType,
  FilterType,
  CompositeOperator,
} from '../core/types';

/**
 * High-level fluent API for image processing
 */
export class ImageMagick {
  private inputSource: string | Buffer;
  private operations: string[] = [];
  private execOptions: ExecuteOptions = {};
  private fontSet: boolean = false;

  /**
   * Create a new ImageMagick processor
   */
  constructor(input: string | Buffer) {
    this.inputSource = input;
  }

  /**
   * Set execution options
   */
  options(opts: ExecuteOptions): this {
    this.execOptions = { ...this.execOptions, ...opts };
    return this;
  }

  // ============================================================================
  // Resize Operations
  // ============================================================================

  /**
   * Resize the image
   */
  resize(
    width?: number,
    height?: number,
    options?: {
      fit?: 'fill' | 'contain' | 'cover' | 'inside' | 'outside';
      filter?: FilterType;
    }
  ): this {
    let geometry = '';
    if (width !== undefined) geometry += width;
    if (height !== undefined) geometry += `x${height}`;

    // Add resize flag based on fit option
    switch (options?.fit) {
      case 'fill':
        geometry += '!';
        break;
      case 'inside':
      case 'contain':
        geometry += '>';
        break;
      case 'outside':
      case 'cover':
        geometry += '^';
        break;
    }

    if (options?.filter !== undefined) {
      this.operations.push('-filter', options.filter);
    }

    this.operations.push('-resize', geometry);
    return this;
  }

  /**
   * Scale (fast resize without filtering)
   */
  scale(width?: number, height?: number): this {
    let geometry = '';
    if (width !== undefined) geometry += width;
    if (height !== undefined) geometry += `x${height}`;
    this.operations.push('-scale', geometry);
    return this;
  }

  /**
   * Create thumbnail
   */
  thumbnail(width?: number, height?: number): this {
    let geometry = '';
    if (width !== undefined) geometry += width;
    if (height !== undefined) geometry += `x${height}`;
    this.operations.push('-thumbnail', geometry);
    return this;
  }

  /**
   * Sample (fastest resize)
   */
  sample(width?: number, height?: number): this {
    let geometry = '';
    if (width !== undefined) geometry += width;
    if (height !== undefined) geometry += `x${height}`;
    this.operations.push('-sample', geometry);
    return this;
  }

  // ============================================================================
  // Crop Operations
  // ============================================================================

  /**
   * Crop the image
   */
  crop(width: number, height: number, x?: number, y?: number): this {
    let geometry = `${width}x${height}`;
    if (x !== undefined || y !== undefined) {
      const xVal = x ?? 0;
      const yVal = y ?? 0;
      geometry += `${xVal >= 0 ? '+' : ''}${xVal}${yVal >= 0 ? '+' : ''}${yVal}`;
    }
    this.operations.push('-crop', geometry, '+repage');
    return this;
  }

  /**
   * Trim edges
   */
  trim(fuzz?: number): this {
    if (fuzz !== undefined) {
      this.operations.push('-fuzz', `${fuzz}%`);
    }
    this.operations.push('-trim', '+repage');
    return this;
  }

  /**
   * Set extent (canvas size)
   */
  extent(width: number, height: number, gravity?: GravityType, background?: string): this {
    if (background !== undefined) {
      this.operations.push('-background', background);
    }
    if (gravity !== undefined) {
      this.operations.push('-gravity', gravity);
    }
    this.operations.push('-extent', `${width}x${height}`);
    return this;
  }

  // ============================================================================
  // Transform Operations
  // ============================================================================

  /**
   * Rotate the image
   */
  rotate(degrees: number, background?: string): this {
    if (background !== undefined) {
      this.operations.push('-background', background);
    }
    this.operations.push('-rotate', String(degrees));
    return this;
  }

  /**
   * Flip vertically
   */
  flip(): this {
    this.operations.push('-flip');
    return this;
  }

  /**
   * Flop horizontally
   */
  flop(): this {
    this.operations.push('-flop');
    return this;
  }

  /**
   * Auto-orient based on EXIF
   */
  autoOrient(): this {
    this.operations.push('-auto-orient');
    return this;
  }

  /**
   * Transpose (flip + rotate 90)
   */
  transpose(): this {
    this.operations.push('-transpose');
    return this;
  }

  /**
   * Transverse (flop + rotate 90)
   */
  transverse(): this {
    this.operations.push('-transverse');
    return this;
  }

  // ============================================================================
  // Color Operations
  // ============================================================================

  /**
   * Set colorspace
   */
  colorspace(colorspace: ColorspaceType): this {
    this.operations.push('-colorspace', colorspace);
    return this;
  }

  /**
   * Convert to grayscale
   */
  grayscale(): this {
    this.operations.push('-colorspace', 'Gray');
    return this;
  }

  /**
   * Modulate brightness, saturation, hue
   */
  modulate(brightness?: number, saturation?: number, hue?: number): this {
    const b = brightness ?? 100;
    const s = saturation ?? 100;
    const h = hue ?? 100;
    this.operations.push('-modulate', `${b},${s},${h}`);
    return this;
  }

  /**
   * Adjust brightness
   */
  brightness(value: number): this {
    return this.modulate(value);
  }

  /**
   * Adjust saturation
   */
  saturation(value: number): this {
    return this.modulate(100, value);
  }

  /**
   * Apply gamma correction
   */
  gamma(value: number): this {
    this.operations.push('-gamma', String(value));
    return this;
  }

  /**
   * Adjust levels
   */
  level(blackPoint: number | string, whitePoint: number | string, gamma?: number): this {
    const g = gamma ?? 1.0;
    this.operations.push('-level', `${blackPoint},${whitePoint},${g}`);
    return this;
  }

  /**
   * Normalize (auto levels)
   */
  normalize(): this {
    this.operations.push('-normalize');
    return this;
  }

  /**
   * Auto level
   */
  autoLevel(): this {
    this.operations.push('-auto-level');
    return this;
  }

  /**
   * Negate colors
   */
  negate(): this {
    this.operations.push('-negate');
    return this;
  }

  /**
   * Apply sepia tone
   */
  sepia(threshold?: number): this {
    this.operations.push('-sepia-tone', `${threshold ?? 80}%`);
    return this;
  }

  /**
   * Tint with color
   */
  tint(color: string): this {
    this.operations.push('-fill', color, '-tint', '100');
    return this;
  }

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Apply blur
   */
  blur(sigma: number, radius?: number): this {
    this.operations.push('-blur', `${radius ?? 0}x${sigma}`);
    return this;
  }

  /**
   * Apply Gaussian blur
   */
  gaussianBlur(sigma: number, radius?: number): this {
    this.operations.push('-gaussian-blur', `${radius ?? 0}x${sigma}`);
    return this;
  }

  /**
   * Apply motion blur
   */
  motionBlur(sigma: number, radius: number, angle: number): this {
    this.operations.push('-motion-blur', `${radius}x${sigma}+${angle}`);
    return this;
  }

  /**
   * Sharpen
   */
  sharpen(sigma: number, radius?: number): this {
    this.operations.push('-sharpen', `${radius ?? 0}x${sigma}`);
    return this;
  }

  /**
   * Unsharp mask
   */
  unsharpMask(radius: number, sigma: number, amount: number, threshold: number): this {
    this.operations.push('-unsharp', `${radius}x${sigma}+${amount}+${threshold}`);
    return this;
  }

  /**
   * Apply emboss effect
   */
  emboss(radius?: number): this {
    this.operations.push('-emboss', String(radius ?? 0));
    return this;
  }

  /**
   * Apply edge detection
   */
  edge(radius?: number): this {
    this.operations.push('-edge', String(radius ?? 1));
    return this;
  }

  /**
   * Apply charcoal effect
   */
  charcoal(radius?: number): this {
    this.operations.push('-charcoal', String(radius ?? 1));
    return this;
  }

  /**
   * Apply oil paint effect
   */
  oilPaint(radius?: number): this {
    this.operations.push('-paint', String(radius ?? 3));
    return this;
  }

  /**
   * Apply sketch effect
   */
  sketch(radius: number, sigma: number, angle: number): this {
    this.operations.push('-sketch', `${radius}x${sigma}+${angle}`);
    return this;
  }

  /**
   * Apply vignette
   */
  vignette(radius?: number, sigma?: number): this {
    this.operations.push('-vignette', `${radius ?? 0}x${sigma ?? 10}`);
    return this;
  }

  /**
   * Apply polaroid effect
   */
  polaroid(angle?: number): this {
    this.operations.push('-polaroid', String(angle ?? 0));
    return this;
  }

  /**
   * Despeckle (denoise)
   */
  despeckle(): this {
    this.operations.push('-despeckle');
    return this;
  }

  /**
   * Reduce noise
   */
  reduceNoise(radius?: number): this {
    this.operations.push('-noise', String(radius ?? 1));
    return this;
  }

  /**
   * Posterize
   */
  posterize(levels: number): this {
    this.operations.push('-posterize', String(levels));
    return this;
  }

  /**
   * Solarize
   */
  solarize(threshold?: number): this {
    this.operations.push('-solarize', `${threshold ?? 50}%`);
    return this;
  }

  // ============================================================================
  // Borders & Frames
  // ============================================================================

  /**
   * Add border
   */
  border(width: number, height?: number, color?: string): this {
    if (color !== undefined) {
      this.operations.push('-bordercolor', color);
    }
    this.operations.push('-border', `${width}x${height ?? width}`);
    return this;
  }

  /**
   * Add frame
   */
  frame(width: number, height?: number, innerBevel?: number, outerBevel?: number): this {
    let geometry = `${width}x${height ?? width}`;
    if (innerBevel !== undefined) {
      geometry += `+${innerBevel}+${outerBevel ?? innerBevel}`;
    }
    this.operations.push('-frame', geometry);
    return this;
  }

  /**
   * Add shadow
   */
  shadow(opacity: number, sigma: number, x?: number, y?: number): this {
    const xOff = x ?? 4;
    const yOff = y ?? 4;
    this.operations.push(
      '-shadow',
      `${opacity}x${sigma}${xOff >= 0 ? '+' : ''}${xOff}${yOff >= 0 ? '+' : ''}${yOff}`
    );
    return this;
  }

  // ============================================================================
  // Text & Drawing
  // ============================================================================

  /**
   * Set font
   */
  font(fontName: string): this {
    this.operations.push('-font', fontName);
    this.fontSet = true;
    return this;
  }

  /**
   * Set point size
   */
  pointsize(size: number): this {
    this.operations.push('-pointsize', String(size));
    return this;
  }

  /**
   * Set fill color
   */
  fill(color: string): this {
    this.operations.push('-fill', color);
    return this;
  }

  /**
   * Set stroke color
   */
  stroke(color: string): this {
    this.operations.push('-stroke', color);
    return this;
  }

  /**
   * Set stroke width
   */
  strokeWidth(width: number): this {
    this.operations.push('-strokewidth', String(width));
    return this;
  }

  /**
   * Set gravity
   */
  gravity(gravity: GravityType): this {
    this.operations.push('-gravity', gravity);
    return this;
  }

  /**
   * Annotate with text
   */
  annotate(text: string, geometry?: string, angle?: number): this {
    // Use default font if none specified - DejaVu-Sans is bundled with portable binaries
    if (!this.fontSet) {
      this.operations.push('-font', 'DejaVu-Sans');
      this.fontSet = true;
    }
    const geo = geometry ?? '+0+0';
    if (angle !== undefined) {
      this.operations.push('-annotate', `${angle}x${angle}${geo}`, text);
    } else {
      this.operations.push('-annotate', geo, text);
    }
    return this;
  }

  /**
   * Draw primitive
   */
  draw(command: string): this {
    // If drawing text, ensure a font is set
    if (!this.fontSet && /text\s/.test(command)) {
      this.operations.push('-font', 'DejaVu-Sans');
      this.fontSet = true;
    }
    this.operations.push('-draw', command);
    return this;
  }

  // ============================================================================
  // Overlay & Composition
  // ============================================================================

  /**
   * Composite another image
   */
  composite(
    overlayPath: string,
    options?: {
      compose?: CompositeOperator;
      gravity?: GravityType;
      geometry?: string;
    }
  ): this {
    if (options?.compose !== undefined) {
      this.operations.push('-compose', options.compose);
    }
    if (options?.gravity !== undefined) {
      this.operations.push('-gravity', options.gravity);
    }
    if (options?.geometry !== undefined) {
      this.operations.push('-geometry', options.geometry);
    }
    this.operations.push(overlayPath, '-composite');
    return this;
  }

  /**
   * Add watermark
   *
   * @param overlayPath - Path to the watermark image
   * @param gravity - Position for the watermark (default: 'SouthEast')
   * @param opacity - Opacity percentage (0-100)
   * @returns this for chaining
   * @example
   * ```typescript
   * await imageMagick(input)
   *   .watermark('logo.png', 'SouthEast', 50)
   *   .toFile('output.jpg');
   * ```
   */
  watermark(overlayPath: string, gravity?: GravityType, opacity?: number): this {
    this.operations.push('-gravity', gravity ?? 'SouthEast');
    if (opacity !== undefined) {
      this.operations.push('-define', `compose:args=${opacity}`);
    }
    this.operations.push(overlayPath, '-composite');
    return this;
  }

  // ============================================================================
  // Output Options
  // ============================================================================

  /**
   * Set output format
   *
   * @param format - The image format (e.g., 'png', 'jpg', 'webp')
   * @returns this for chaining
   * @remarks The format is actually applied via the output filename extension.
   *          This method is a no-op but kept for API compatibility.
   *          Use the filename extension in `toFile()` to specify the format.
   * @example
   * ```typescript
   * // Set format via filename extension instead
   * await imageMagick(input).resize(800).toFile('output.png');
   * ```
   */
  format(_format: string): this {
    // Format will be applied via output filename
    return this;
  }

  /**
   * Set quality (0-100)
   */
  quality(value: number): this {
    this.operations.push('-quality', String(value));
    return this;
  }

  /**
   * Strip metadata
   */
  strip(): this {
    this.operations.push('-strip');
    return this;
  }

  /**
   * Set interlace mode
   */
  interlace(mode: 'None' | 'Line' | 'Plane'): this {
    this.operations.push('-interlace', mode);
    return this;
  }

  /**
   * Set depth (bits per channel)
   */
  depth(bits: number): this {
    this.operations.push('-depth', String(bits));
    return this;
  }

  /**
   * Set density (DPI)
   */
  density(value: number): this {
    this.operations.push('-density', String(value));
    return this;
  }

  /**
   * Set background color
   */
  background(color: string): this {
    this.operations.push('-background', color);
    return this;
  }

  /**
   * Set alpha channel
   */
  alpha(operation: 'on' | 'off' | 'set' | 'remove' | 'background'): this {
    this.operations.push('-alpha', operation);
    return this;
  }

  /**
   * Flatten layers
   */
  flatten(): this {
    this.operations.push('-flatten');
    return this;
  }

  /**
   * Define a format-specific option
   */
  define(key: string, value: string): this {
    this.operations.push('-define', `${key}=${value}`);
    return this;
  }

  /**
   * Add raw command-line arguments
   */
  raw(...args: string[]): this {
    this.operations.push(...args);
    return this;
  }

  // ============================================================================
  // Output Methods
  // ============================================================================

  /**
   * Write to file
   */
  async toFile(outputPath: string): Promise<ExecuteResult> {
    const args = this.buildArgs(outputPath);
    return execute(args, this.execOptions);
  }

  /**
   * Write to buffer
   */
  async toBuffer(format?: string): Promise<Buffer> {
    const fmt = format ?? 'png';
    const args = this.buildArgs(`${fmt}:-`);

    // Pass buffer input if using stdin
    const input = typeof this.inputSource === 'string' ? undefined : this.inputSource;
    const streamResult = await executeStream(args, this.execOptions, input);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      streamResult.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      streamResult.stdout.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      streamResult.stdout.on('error', reject);

      streamResult.done.catch(reject);
    });
  }

  /**
   * Get a readable stream
   */
  async toStream(format?: string): Promise<StreamResult> {
    const fmt = format ?? 'png';
    const args = this.buildArgs(`${fmt}:-`);

    // Pass buffer input if using stdin
    const input = typeof this.inputSource === 'string' ? undefined : this.inputSource;
    return executeStream(args, this.execOptions, input);
  }

  /**
   * Build the command arguments
   */
  private buildArgs(output: string): string[] {
    const args: string[] = ['convert'];

    // Handle input
    if (typeof this.inputSource === 'string') {
      args.push(this.inputSource);
    } else {
      // Buffer input - use stdin
      args.push('-');
    }

    // Add operations
    args.push(...this.operations);

    // Add output
    args.push(output);

    return args;
  }
}

/**
 * Create a new ImageMagick processor
 */
export function imageMagick(input: string | Buffer): ImageMagick {
  return new ImageMagick(input);
}

/**
 * Alias for imageMagick
 */
export const im = imageMagick;
