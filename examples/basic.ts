/**
 * Example: Basic Image Operations
 *
 * Demonstrates common image processing tasks using the ImageMagick wrapper.
 */

import { imageMagick, identify, getVersion } from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

async function main(): Promise<void> {
  console.log('ImageMagick Node.js Wrapper - Basic Examples\n');

  // Get version info
  try {
    const version = await getVersion();
    console.log(`Using ImageMagick ${version.version}\n`);
  } catch (error) {
    console.error('ImageMagick is not installed or not found in PATH');
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }

  // Use samples folder for input, outputs folder for output
  const inputImage = process.argv[2] ?? path.join(__dirname, '../samples/nextdownloader.png');
  const outputDir = path.join(__dirname, '../outputs');

  // Create outputs directory if it doesn't exist
  await fs.promises.mkdir(outputDir, { recursive: true });

  console.log(`Input: ${path.relative(process.cwd(), inputImage)}`);
  console.log(`Output directory: ${path.relative(process.cwd(), outputDir)}\n`);

  // Get image info
  console.log('1. Getting image information:');
  try {
    const info = await identify(inputImage);
    console.log(`   Format: ${info.format}`);
    console.log(`   Dimensions: ${info.width}x${info.height}`);
    console.log(`   Colorspace: ${info.colorspace}`);
    console.log(`   Depth: ${info.depth} bits`);
    console.log('');
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  // Example: Resize and convert
  console.log('2. Resizing to 800px width:');
  const baseName = path.basename(inputImage, path.extname(inputImage));
  const resizedPath = path.join(outputDir, `${baseName}_resized.jpg`);

  try {
    await imageMagick(inputImage).resize(800).quality(85).toFile(resizedPath);
    console.log(`   Saved: ${path.relative(process.cwd(), resizedPath)}\n`);
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  // Example: Create thumbnail
  console.log('3. Creating 200x200 thumbnail:');
  const thumbPath = path.join(outputDir, `${baseName}_thumb.jpg`);

  try {
    await imageMagick(inputImage)
      .thumbnail(200, 200)
      .extent(200, 200, 'Center', 'white')
      .quality(80)
      .toFile(thumbPath);
    console.log(`   Saved: ${path.relative(process.cwd(), thumbPath)}\n`);
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  // Example: Apply blur effect
  console.log('4. Applying blur effect:');
  const blurredPath = path.join(outputDir, `${baseName}_blurred.jpg`);

  try {
    await imageMagick(inputImage).resize(600).blur(5).toFile(blurredPath);
    console.log(`   Saved: ${path.relative(process.cwd(), blurredPath)}\n`);
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  // Example: Grayscale
  console.log('5. Converting to grayscale:');
  const grayPath = path.join(outputDir, `${baseName}_gray.jpg`);

  try {
    await imageMagick(inputImage).resize(600).grayscale().toFile(grayPath);
    console.log(`   Saved: ${path.relative(process.cwd(), grayPath)}\n`);
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  // Example: Sepia tone
  console.log('6. Applying sepia effect:');
  const sepiaPath = path.join(outputDir, `${baseName}_sepia.jpg`);

  try {
    await imageMagick(inputImage).resize(600).sepia(80).toFile(sepiaPath);
    console.log(`   Saved: ${path.relative(process.cwd(), sepiaPath)}\n`);
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  console.log('Done! All images processed successfully.');
}

function showApiExamples(): void {
  console.log(`
// Fluent API Examples:

// Basic resize
await imageMagick('input.jpg')
  .resize(800, 600)
  .quality(85)
  .toFile('output.jpg');

// Create thumbnail with padding
await imageMagick('photo.jpg')
  .thumbnail(200, 200)
  .extent(200, 200, 'Center', 'white')
  .toFile('thumbnail.jpg');

// Apply multiple effects
await imageMagick('image.png')
  .resize(1200)
  .sharpen(1.5)
  .modulate(110, 120, 100)  // brightness, saturation, hue
  .quality(90)
  .toFile('enhanced.jpg');

// Convert to grayscale with vignette
await imageMagick('portrait.jpg')
  .grayscale()
  .vignette(0, 10)
  .toFile('artistic.jpg');

// Get image info
const info = await identify('photo.jpg');
console.log(\`\${info.width}x\${info.height} \${info.format}\`);
`);
}

main().catch(console.error);
