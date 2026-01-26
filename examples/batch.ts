/**
 * Example: Batch Processing
 *
 * Demonstrates batch processing multiple images with progress tracking.
 */

import {
  findImages,
  processBatch,
  batchResizeFiles,
  batchOptimizeFiles,
  batchConvertFiles,
  type BatchProgress,
} from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

async function main(): Promise<void> {
  console.log('ImageMagick Batch Processing Example\n');

  // Use samples folder for input, outputs folder for output
  const inputDir = process.argv[2] ?? path.join(__dirname, '../samples');
  const outputDir = process.argv[3] ?? path.join(__dirname, '../outputs/batch');

  console.log(`Input directory: ${path.relative(process.cwd(), inputDir)}`);
  console.log(`Output directory: ${path.relative(process.cwd(), outputDir)}\n`);

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Find all images in directory
  console.log(`Scanning ${inputDir} for images...`);
  const images = await findImages(inputDir, {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    recursive: false,
  });

  console.log(`Found ${images.length} images\n`);

  if (images.length === 0) {
    console.log('No images found. Please add some images to the samples directory.');
    return;
  }

  // Example 1: Batch resize with progress tracking
  console.log('1. Batch Resize with Progress Tracking');
  console.log('-'.repeat(60));

  const resizeOutputDir = path.join(outputDir, 'resized');
  await fs.promises.mkdir(resizeOutputDir, { recursive: true });

  const result1 = await batchResizeFiles(
    images,
    resizeOutputDir,
    { width: 800 },
    {
      quality: 85,
      onProgress: (progress: BatchProgress) => {
        const bar = createProgressBar(progress.percentage);
        process.stdout.write(
          `\r${bar} ${progress.percentage}% - ${path.basename(progress.current)}`
        );
        if (progress.complete) {
          console.log('\n');
        }
      },
    }
  );

  console.log(`  Success: ${result1.success.length}`);
  console.log(`  Failed: ${result1.failed.length}`);
  console.log(`  Duration: ${(result1.duration / 1000).toFixed(2)}s\n`);

  // Example 2: Batch convert format
  console.log('2. Batch Convert to WebP');
  console.log('-'.repeat(60));

  const convertOutputDir = path.join(outputDir, 'webp');
  await fs.promises.mkdir(convertOutputDir, { recursive: true });

  const result2 = await batchConvertFiles(images, convertOutputDir, 'webp', {
    quality: 82,
    onProgress: (progress: BatchProgress) => {
      const bar = createProgressBar(progress.percentage);
      process.stdout.write(`\r${bar} ${progress.percentage}%`);
      if (progress.complete) {
        console.log('\n');
      }
    },
  });

  console.log(`  Success: ${result2.success.length}`);
  console.log(`  Failed: ${result2.failed.length}`);
  console.log(`  Duration: ${(result2.duration / 1000).toFixed(2)}s\n`);

  // Example 3: Batch optimize
  console.log('3. Batch Optimize');
  console.log('-'.repeat(60));

  const optimizeOutputDir = path.join(outputDir, 'optimized');
  await fs.promises.mkdir(optimizeOutputDir, { recursive: true });

  const result3 = await batchOptimizeFiles(images, optimizeOutputDir, {
    quality: 85,
    strip: true,
    onProgress: (progress: BatchProgress) => {
      const bar = createProgressBar(progress.percentage);
      process.stdout.write(`\r${bar} ${progress.percentage}%`);
      if (progress.complete) {
        console.log('\n');
      }
    },
  });

  console.log(`  Success: ${result3.success.length}`);
  console.log(`  Failed: ${result3.failed.length}`);
  console.log(`  Duration: ${(result3.duration / 1000).toFixed(2)}s\n`);

  // Example 4: Custom batch processing with processBatch
  console.log('4. Custom Batch Processing');
  console.log('-'.repeat(60));

  const customOutputDir = path.join(outputDir, 'custom');
  await fs.promises.mkdir(customOutputDir, { recursive: true });

  const result4 = await processBatch(
    images,
    (file) => {
      const outputFile = path.join(customOutputDir, path.basename(file));
      return [
        'convert',
        file,
        '-resize',
        '600x600>', // Only shrink if larger
        '-quality',
        '80',
        '-strip',
        outputFile,
      ];
    },
    {
      parallel: 2, // Process 2 images at a time
      onProgress: (progress: BatchProgress) => {
        console.log(
          `  Processing: ${path.basename(progress.current)} (${progress.index}/${progress.total})`
        );
      },
      continueOnError: true,
    }
  );

  console.log(` \n  Success: ${result4.success.length}`);
  console.log(`  Failed: ${result4.failed.length}`);
  console.log(`  Duration: ${(result4.duration / 1000).toFixed(2)}s\n`);

  if (result4.failed.length > 0) {
    console.log('Failed files:');
    for (const { file, error } of result4.failed) {
      console.log(`  ${path.basename(file)}: ${error.message}`);
    }
  }

  console.log('\nBatch processing complete!');
}

function createProgressBar(percentage: number): string {
  const width = 30;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
}

main().catch(console.error);
