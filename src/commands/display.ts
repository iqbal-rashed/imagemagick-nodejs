/**
 * ImageMagick Node.js Wrapper - Display Command
 *
 * Wrapper for the `magick display` command for displaying images.
 * Note: This command requires X11 on Linux/Unix systems or a GUI on Windows.
 */

import { execute } from '../core/executor';
import { ExecuteOptions, ExecuteResult } from '../core/types';

/**
 * Arguments builder for display command
 */
export class DisplayArgs {
  private args: string[] = [];
  private inputFiles: string[] = [];

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
   * Set window title
   */
  title(title: string): this {
    this.args.push('-title', title);
    return this;
  }

  /**
   * Set window geometry
   */
  geometry(geometry: string): this {
    this.args.push('-geometry', geometry);
    return this;
  }

  /**
   * Set window size
   */
  size(width: number, height: number): this {
    this.args.push('-geometry', `${width}x${height}`);
    return this;
  }

  /**
   * Set window position
   */
  position(x: number, y: number): this {
    const xPos = x >= 0 ? `+${x}` : String(x);
    const yPos = y >= 0 ? `+${y}` : String(y);
    this.args.push('-geometry', `${xPos}${yPos}`);
    return this;
  }

  /**
   * Immutable display (no menu)
   */
  immutable(): this {
    this.args.push('-immutable');
    return this;
  }

  /**
   * Update display when file changes
   */
  update(seconds: number): this {
    this.args.push('-update', String(seconds));
    return this;
  }

  /**
   * Set delay for slideshow (hundredths of second)
   */
  delay(value: number): this {
    this.args.push('-delay', String(value));
    return this;
  }

  /**
   * Loop through images
   */
  loop(): this {
    this.args.push('-loop', '0');
    return this;
  }

  /**
   * Set display/monitor
   */
  display(display: string): this {
    this.args.push('-display', display);
    return this;
  }

  /**
   * Set backdrop color
   */
  backdrop(): this {
    this.args.push('-backdrop');
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
   * Set border color
   */
  borderColor(color: string): this {
    this.args.push('-bordercolor', color);
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
   * Colormap type
   */
  colormap(type: 'shared' | 'private'): this {
    this.args.push('-colormap', type);
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
    const result: string[] = ['display'];
    result.push(...this.args);
    result.push(...this.inputFiles);
    return result;
  }
}

/**
 * Create a new display arguments builder
 */
export function display(input?: string | string[]): DisplayArgs {
  const builder = new DisplayArgs();
  if (input !== undefined) {
    builder.input(input);
  }
  return builder;
}

/**
 * Execute a display command
 * Note: This will open a GUI window, not suitable for headless environments
 */
export async function runDisplay(
  builder: DisplayArgs,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute(builder.build(), options);
}

/**
 * Display an image (opens GUI window)
 */
export async function showImage(
  image: string | string[],
  options?: {
    title?: string;
    geometry?: string;
    immutable?: boolean;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = display(image);

  if (options?.title !== undefined) {
    builder.title(options.title);
  }

  if (options?.geometry !== undefined) {
    builder.geometry(options.geometry);
  }

  if (options?.immutable === true) {
    builder.immutable();
  }

  return runDisplay(builder, execOptions);
}

/**
 * Display a slideshow of images
 */
export async function slideshow(
  images: string[],
  options?: {
    delay?: number;
    loop?: boolean;
    title?: string;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = display(images);

  builder.delay(options?.delay ?? 300);

  if (options?.loop !== false) {
    builder.loop();
  }

  if (options?.title !== undefined) {
    builder.title(options.title);
  }

  return runDisplay(builder, execOptions);
}
