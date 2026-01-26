/**
 * ImageMagick Node.js Wrapper - Composite Command
 *
 * Wrapper for the `magick composite` command for image composition and overlays.
 */

import { execute } from '../core/executor';
import { ExecuteOptions, ExecuteResult, CompositeOperator, GravityType } from '../core/types';

/**
 * Arguments builder for composite command
 */
export class CompositeArgs {
  private args: string[] = [];
  private overlayFile: string = '';
  private backgroundFile: string = '';
  private maskFile: string = '';
  private outputFile: string = '';

  /**
   * Set the overlay (source) image
   */
  overlay(file: string): this {
    this.overlayFile = file;
    return this;
  }

  /**
   * Set the background (destination) image
   */
  background(file: string): this {
    this.backgroundFile = file;
    return this;
  }

  /**
   * Set a mask image
   */
  mask(file: string): this {
    this.maskFile = file;
    return this;
  }

  /**
   * Set the output file
   */
  output(file: string): this {
    this.outputFile = file;
    return this;
  }

  /**
   * Set the compose operator
   */
  compose(operator: CompositeOperator): this {
    this.args.push('-compose', operator);
    return this;
  }

  /**
   * Set the geometry (position)
   */
  geometry(geometry: string): this {
    this.args.push('-geometry', geometry);
    return this;
  }

  /**
   * Set position using x,y offset
   */
  position(x: number, y: number): this {
    const xSign = x >= 0 ? '+' : '';
    const ySign = y >= 0 ? '+' : '';
    this.args.push('-geometry', `${xSign}${x}${ySign}${y}`);
    return this;
  }

  /**
   * Set gravity for positioning
   */
  gravity(gravity: GravityType): this {
    this.args.push('-gravity', gravity);
    return this;
  }

  /**
   * Set blend percentage
   */
  blend(amount: number | string): this {
    this.args.push('-blend', String(amount));
    return this;
  }

  /**
   * Set dissolve percentage
   */
  dissolve(amount: number): this {
    this.args.push('-dissolve', String(amount));
    return this;
  }

  /**
   * Tile the overlay image
   */
  tile(): this {
    this.args.push('-tile');
    return this;
  }

  /**
   * Set watermark percentage
   */
  watermark(brightness: number, saturation?: number): this {
    if (saturation !== undefined) {
      this.args.push('-watermark', `${brightness}x${saturation}`);
    } else {
      this.args.push('-watermark', String(brightness));
    }
    return this;
  }

  /**
   * Set stereo offset for 3D images
   */
  stereo(xOffset: number): this {
    this.args.push('-stereo', `+${xOffset}`);
    return this;
  }

  /**
   * Displace using a displacement map
   */
  displace(xScale: number, yScale?: number): this {
    if (yScale !== undefined) {
      this.args.push('-displace', `${xScale}x${yScale}`);
    } else {
      this.args.push('-displace', String(xScale));
    }
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
    const result: string[] = ['composite'];
    result.push(...this.args);
    result.push(this.overlayFile);
    result.push(this.backgroundFile);
    if (this.maskFile !== '') {
      result.push(this.maskFile);
    }
    result.push(this.outputFile);
    return result;
  }
}

/**
 * Create a new composite arguments builder
 */
export function composite(overlay?: string, background?: string): CompositeArgs {
  const builder = new CompositeArgs();
  if (overlay !== undefined) {
    builder.overlay(overlay);
  }
  if (background !== undefined) {
    builder.background(background);
  }
  return builder;
}

/**
 * Execute a composite command
 */
export async function runComposite(
  builder: CompositeArgs,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute(builder.build(), options);
}

/**
 * Simple overlay function
 */
export async function overlayImage(
  overlay: string,
  background: string,
  output: string,
  options?: {
    gravity?: GravityType;
    position?: { x: number; y: number };
    opacity?: number;
    compose?: CompositeOperator;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = composite(overlay, background).output(output);

  if (options?.gravity !== undefined) {
    builder.gravity(options.gravity);
  }

  if (options?.position !== undefined) {
    builder.position(options.position.x, options.position.y);
  }

  if (options?.opacity !== undefined) {
    builder.dissolve(options.opacity);
  }

  if (options?.compose !== undefined) {
    builder.compose(options.compose);
  }

  return runComposite(builder, execOptions);
}

/**
 * Add a watermark to an image
 */
export async function addWatermark(
  watermark: string,
  image: string,
  output: string,
  options?: {
    gravity?: GravityType;
    opacity?: number;
    tile?: boolean;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = composite(watermark, image).output(output);

  builder.gravity(options?.gravity ?? 'SouthEast');

  if (options?.opacity !== undefined) {
    builder.dissolve(options.opacity);
  }

  if (options?.tile === true) {
    builder.tile();
  }

  return runComposite(builder, execOptions);
}

/**
 * Blend two images together
 */
export async function blendImages(
  image1: string,
  image2: string,
  output: string,
  blendAmount: number = 50,
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = composite(image1, image2).blend(blendAmount).output(output);

  return runComposite(builder, execOptions);
}

/**
 * Apply a mask to an image
 */
export async function applyMask(
  image: string,
  mask: string,
  background: string,
  output: string,
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = composite(image, background).mask(mask).compose('In').output(output);

  return runComposite(builder, execOptions);
}
