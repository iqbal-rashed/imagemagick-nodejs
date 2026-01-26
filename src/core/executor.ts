/**
 * ImageMagick Node.js Wrapper - Command Executor
 *
 * Core execution engine for running ImageMagick commands.
 */

import { spawn, ChildProcess } from 'child_process';
import { Readable, Writable } from 'stream';
import { findBinary } from './binary';
import { ExecuteOptions, ExecuteResult } from './types';
import { ExecutionError, TimeoutError, BinaryNotFoundError } from '../utils/errors';
import { sanitizeArguments } from '../utils/validation';

/**
 * Default execution options
 */
const DEFAULT_OPTIONS: Required<Omit<ExecuteOptions, 'cwd' | 'env'>> = {
  timeout: 60000, // 60 seconds
  verbose: false,
};

/**
 * Stream execution result
 */
export interface StreamResult {
  /** The spawned child process */
  process: ChildProcess;
  /** Readable stream for stdout */
  stdout: Readable;
  /** Readable stream for stderr */
  stderr: Readable;
  /** Writable stream for stdin */
  stdin: Writable;
  /** Promise that resolves when process exits */
  done: Promise<ExecuteResult>;
}

/**
 * Build the full command with subcommand
 */
function _buildCommand(subcommand?: string): string[] {
  if (subcommand !== undefined && subcommand !== '') {
    return [subcommand];
  }
  return [];
}

/**
 * Execute an ImageMagick command and return the result
 *
 * @param args - Command arguments
 * @param options - Execution options
 * @returns Promise resolving to execution result
 */
export async function execute(args: string[], options?: ExecuteOptions): Promise<ExecuteResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Sanitize arguments to prevent command injection
  const sanitizedArgs = sanitizeArguments(args);

  const binaryPath = await findBinary();

  if (opts.verbose) {
    console.log(`[ImageMagick] Executing: ${binaryPath} ${sanitizedArgs.join(' ')}`);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(binaryPath, sanitizedArgs, {
      cwd: opts.cwd,
      timeout: opts.timeout,
      env: { ...process.env, ...opts.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    // Set up timeout
    const timeoutId =
      opts.timeout > 0
        ? setTimeout(() => {
            killed = true;
            proc.kill('SIGKILL');
          }, opts.timeout)
        : null;

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (killed) {
        reject(new TimeoutError(`${binaryPath} ${sanitizedArgs.join(' ')}`, opts.timeout));
        return;
      }

      const exitCode = code ?? 0;

      if (opts.verbose) {
        console.log(`[ImageMagick] Exit code: ${exitCode}`);
        if (stderr !== '') {
          console.log(`[ImageMagick] Stderr: ${stderr}`);
        }
      }

      // ImageMagick returns non-zero exit codes on errors
      if (exitCode !== 0) {
        reject(
          new ExecutionError(
            `ImageMagick command failed: ${stderr || stdout}`,
            binaryPath,
            sanitizedArgs,
            exitCode,
            stderr,
            stdout
          )
        );
        return;
      }

      resolve({ stdout, stderr, exitCode });
    });

    proc.on('error', (_error) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      reject(new BinaryNotFoundError(binaryPath));
    });
  });
}

/**
 * Execute an ImageMagick command with streaming support
 *
 * @param args - Command arguments
 * @param options - Execution options
 * @param input - Optional input buffer to write to stdin
 * @returns Stream result with process and streams
 */
export async function executeStream(
  args: string[],
  options?: ExecuteOptions,
  input?: Buffer
): Promise<StreamResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Sanitize arguments to prevent command injection
  const sanitizedArgs = sanitizeArguments(args);

  const binaryPath = await findBinary();

  if (opts.verbose) {
    console.log(`[ImageMagick] Streaming: ${binaryPath} ${sanitizedArgs.join(' ')}`);
  }

  const proc = spawn(binaryPath, sanitizedArgs, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let timeoutId: NodeJS.Timeout | null = null;
  let killed = false;

  // Write input buffer to stdin if provided
  if (input !== undefined) {
    proc.stdin.write(input);
    proc.stdin.end();
  }

  const done = new Promise<ExecuteResult>((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    // Set up timeout
    if (opts.timeout > 0) {
      timeoutId = setTimeout(() => {
        killed = true;
        proc.kill('SIGKILL');
      }, opts.timeout);
    }

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (killed) {
        reject(new TimeoutError(`${binaryPath} ${sanitizedArgs.join(' ')}`, opts.timeout));
        return;
      }

      const exitCode = code ?? 0;

      if (exitCode !== 0) {
        reject(
          new ExecutionError(
            `ImageMagick command failed: ${stderr || stdout}`,
            binaryPath,
            args,
            exitCode,
            stderr,
            stdout
          )
        );
        return;
      }

      resolve({ stdout, stderr, exitCode });
    });

    proc.on('error', (_error) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      reject(new BinaryNotFoundError(binaryPath));
    });
  });

  return {
    process: proc,
    stdout: proc.stdout,
    stderr: proc.stderr,
    stdin: proc.stdin,
    done,
  };
}

/**
 * Execute an ImageMagick subcommand (e.g., convert, identify, mogrify)
 *
 * @param subcommand - The subcommand to run (e.g., 'convert', 'identify')
 * @param args - Additional arguments
 * @param options - Execution options
 * @returns Promise resolving to execution result
 */
export async function executeSubcommand(
  subcommand: string,
  args: string[],
  options?: ExecuteOptions
): Promise<ExecuteResult> {
  return execute([subcommand, ...args], options);
}

/**
 * Execute multiple commands in parallel
 *
 * @param commands - Array of command argument arrays
 * @param options - Execution options (applied to all commands)
 * @returns Promise resolving to array of results
 */
export async function executeBatch(
  commands: string[][],
  options?: ExecuteOptions
): Promise<ExecuteResult[]> {
  return Promise.all(commands.map((args) => execute(args, options)));
}

/**
 * Execute multiple commands sequentially
 *
 * @param commands - Array of command argument arrays
 * @param options - Execution options (applied to all commands)
 * @returns Promise resolving to array of results
 */
export async function executeSequential(
  commands: string[][],
  options?: ExecuteOptions
): Promise<ExecuteResult[]> {
  const results: ExecuteResult[] = [];

  for (const args of commands) {
    const result = await execute(args, options);
    results.push(result);
  }

  return results;
}
