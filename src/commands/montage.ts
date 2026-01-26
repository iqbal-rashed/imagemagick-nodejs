/**
 * ImageMagick Node.js Wrapper - Montage Command
 *
 * Wrapper for the `magick montage` command for creating image montages/contact sheets.
 */

import { execute } from '../core/executor';
import { ExecuteOptions, ExecuteResult, GravityType } from '../core/types';

/**
 * Arguments builder for montage command
 */
export class MontageArgs {
  private args: string[] = [];
  private inputFiles: string[] = [];
  private outputFile: string = '';

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

  /**
   * Set tile geometry (e.g., "3x3", "4x", "x2")
   */
  tile(geometry: string): this {
    this.args.push('-tile', geometry);
    return this;
  }

  /**
   * Set tile columns and rows
   */
  tileGrid(columns: number, rows?: number): this {
    if (rows !== undefined) {
      this.args.push('-tile', `${columns}x${rows}`);
    } else {
      this.args.push('-tile', `${columns}x`);
    }
    return this;
  }

  /**
   * Set geometry of each tile (e.g., "100x100+5+5")
   */
  geometry(geometry: string): this {
    this.args.push('-geometry', geometry);
    return this;
  }

  /**
   * Set tile size and spacing
   */
  tileSize(width: number, height?: number, xSpacing?: number, ySpacing?: number): this {
    let geo = `${width}x${height ?? width}`;
    if (xSpacing !== undefined) {
      geo += `+${xSpacing}+${ySpacing ?? xSpacing}`;
    }
    this.args.push('-geometry', geo);
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
   * Set border width
   */
  borderWidth(width: number): this {
    this.args.push('-borderwidth', String(width));
    return this;
  }

  /**
   * Set border color
   */
  borderColor(color: string): this {
    this.args.push('-bordercolor', color);
    return this;
  }

  /**
   * Add frame to each tile
   */
  frame(geometry: string): this {
    this.args.push('-frame', geometry);
    return this;
  }

  /**
   * Add frame with dimensions
   */
  frameSize(width: number, height?: number, innerBevel?: number, outerBevel?: number): this {
    let geo = `${width}x${height ?? width}`;
    if (innerBevel !== undefined) {
      geo += `+${innerBevel}+${outerBevel ?? innerBevel}`;
    }
    this.args.push('-frame', geo);
    return this;
  }

  /**
   * Add shadow to tiles
   */
  shadow(): this {
    this.args.push('-shadow');
    return this;
  }

  /**
   * Set mattecolor for frame
   */
  matteColor(color: string): this {
    this.args.push('-mattecolor', color);
    return this;
  }

  /**
   * Set title for the montage
   */
  title(text: string): this {
    this.args.push('-title', text);
    return this;
  }

  /**
   * Set label for each tile (uses escape sequences like %f for filename)
   */
  label(text: string): this {
    this.args.push('-label', text);
    return this;
  }

  /**
   * Set font for title/labels
   */
  font(font: string): this {
    this.args.push('-font', font);
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
   * Set fill color for text
   */
  fill(color: string): this {
    this.args.push('-fill', color);
    return this;
  }

  /**
   * Set stroke color for text
   */
  stroke(color: string): this {
    this.args.push('-stroke', color);
    return this;
  }

  /**
   * Set gravity for image positioning
   */
  gravity(gravity: GravityType): this {
    this.args.push('-gravity', gravity);
    return this;
  }

  /**
   * Set thumbnail mode (uses -thumbnail instead of -resize)
   */
  thumbnail(geometry: string): this {
    this.args.push('-thumbnail', geometry);
    return this;
  }

  /**
   * Set mode for arranging images
   */
  mode(mode: 'Frame' | 'Unframe' | 'Concatenate'): this {
    this.args.push('-mode', mode);
    return this;
  }

  /**
   * Set texture for background
   */
  texture(file: string): this {
    this.args.push('-texture', file);
    return this;
  }

  /**
   * Set polaroid effect angle
   */
  polaroid(angle?: number): this {
    if (angle !== undefined) {
      this.args.push('-polaroid', String(angle));
    } else {
      this.args.push('+polaroid');
    }
    return this;
  }

  /**
   * Set quality for output
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
    const result: string[] = ['montage'];
    result.push(...this.args);
    result.push(...this.inputFiles);
    result.push(this.outputFile);
    return result;
  }
}

/**
 * Create a new montage arguments builder
 */
export function montage(input?: string | string[]): MontageArgs {
  const builder = new MontageArgs();
  if (input !== undefined) {
    builder.input(input);
  }
  return builder;
}

/**
 * Execute a montage command
 */
export async function runMontage(
  builder: MontageArgs,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute(builder.build(), options);
}

/**
 * Create a simple contact sheet
 */
export async function createContactSheet(
  images: string[],
  output: string,
  options?: {
    columns?: number;
    rows?: number;
    tileSize?: number;
    spacing?: number;
    background?: string;
    label?: boolean;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = montage(images).output(output);

  const cols = options?.columns ?? 4;
  const rows = options?.rows;
  builder.tileGrid(cols, rows);

  const size = options?.tileSize ?? 150;
  const spacing = options?.spacing ?? 5;
  builder.tileSize(size, size, spacing, spacing);

  if (options?.background !== undefined) {
    builder.background(options.background);
  }

  if (options?.label === true) {
    builder.label('%f');
    builder.pointsize(10);
  }

  return runMontage(builder, execOptions);
}

/**
 * Create a polaroid-style montage
 */
export async function createPolaroidMontage(
  images: string[],
  output: string,
  options?: {
    columns?: number;
    background?: string;
    angle?: number;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = montage(images)
    .output(output)
    .tileGrid(options?.columns ?? 4)
    .background(options?.background ?? 'none')
    .polaroid(options?.angle);

  return runMontage(builder, execOptions);
}

/**
 * Create a thumbnail gallery
 */
export async function createThumbnailGallery(
  images: string[],
  output: string,
  options?: {
    thumbnailSize?: number;
    columns?: number;
    background?: string;
    shadow?: boolean;
    frame?: boolean;
    title?: string;
    label?: string;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = montage(images).output(output);

  const size = options?.thumbnailSize ?? 200;
  builder.thumbnail(`${size}x${size}`);
  builder.geometry(`${size}x${size}+5+5`);

  if (options?.columns !== undefined) {
    builder.tileGrid(options.columns);
  }

  if (options?.background !== undefined) {
    builder.background(options.background);
  }

  if (options?.shadow === true) {
    builder.shadow();
  }

  if (options?.frame === true) {
    builder.frameSize(5, 5, 2, 2);
  }

  if (options?.title !== undefined) {
    builder.title(options.title);
  }

  if (options?.label !== undefined) {
    builder.label(options.label);
  }

  return runMontage(builder, execOptions);
}
