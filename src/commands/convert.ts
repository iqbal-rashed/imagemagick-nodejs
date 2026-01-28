/**
 * ImageMagick Node.js Wrapper - Convert Command
 *
 * Wrapper for the `magick convert` command for image conversion and transformation.
 *
 * @remarks
 * This file implements a fluent builder pattern for the convert command.
 * The ConvertArgs class is intentionally kept as a single cohesive unit
 * to maintain the fluent chainable API. While the file exceeds typical
 * line count guidelines, the builder pattern benefits from keeping all
 * methods together for:
 * - Consistent API surface
 * - Easy method chaining
 * - Single import for consumers
 * - Clear organization with internal section dividers
 */

import { execute, executeStream, StreamResult } from '../core/executor';
import {
  ExecuteOptions,
  ExecuteResult,
  ResizeOptions,
  CropOptions,
  RotateOptions,
  BlurOptions,
  SharpenOptions,
  BorderOptions,
  ExtentOptions,
  TrimOptions,
  GravityType,
  ColorspaceType,
  ModulateOptions,
  LevelOptions,
  UnsharpMaskOptions,
} from '../core/types';

/**
 * Arguments builder for convert command
 */
export class ConvertArgs {
  private args: string[] = [];
  private inputFiles: string[] = [];
  private outputFile: string = '';
  private fontSet: boolean = false;

  /**
   * Add input file(s)
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

  // ============================================================================
  // Resize Operations
  // ============================================================================

  /**
   * Resize the image
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
   * Scale the image (faster than resize, no filtering)
   */
  scale(width: number, height?: number): this {
    let geometry = `${width}`;
    if (height !== undefined) geometry += `x${height}`;
    this.args.push('-scale', geometry);
    return this;
  }

  /**
   * Create a thumbnail (faster resize with sharpening)
   */
  thumbnail(width: number, height?: number): this {
    let geometry = `${width}`;
    if (height !== undefined) geometry += `x${height}`;
    this.args.push('-thumbnail', geometry);
    return this;
  }

  /**
   * Sample the image (fastest resize)
   */
  sample(width: number, height?: number): this {
    let geometry = `${width}`;
    if (height !== undefined) geometry += `x${height}`;
    this.args.push('-sample', geometry);
    return this;
  }

  // ============================================================================
  // Crop Operations
  // ============================================================================

  /**
   * Crop the image
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
   * Trim edges from the image
   */
  trim(options?: TrimOptions): this {
    if (options?.fuzz !== undefined) {
      this.args.push('-fuzz', String(options.fuzz));
    }
    this.args.push('-trim', '+repage');
    return this;
  }

  /**
   * Remove border pixels from image
   */
  shave(width: number, height?: number): this {
    const geometry = height !== undefined ? `${width}x${height}` : `${width}x${width}`;
    this.args.push('-shave', geometry);
    return this;
  }

  /**
   * Set the image extent (canvas size)
   */
  extent(options: ExtentOptions): this {
    if (options.background !== undefined) {
      this.args.push('-background', options.background);
    }
    if (options.gravity !== undefined) {
      this.args.push('-gravity', options.gravity);
    }
    this.args.push('-extent', `${options.width}x${options.height}`);
    return this;
  }

  // ============================================================================
  // Transform Operations
  // ============================================================================

  /**
   * Rotate the image
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
   * Flip the image vertically
   */
  flip(): this {
    this.args.push('-flip');
    return this;
  }

  /**
   * Flop the image horizontally
   */
  flop(): this {
    this.args.push('-flop');
    return this;
  }

  /**
   * Transpose the image (flip and rotate 90)
   */
  transpose(): this {
    this.args.push('-transpose');
    return this;
  }

  /**
   * Transverse the image (flop and rotate 90)
   */
  transverse(): this {
    this.args.push('-transverse');
    return this;
  }

