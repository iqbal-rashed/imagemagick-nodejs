/**
 * ImageMagick Node.js Wrapper - Import Command
 *
 * Wrapper for the `magick import` command for screen capture.
 * Note: This command requires X11 on Linux/Unix systems.
 */

import { execute } from '../core/executor';
import { ExecuteOptions, ExecuteResult } from '../core/types';

/**
 * Arguments builder for import command
 */
export class ImportArgs {
  private args: string[] = [];
  private outputFile: string = '';

  /**
   * Set output file
   */
  output(file: string): this {
    this.outputFile = file;
    return this;
  }

  /**
   * Capture the entire screen
   */
  screen(): this {
    this.args.push('-screen');
    return this;
  }

  /**
   * Capture a specific window by ID
   */
  window(id: string): this {
    this.args.push('-window', id);
    return this;
  }

  /**
   * Capture the root window
   */
  root(): this {
    this.args.push('-window', 'root');
    return this;
  }

  /**
   * Pause before capture (in seconds)
   */
  pause(seconds: number): this {
    this.args.push('-pause', String(seconds));
    return this;
  }

  /**
   * Include window frame
   */
  frame(): this {
    this.args.push('-frame');
    return this;
  }

  /**
   * Include window border
   */
  border(): this {
    this.args.push('-border');
    return this;
  }

  /**
   * Silent mode (no beep)
   */
  silent(): this {
    this.args.push('-silent');
    return this;
  }

  /**
   * Crop after capture
   */
  crop(geometry: string): this {
    this.args.push('-crop', geometry);
    return this;
  }

  /**
   * Set monitor/display
   */
  display(display: string): this {
    this.args.push('-display', display);
    return this;
  }

  /**
   * Descend window hierarchy
   */
  descend(): this {
    this.args.push('-descend');
    return this;
  }

  /**
   * Capture with snaps
   */
  snaps(count: number): this {
    this.args.push('-snaps', String(count));
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
    const result: string[] = ['import'];
    result.push(...this.args);
    result.push(this.outputFile);
    return result;
  }
}

/**
 * Create a new import arguments builder
 */
export function importScreen(): ImportArgs {
  return new ImportArgs();
}

/**
 * Execute an import command
 */
export async function runImport(
  builder: ImportArgs,
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute(builder.build(), options);
}

/**
 * Capture the entire screen
 */
export async function captureScreen(
  output: string,
  options?: {
    pause?: number;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = importScreen().root().output(output);

  if (options?.pause !== undefined) {
    builder.pause(options.pause);
  }

  return runImport(builder, execOptions);
}

/**
 * Capture a specific window
 */
export async function captureWindow(
  windowId: string,
  output: string,
  options?: {
    frame?: boolean;
    border?: boolean;
    pause?: number;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = importScreen().window(windowId).output(output);

  if (options?.frame === true) {
    builder.frame();
  }

  if (options?.border === true) {
    builder.border();
  }

  if (options?.pause !== undefined) {
    builder.pause(options.pause);
  }

  return runImport(builder, execOptions);
}

/**
 * Interactive screen capture (user selects region by clicking)
 */
export async function captureRegion(
  output: string,
  options?: {
    pause?: number;
    silent?: boolean;
  },
  execOptions?: ExecuteOptions
): Promise<ExecuteResult> {
  const builder = importScreen().output(output);

  if (options?.pause !== undefined) {
    builder.pause(options.pause);
  }

  if (options?.silent === true) {
    builder.silent();
  }

  return runImport(builder, execOptions);
}
