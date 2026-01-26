/**
 * ImageMagick Node.js Wrapper - Compare Command
 *
 * Wrapper for the `magick compare` command for comparing images.
 */

import { execute } from '../core/executor';
import { ExecuteOptions, CompareResult } from '../core/types';
import { ParseError } from '../utils/errors';

/**
 * Compare metric types
 */
export type CompareMetric =
  | 'AE' // Absolute Error
  | 'DSSIM' // Structural Dissimilarity
  | 'Fuzz' // Mean Color Distance
  | 'MAE' // Mean Absolute Error
  | 'MEPP' // Mean Error Per Pixel
  | 'MSE' // Mean Squared Error
  | 'NCC' // Normalized Cross Correlation
  | 'PAE' // Peak Absolute Error
  | 'PHASH' // Perceptual Hash
  | 'PSNR' // Peak Signal to Noise Ratio
  | 'RMSE' // Root Mean Squared Error
  | 'SSIM'; // Structural Similarity

/**
 * Arguments builder for compare command
 */
export class CompareArgs {
  private args: string[] = [];
  private image1: string = '';
  private image2: string = '';
  private outputFile: string = '';
  private _metric: CompareMetric = 'AE';

  /**
   * Set the first image to compare
   */
  first(file: string): this {
    this.image1 = file;
    return this;
  }

  /**
   * Set the second image to compare
   */
  second(file: string): this {
    this.image2 = file;
    return this;
  }

  /**
   * Set the output difference image
   */
  output(file: string): this {
    this.outputFile = file;
    return this;
  }

  /**
   * Set the comparison metric
   */
  metric(metric: CompareMetric): this {
    this._metric = metric;
    this.args.push('-metric', metric);
    return this;
  }

  /**
   * Set fuzz factor for comparison (percentage or absolute)
   */
  fuzz(value: number | string): this {
    this.args.push('-fuzz', String(value));
    return this;
  }

  /**
   * Set highlight color for differences
   */
  highlightColor(color: string): this {
    this.args.push('-highlight-color', color);
    return this;
  }

  /**
   * Set lowlight color for similar areas
   */
  lowlightColor(color: string): this {
    this.args.push('-lowlight-color', color);
    return this;
  }

  /**
   * Set compose method for difference visualization
   */
  compose(method: string): this {
    this.args.push('-compose', method);
    return this;
  }

  /**
   * Use subimage search
   */
  subimageSearch(): this {
    this.args.push('-subimage-search');
    return this;
  }

  /**
   * Set similarity threshold
   */
  similarityThreshold(value: number): this {
    this.args.push('-similarity-threshold', String(value));
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
   * Get the metric being used
   */
  getMetric(): CompareMetric {
    return this._metric;
  }

  /**
   * Build the final arguments array
   */
  build(): string[] {
    const result: string[] = ['compare'];
    result.push(...this.args);
    result.push(this.image1);
    result.push(this.image2);
    if (this.outputFile !== '') {
      result.push(this.outputFile);
    } else {
      // If no output, use null: to suppress output
      result.push('null:');
    }
    return result;
  }
}

/**
 * Create a new compare arguments builder
 */
export function compare(image1?: string, image2?: string): CompareArgs {
  const builder = new CompareArgs();
  if (image1 !== undefined) {
    builder.first(image1);
  }
  if (image2 !== undefined) {
    builder.second(image2);
  }
  return builder;
}

/**
 * Execute a compare command and parse results
 */
export async function runCompare(
  builder: CompareArgs,
  options?: ExecuteOptions
): Promise<CompareResult> {
  try {
    const result = await execute(builder.build(), options);

    // Parse the metric value from stderr (ImageMagick outputs metrics to stderr)
    const metricValue = parseMetricValue(result.stderr || result.stdout, builder.getMetric());

    return {
      difference: metricValue,
      identical: metricValue === 0,
      raw: result.stderr || result.stdout,
    };
  } catch (error) {
    // ImageMagick returns exit code 1 when images differ, but still outputs the metric
    if (error instanceof Error && 'stderr' in error) {
      const errObj = error as unknown as { stderr: string; stdout: string };
      const metricValue = parseMetricValue(errObj.stderr || errObj.stdout, builder.getMetric());

      return {
        difference: metricValue,
        identical: false,
        raw: errObj.stderr || errObj.stdout,
      };
    }
    throw error;
  }
}

/**
 * Parse metric value from compare output
 */
function parseMetricValue(output: string, metric: CompareMetric): number {
  const trimmed = output.trim();

  // Handle special cases for different metrics
  if (metric === 'PSNR' && trimmed.toLowerCase() === 'inf') {
    return Infinity; // Images are identical
  }

  // Try to parse as a number
  const value = parseFloat(trimmed);
  if (!isNaN(value)) {
    return value;
  }

  // Try to find a number in the output
  const match = /[\d.]+/.exec(trimmed);
  if (match?.[0] !== undefined) {
    return parseFloat(match[0]);
  }

  throw new ParseError(`Unable to parse metric value from: ${output}`, output);
}

/**
 * Simple comparison function
 */
export async function compareImages(
  image1: string,
  image2: string,
  options?: {
    metric?: CompareMetric;
    outputDiff?: string;
    fuzz?: number;
  },
  execOptions?: ExecuteOptions
): Promise<CompareResult> {
  const builder = compare(image1, image2);

  if (options?.metric !== undefined) {
    builder.metric(options.metric);
  } else {
    builder.metric('AE');
  }

  if (options?.outputDiff !== undefined) {
    builder.output(options.outputDiff);
  }

  if (options?.fuzz !== undefined) {
    builder.fuzz(`${options.fuzz}%`);
  }

  return runCompare(builder, execOptions);
}

/**
 * Check if two images are identical
 */
export async function areIdentical(
  image1: string,
  image2: string,
  fuzz: number = 0,
  execOptions?: ExecuteOptions
): Promise<boolean> {
  const result = await compareImages(image1, image2, { metric: 'AE', fuzz }, execOptions);
  return result.identical;
}

/**
 * Get structural similarity (SSIM) between images
 */
export async function getSSIM(
  image1: string,
  image2: string,
  execOptions?: ExecuteOptions
): Promise<number> {
  const result = await compareImages(image1, image2, { metric: 'SSIM' }, execOptions);
  return result.difference;
}

/**
 * Get perceptual hash difference
 */
export async function getPerceptualDifference(
  image1: string,
  image2: string,
  execOptions?: ExecuteOptions
): Promise<number> {
  const result = await compareImages(image1, image2, { metric: 'PHASH' }, execOptions);
  return result.difference;
}

/**
 * Create a difference visualization image
 */
export async function createDiffImage(
  image1: string,
  image2: string,
  output: string,
  options?: {
    highlightColor?: string;
    lowlightColor?: string;
    fuzz?: number;
  },
  execOptions?: ExecuteOptions
): Promise<CompareResult> {
  const builder = compare(image1, image2).output(output).metric('AE');

  if (options?.highlightColor !== undefined) {
    builder.highlightColor(options.highlightColor);
  }

  if (options?.lowlightColor !== undefined) {
    builder.lowlightColor(options.lowlightColor);
  }

  if (options?.fuzz !== undefined) {
    builder.fuzz(`${options.fuzz}%`);
  }

  return runCompare(builder, execOptions);
}