  /**
   * Auto-orient based on EXIF data
   */
  autoOrient(): this {
    this.args.push('-auto-orient');
    return this;
  }

  // ============================================================================
  // Color Operations
  // ============================================================================

  /**
   * Set the colorspace
   */
  colorspace(colorspace: ColorspaceType): this {
    this.args.push('-colorspace', colorspace);
    return this;
  }

  /**
   * Modulate brightness, saturation, and hue
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
   * Adjust levels
   */
  level(options: LevelOptions): this {
    const black = options.blackPoint ?? 0;
    const white = options.whitePoint ?? '100%';
    const gamma = options.gamma ?? 1.0;
    this.args.push('-level', `${black},${white},${gamma}`);
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
   * Adjust brightness-contrast
   */
  brightnessContrast(brightness: number, contrast: number): this {
    this.args.push('-brightness-contrast', `${brightness}x${contrast}`);
    return this;
  }

  /**
   * Normalize the image (stretch contrast)
   */
  normalize(): this {
    this.args.push('-normalize');
    return this;
  }

  /**
   * Auto-level the image
   */
  autoLevel(): this {
    this.args.push('-auto-level');
    return this;
  }

  /**
   * Enhance colors
   */
  autoGamma(): this {
    this.args.push('-auto-gamma');
    return this;
  }

  /**
   * Negate the image colors
   */
  negate(): this {
    this.args.push('-negate');
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
   * Colorize the image
   */
  colorize(color: string, amount?: number): this {
    if (amount !== undefined) {
      this.args.push('-fill', color, '-colorize', String(amount));
    } else {
      this.args.push('-fill', color, '-colorize', '100');
    }
    return this;
  }

  /**
   * Tint the image
   */
  tint(color: string): this {
    this.args.push('-fill', color, '-tint', '100');
    return this;
  }

  /**
   * Apply sepia tone
   */
  sepia(threshold?: number): this {
    this.args.push('-sepia-tone', `${threshold ?? 80}%`);
    return this;
  }

  // ============================================================================
  // Filter & Effect Operations
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
   * Apply Gaussian blur
   */
  gaussianBlur(radius: number, sigma: number): this {
    this.args.push('-gaussian-blur', `${radius}x${sigma}`);
    return this;
  }

  /**
   * Apply motion blur
   */
  motionBlur(radius: number, sigma: number, angle: number): this {
    this.args.push('-motion-blur', `${radius}x${sigma}+${angle}`);
    return this;
  }

  /**
   * Apply radial blur
   */
  radialBlur(angle: number): this {
    this.args.push('-radial-blur', String(angle));
    return this;
  }

  /**
   * Sharpen the image
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
   * Apply unsharp mask
   */
  unsharpMask(options: UnsharpMaskOptions): this {
    this.args.push(
      '-unsharp',
      `${options.radius}x${options.sigma}+${options.amount}+${options.threshold}`
    );
    return this;
  }

  /**
   * Apply emboss effect
   */
  emboss(radius?: number): this {
    if (radius !== undefined) {
      this.args.push('-emboss', String(radius));
    } else {
      this.args.push('-emboss', '0');
    }
    return this;
  }

  /**
   * Apply edge detection
   */
  edge(radius?: number): this {
    if (radius !== undefined) {
      this.args.push('-edge', String(radius));
    } else {
      this.args.push('-edge', '1');
    }
    return this;
  }

  /**
   * Apply charcoal effect
   */
  charcoal(radius?: number): this {
    if (radius !== undefined) {
      this.args.push('-charcoal', String(radius));
    } else {
      this.args.push('-charcoal', '1');
    }
    return this;
  }

  /**
   * Apply oil paint effect
   */
  oilPaint(radius?: number): this {
    if (radius !== undefined) {
      this.args.push('-paint', String(radius));
    } else {
      this.args.push('-paint', '3');
    }
    return this;
  }

  /**
   * Apply sketch effect
   */
  sketch(radius: number, sigma: number, angle: number): this {
    this.args.push('-sketch', `${radius}x${sigma}+${angle}`);
    return this;
  }

  /**
   * Apply vignette effect
   */
  vignette(radius?: number, sigma?: number): this {
    const r = radius ?? 0;
    const s = sigma ?? 10;
    this.args.push('-vignette', `${r}x${s}`);
    return this;
  }

  /**
   * Apply polaroid effect
   */
  polaroid(angle?: number): this {
    if (angle !== undefined) {
      this.args.push('-polaroid', String(angle));
    } else {
      this.args.push('-polaroid', '0');
    }
    return this;
  }

  /**
   * Apply despeckle (noise reduction)
   */
  despeckle(): this {
    this.args.push('-despeckle');
    return this;
  }

  /**
   * Reduce noise
   */
  reduceNoise(radius?: number): this {
    if (radius !== undefined) {
      this.args.push('-noise', String(radius));
    } else {
      this.args.push('-noise', '1');
    }
    return this;
  }

  /**
   * Add noise
   */
  addNoise(
    type: 'Gaussian' | 'Impulse' | 'Laplacian' | 'Multiplicative' | 'Poisson' | 'Random' | 'Uniform'
  ): this {
    this.args.push('+noise', type);
    return this;
  }

  /**
   * Apply dither
   */
  dither(method?: string): this {
    if (method !== undefined) {
      this.args.push('-dither', method);
    } else {
      this.args.push('-dither', 'FloydSteinberg');
    }
    return this;
  }

  /**
   * Posterize the image
   */
  posterize(levels: number): this {
    this.args.push('-posterize', String(levels));
    return this;
  }

  /**
   * Solarize the image
   */
  solarize(threshold?: number): this {
    if (threshold !== undefined) {
      this.args.push('-solarize', `${threshold}%`);
    } else {
      this.args.push('-solarize', '50%');
    }
    return this;
  }

  // ============================================================================
  // Border & Frame Operations
  // ============================================================================

  /**
   * Add a border
   */
  border(options: BorderOptions | number): this {
    if (typeof options === 'number') {
      this.args.push('-border', `${options}x${options}`);
    } else {
      if (options.color !== undefined) {
        this.args.push('-bordercolor', options.color);
      }
      const height = options.height ?? options.width;
      this.args.push('-border', `${options.width}x${height}`);
    }
    return this;
  }

  /**
   * Add a frame
   */
  frame(width: number, height?: number, innerBevel?: number, outerBevel?: number): this {
    let geometry = `${width}x${height ?? width}`;
    if (innerBevel !== undefined) {
      geometry += `+${innerBevel}+${outerBevel ?? innerBevel}`;
    }
    this.args.push('-frame', geometry);
    return this;
  }

  /**
   * Add a shadow
   */
  shadow(opacity: number, sigma: number, xOffset?: number, yOffset?: number): this {
    const x = xOffset ?? 4;
    const y = yOffset ?? 4;
    this.args.push(
      '-shadow',
      `${opacity}x${sigma}${x >= 0 ? '+' : ''}${x}${y >= 0 ? '+' : ''}${y}`
    );
    return this;
  }

  // ============================================================================
  // Drawing & Annotation Operations
  // ============================================================================

  /**
   * Set font for drawing operations
   */
  font(font: string): this {
    this.args.push('-font', font);
    this.fontSet = true;
    return this;
  }

  /**
   * Set point size for text
   */
  pointsize(size: number): this {
    this.args.push('-pointsize', String(size));
    return this;
  }

  /**
   * Set fill color
   */
  fill(color: string): this {
    this.args.push('-fill', color);
    return this;
  }

  /**
   * Set stroke color
   */
  stroke(color: string): this {
    this.args.push('-stroke', color);
    return this;
  }

  /**
   * Set stroke width
   */
  strokeWidth(width: number): this {
    this.args.push('-strokewidth', String(width));
    return this;
  }

  /**
   * Draw text on the image
   */
  annotate(text: string, geometry?: string, angle?: number): this {
    // Use default font if none specified - DejaVu-Sans is bundled with portable binaries
    if (!this.fontSet) {
      this.args.push('-font', 'DejaVu-Sans');
      this.fontSet = true;
    }
    if (angle !== undefined && geometry !== undefined) {
      this.args.push('-annotate', `${angle}x${angle}${geometry}`, text);
    } else if (geometry !== undefined) {
      this.args.push('-annotate', geometry, text);
    } else {
      this.args.push('-annotate', '+0+0', text);
    }
    return this;
  }

  /**
   * Draw primitive shapes
   */
  draw(command: string): this {
    // If drawing text, ensure a font is set
    if (!this.fontSet && /text\s/.test(command)) {
      this.args.push('-font', 'DejaVu-Sans');
      this.fontSet = true;
    }
    this.args.push('-draw', command);
    return this;
  }

  /**
   * Set gravity for positioning
   */
  gravity(gravity: GravityType): this {
    this.args.push('-gravity', gravity);
    return this;
  }

  // ============================================================================
  // Output Options
  // ============================================================================

  /**
   * Set output quality (for lossy formats)
   */
  quality(value: number): this {
    this.args.push('-quality', String(value));
    return this;
  }

  /**
   * Strip metadata from image
   */
  strip(): this {
    this.args.push('-strip');
    return this;
  }

  /**
   * Set interlace method
   */
  interlace(method: 'None' | 'Line' | 'Plane' | 'Partition' | 'JPEG' | 'GIF' | 'PNG'): this {
    this.args.push('-interlace', method);
    return this;
  }

  /**
   * Set compression type
   */
  compress(type: string): this {
    this.args.push('-compress', type);
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
   * Set image density (DPI)
   */
  density(value: number | string): this {
    this.args.push('-density', String(value));
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
   * Set alpha channel
   */
  alpha(
    operation:
      | 'on'
      | 'off'
      | 'set'
      | 'opaque'
      | 'transparent'
      | 'extract'
      | 'copy'
      | 'shape'
      | 'remove'
      | 'background'
  ): this {
    this.args.push('-alpha', operation);
    return this;
  }

  /**
   * Flatten layers to single image
   */
  flatten(): this {
    this.args.push('-flatten');
    return this;
  }

  /**
   * Define format-specific options
   */
  define(key: string, value: string): this {
    this.args.push('-define', `${key}=${value}`);
    return this;
  }

  /**
   * Add raw argument(s)
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
    result.push(...this.inputFiles);
    result.push(...this.args);
    if (this.outputFile !== '') {
      result.push(this.outputFile);
    }
    return result;
  }
}

/**
 * Create a new convert arguments builder
 */
export function convert(input?: string | string[]): ConvertArgs {
  const builder = new ConvertArgs();
  if (input !== undefined) {
    builder.input(input);
  }
  return builder;
}

/**
 * Execute a convert command
 */
export async function runConvert(
  builder: ConvertArgs,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute(builder.build(), options);
}

/**
 * Execute a convert command with streaming
 */
export async function runConvertStream(
  builder: ConvertArgs,
  options?: ExecuteOptions
): Promise<StreamResult> {
  return executeStream(builder.build(), options);
}

/**
 * Simple convert function for common use cases
 */
export async function convertImage(
  input: string,
  output: string,
  options?: {
    resize?: { width?: number; height?: number };
    quality?: number;
    strip?: boolean;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = convert(input);

  if (options?.resize !== undefined) {
    builder.resize(options.resize.width ?? 0, options.resize.height);
  }

  if (options?.quality !== undefined) {
    builder.quality(options.quality);
  }

  if (options?.strip === true) {
    builder.strip();
  }

  builder.output(output);

  return runConvert(builder, execOptions);
}
