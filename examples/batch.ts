/**
 * Example: Batch Processing
 *
 * Demonstrates batch processing multiple images with progress tracking.
 */

import { findImages, processBatch, batchOptimizeFiles, BatchProgress } from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

async function main(): Promise<void> {
  console.log('ImageMagick Batch Processing Example\n');

  const inputDir = process.argv[2];
  const outputDir = process.argv[3] ?? './output';

  if (inputDir === undefined) {
    console.log('Usage: npx ts-node examples/batch.ts <input-dir> [output-dir]');
    showApiExamples();
    return;
  }

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Find all images in directory
  console.log(`Scanning ${inputDir} for images...`);
  const images = await findImages(inputDir, {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    recursive: true,
  });

  console.log(`Found ${images.length} images\n`);

  if (images.length === 0) {
    console.log('No images found.');
    return;
  }

  // Process with progress tracking
  console.log('Processing images...\n');

  const onProgress = (progress: BatchProgress): void => {
    const bar = createProgressBar(progress.percentage);
    process.stdout.write(`\r${bar} ${progress.percentage}% - ${path.basename(progress.current)}`);
    if (progress.complete) {
      console.log('\n');
    }
  };

  const result = await processBatch(
    images,
    (file) => {
      const outputFile = path.join(outputDir, path.basename(file));
      return [
        'convert',
        file,
        '-resize',
        '1200x1200>', // Only shrink if larger
        '-quality',
        '85',
        '-strip',
        outputFile,
      ];
    },
    {
      parallel: 4,
      onProgress,
      continueOnError: true,
    }
  );

  // Summary
  console.log('Batch processing complete!');
  console.log(`  Success: ${result.success.length}`);
  console.log(`  Failed: ${result.failed.length}`);
  console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);

  if (result.failed.length > 0) {
    console.log('\nFailed files:');
    for (const { file, error } of result.failed) {
      console.log(`  ${path.basename(file)}: ${error.message}`);
    }
  }
}

function createProgressBar(percentage: number): string {
  const width = 30;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
}

function showApiExamples(): void {
  console.log(`
// Batch Processing Examples:

// Find all images in a directory
const images = await findImages('./photos', {
  extensions: ['.jpg', '.png'],
  recursive: true,
});

// Process with progress tracking
const result = await processBatch(
  images,
  (file) => ['convert', file, '-resize', '800x800>', outputPath(file)],
  {
    parallel: 4,
    onProgress: ({ percentage, current }) => {
      console.log(\`\${percentage}% - \${current}\`);
    },
  }
);

// Quick batch resize
await batchResizeFiles(images, './output', { width: 800 });

// Quick batch optimize
await batchOptimizeFiles(images, './output', { quality: 85 });

// Quick batch convert
await batchConvertFiles(images, './output', 'webp', { quality: 82 });
`);
}

main().catch(console.error);
