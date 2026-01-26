/**
 * ImageMagick Node.js Wrapper - Performance Benchmarks
 *
 * This example demonstrates the performance of the library across different
 * operations and batch sizes.
 */

import { imageMagick, isAvailable, findImages, processBatch } from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

const SAMPLES_DIR = path.join(__dirname, '../samples');
const OUTPUT_DIR = path.join(__dirname, '../outputs/benchmark');

async function runBenchmarks() {
  console.log('ImageMagick Performance Benchmarks\n');

  if (!(await isAvailable())) {
    console.error('Error: ImageMagick binary not found. Please install ImageMagick.');
    return;
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const images = await findImages(SAMPLES_DIR);
  if (images.length === 0) {
    console.error('Error: No sample images found in samples directory.');
    return;
  }

  const sampleImage = images[0]!;
  console.log(`Sample Image: ${path.basename(sampleImage)}`);
  console.log('------------------------------------------------------------\n');

  // 1. Single Image Latency
  console.log('1. Single Image Latency (Resizing)');
  const latencyResults = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await imageMagick(sampleImage)
      .resize(800)
      .quality(85)
      .toFile(path.join(OUTPUT_DIR, `latency-${i}.jpg`));
    latencyResults.push(Date.now() - start);
  }
  const avgLatency = latencyResults.reduce((a, b) => a + b, 0) / latencyResults.length;
  console.log(`   Average Latency: ${avgLatency.toFixed(2)}ms\n`);

  // 2. Sequential vs Parallel Processing
  console.log('2. Sequential vs Parallel Processing (10 operations)');
  const batchImages = Array(10).fill(sampleImage);

  // Sequential
  console.log('   Running sequentially...');
  const seqStart = Date.now();
  for (let i = 0; i < batchImages.length; i++) {
    await imageMagick(batchImages[i])
      .resize(400)
      .grayscale()
      .toFile(path.join(OUTPUT_DIR, `seq-${i}.jpg`));
  }
  const seqDuration = Date.now() - seqStart;
  console.log(
    `   Sequential total: ${seqDuration}ms (${(seqDuration / 10).toFixed(2)}ms per image)`
  );

  // Parallel (Managed by processBatch)
  console.log('\n   Running in parallel (concurrency: 4)...');
  const parStart = Date.now();
  await processBatch(
    batchImages,
    (file) => {
      const baseName = path.basename(file, path.extname(file));
      const out = path.join(OUTPUT_DIR, `par-${baseName}-${Math.random()}.jpg`);
      return ['convert', file, '-resize', '400', '-colorspace', 'Gray', out];
    },
    { parallel: 4 }
  );
  const parDuration = Date.now() - parStart;
  console.log(`   Parallel total: ${parDuration}ms (${(parDuration / 10).toFixed(2)}ms per image)`);
  console.log(`   Speedup: ${(seqDuration / parDuration).toFixed(2)}x\n`);

  // 3. Operation Complexity Impact
  console.log('3. Operation Complexity Impact');

  const ops: Array<{ name: string; fn: (im: ReturnType<typeof imageMagick>) => any }> = [
    { name: 'Resize only', fn: (im) => im.resize(800) },
    {
      name: 'Resize + Quality',
      fn: (im) => im.resize(800).quality(85),
    },
    { name: 'Resize + Blur', fn: (im) => im.resize(800).blur(5) },
    {
      name: 'Resize + Oil Paint',
      fn: (im) => im.resize(800).oilPaint(3),
    },
    {
      name: 'Complex Pipeline',
      fn: (im) => im.resize(800).grayscale().blur(2).sharpen(1).border(10),
    },
  ];

  for (const op of ops) {
    const start = Date.now();
    await op
      .fn(imageMagick(sampleImage))
      .toFile(path.join(OUTPUT_DIR, `complex-${op.name.replace(/ /g, '-')}.jpg`));
    console.log(`   ${op.name.padEnd(20)}: ${Date.now() - start}ms`);
  }

  console.log('\n------------------------------------------------------------');
  console.log('Benchmarks completed!');
}

runBenchmarks().catch(console.error);
