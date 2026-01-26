/**
 * Example: Advanced Image Operations
 *
 * Demonstrates advanced image manipulation techniques including:
 * - Color manipulation and correction
 * - Filters and effects
 * - Geometry operations
 * -Multi-step processing pipelines
 */

import { imageMagick, identify } from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

async function main(): Promise<void> {
  console.log('ImageMagick Advanced Operations Examples\n');
  console.log('='.repeat(60));

  const inputImage = process.argv[2] ?? path.join(__dirname, '../samples/nextdownloader.png');
  const outputDir = path.join(__dirname, '../outputs/advanced');

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  console.log(`Input: ${path.basename(inputImage)}`);
  console.log(`Output directory: ${path.relative(process.cwd(), outputDir)}\n`);

  // Example 1: Color manipulation
  console.log('1. Color Manipulation');
  console.log('-'.repeat(60));

  const colorOps = [
    { name: 'Enhanced Saturation', modulate: [100, 150, 100] },
    { name: 'Increased Brightness', modulate: [130, 100, 100] },
    { name: 'Warm Tone', modulate: [100, 100, 80] },
    { name: 'Cool Tone', modulate: [100, 100, 120] },
  ];

  for (const op of colorOps) {
    try {
      const outputPath = path.join(
        outputDir,
        `color-${op.name.toLowerCase().replace(/ /g, '-')}.jpg`
      );

      await imageMagick(inputImage)
        .resize(600)
        .modulate(op.modulate[0], op.modulate[1], op.modulate[2])
        .quality(90)
        .toFile(outputPath);

      console.log(`  ✓ ${op.name}`);
    } catch (error) {
      console.log(`  ✗ ${op.name} failed:`, (error as Error).message);
    }
  }

  // Example 2: Advanced filters
  console.log('\n2. Advanced Filters');
  console.log('-'.repeat(60));

  const filters = [
    { name: 'Sharpen', apply: (img: ReturnType<typeof imageMagick>) => img.sharpen(2) },
    { name: 'Strong Blur', apply: (img: ReturnType<typeof imageMagick>) => img.blur(10) },
    { name: 'Gaussian Blur', apply: (img: ReturnType<typeof imageMagick>) => img.gaussianBlur(5) },
    {
      name: 'Motion Blur',
      apply: (img: ReturnType<typeof imageMagick>) => img.motionBlur(5, 10, 45),
    },
  ];

  for (const filter of filters) {
    try {
      const filterPath = path.join(
        outputDir,
        `filter-${filter.name.toLowerCase().replace(/ /g, '-')}.jpg`
      );

      const pipeline = imageMagick(inputImage).resize(600);
      filter.apply(pipeline);
      await pipeline.quality(90).toFile(filterPath);

      console.log(`  ✓ ${filter.name}`);
    } catch (error) {
      console.log(`  ✗ ${filter.name} failed:`, (error as Error).message);
    }
  }

  // Example 3: Artistic effects
  console.log('\n3. Artistic Effects');
  console.log('-'.repeat(60));

  const effects = [
    { name: 'Oil Painting', apply: (img: ReturnType<typeof imageMagick>) => img.oilPaint(4) },
    { name: 'Charcoal', apply: (img: ReturnType<typeof imageMagick>) => img.charcoal(2) },
    { name: 'Edge Detect', apply: (img: ReturnType<typeof imageMagick>) => img.edge(1) },
    { name: 'Emboss', apply: (img: ReturnType<typeof imageMagick>) => img.emboss(1) },
    { name: 'Polaroid', apply: (img: ReturnType<typeof imageMagick>) => img.polaroid(5) },
  ];

  for (const effect of effects) {
    try {
      const effectPath = path.join(
        outputDir,
        `effect-${effect.name.toLowerCase().replace(/ /g, '-')}.jpg`
      );

      const pipeline = imageMagick(inputImage).resize(600);
      effect.apply(pipeline);
      await pipeline.quality(90).toFile(effectPath);

      console.log(`  ✓ ${effect.name}`);
    } catch (error) {
      console.log(`  ✗ ${effect.name} failed:`, (error as Error).message);
    }
  }

  // Example 4: Geometry transformations
  console.log('\n4. Geometry Transformations');
  console.log('-'.repeat(60));

  const transforms = [
    { name: 'Rotate 45°', apply: (img: ReturnType<typeof imageMagick>) => img.rotate(45) },
    { name: 'Rotate -30°', apply: (img: ReturnType<typeof imageMagick>) => img.rotate(-30) },
    { name: 'Flip Horizontal', apply: (img: ReturnType<typeof imageMagick>) => img.flop() },
    { name: 'Flip Vertical', apply: (img: ReturnType<typeof imageMagick>) => img.flip() },
    { name: 'Transpose', apply: (img: ReturnType<typeof imageMagick>) => img.transpose() },
  ];

  for (const transform of transforms) {
    try {
      const transPath = path.join(
        outputDir,
        `transform-${transform.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`
      );

      const pipeline = imageMagick(inputImage).resize(600);
      transform.apply(pipeline);
      await pipeline.quality(90).toFile(transPath);

      console.log(`  ✓ ${transform.name}`);
    } catch (error) {
      console.log(`  ✗ ${transform.name} failed:`, (error as Error).message);
    }
  }

  // Example 5: Color space operations
  console.log('\n5. Color Space Operations');
  console.log('-'.repeat(60));

  const colorSpaces = ['Gray', 'RGB', 'CMYK', 'HSB', 'HSL', 'Lab'];

  for (const colorSpace of colorSpaces) {
    try {
      const csPath = path.join(outputDir, `colorspace-${colorSpace.toLowerCase()}.jpg`);

      await imageMagick(inputImage)
        .resize(600)
        .colorspace(colorSpace as any)
        .quality(90)
        .toFile(csPath);

      console.log(`  ✓ ${colorSpace}`);
    } catch (error) {
      console.log(`  ✗ ${colorSpace} failed:`, (error as Error).message);
    }
  }

  // Example 6: Multi-step processing pipeline
  console.log('\n6. Multi-Step Processing Pipeline');
  console.log('-'.repeat(60));

  try {
    const pipelinePath = path.join(outputDir, 'pipeline-result.jpg');

    // Complex processing pipeline
    await imageMagick(inputImage)
      .resize(800)
      .sharpen(1.5)
      .modulate(110, 120, 100) // Brightness, Saturation, Hue
      .normalize() // Normalize contrast
      .quality(95)
      .toFile(pipelinePath);

    console.log('  ✓ Multi-step pipeline completed');
  } catch (error) {
    console.log('  ✗ Pipeline failed:', (error as Error).message);
  }

  // Example 7: Adaptive operations based on image properties
  console.log('\n7. Adaptive Processing');
  console.log('-'.repeat(60));

  try {
    // Get image info
    const info = await identify(inputImage);
    console.log(`  Original: ${info.width}x${info.height}, ${info.format}`);

    // Adapt processing based on image properties
    const adaptivePath = path.join(outputDir, 'adaptive.jpg');

    let pipeline = imageMagick(inputImage);

    // Resize based on original dimensions
    if (info.width > 2000) {
      pipeline = pipeline.resize(1200);
    } else if (info.width > 1000) {
      pipeline = pipeline.resize(800);
    } else {
      pipeline = pipeline.resize(Math.round(info.width * 0.8));
    }

    // Adjust quality based on format
    if (info.format.toLowerCase() === 'jpeg' || info.format.toLowerCase() === 'jpg') {
      pipeline = pipeline.quality(85);
    } else {
      pipeline = pipeline.quality(90);
    }

    // Apply sharpening based on dimensions
    if (info.width > 1000) {
      pipeline = pipeline.sharpen(1.0);
    }

    await pipeline.toFile(adaptivePath);
    console.log('  ✓ Adaptive processing completed');
  } catch (error) {
    console.log('  ✗ Adaptive processing failed:', (error as Error).message);
  }

  // Example 8: Level and gamma adjustments
  console.log('\n8. Level and Gamma Adjustments');
  console.log('-'.repeat(60));

  const levelOps = [
    { name: 'Auto Level', apply: (img: ReturnType<typeof imageMagick>) => img.autoLevel() },
    { name: 'Normalize', apply: (img: ReturnType<typeof imageMagick>) => img.normalize() },
    { name: 'Gamma 1.5', apply: (img: ReturnType<typeof imageMagick>) => img.gamma(1.5) },
    {
      name: 'Level Adjust',
      apply: (img: ReturnType<typeof imageMagick>) => img.level('10%', '90%', 1.2),
    },
  ];

  for (const op of levelOps) {
    try {
      const levelPath = path.join(
        outputDir,
        `levels-${op.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`
      );

      const pipeline = imageMagick(inputImage).resize(600);
      op.apply(pipeline);
      await pipeline.quality(90).toFile(levelPath);

      console.log(`  ✓ ${op.name}`);
    } catch (error) {
      console.log(`  ✗ ${op.name} failed:`, (error as Error).message);
    }
  }

  // Example 9: Borders and frames
  console.log('\n9. Borders and Frames');
  console.log('-'.repeat(60));

  const borderOps = [
    {
      name: 'Simple Border',
      apply: (img: ReturnType<typeof imageMagick>) => img.border(20, 20, 'white'),
    },
    {
      name: 'Colored Border',
      apply: (img: ReturnType<typeof imageMagick>) => img.border(15, 15, '#336699'),
    },
    { name: 'Shadow', apply: (img: ReturnType<typeof imageMagick>) => img.shadow(80, 3, 5, 5) },
  ];

  for (const op of borderOps) {
    try {
      const borderPath = path.join(
        outputDir,
        `border-${op.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`
      );

      const pipeline = imageMagick(inputImage).resize(600);
      op.apply(pipeline);
      await pipeline.quality(90).toFile(borderPath);

      console.log(`  ✓ ${op.name}`);
    } catch (error) {
      console.log(`  ✗ ${op.name} failed:`, (error as Error).message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Advanced operations completed!');
  console.log(`Check the ${path.relative(process.cwd(), outputDir)} directory for results`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
