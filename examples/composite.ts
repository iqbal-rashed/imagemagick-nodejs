/**
 * Example: Image Composition and Watermarking
 *
 * Demonstrates image compositing, watermarking, and layer operations.
 *
 * Note: Text/font operations require system fonts to be available.
 * The portable binary may not have access to fonts on all systems.
 */

import { imageMagick, overlayImage, addWatermark, blendImages } from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

// Helper to check if error is font-related
function isFontError(error: Error): boolean {
  return error.message.includes('UnableToReadFont') || error.message.includes('font');
}

async function main(): Promise<void> {
  console.log('ImageMagick Composition & Watermarking Examples\n');
  console.log('='.repeat(60));

  const inputImage = process.argv[2] ?? path.join(__dirname, '../samples/nextdownloader.png');
  const outputDir = path.join(__dirname, '../outputs/composite');

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  console.log(`Input: ${path.basename(inputImage)}`);
  console.log(`Output directory: ${path.relative(process.cwd(), outputDir)}\n`);

  // Example 1: Simple text watermark using annotate
  console.log('1. Adding Text Watermark (requires fonts)');
  console.log('-'.repeat(60));

  try {
    const textWatermarkPath = path.join(outputDir, 'watermark-text.jpg');
    await imageMagick(inputImage)
      .resize(800)
      .gravity('SouthEast')
      .fill('rgba(255,255,255,0.7)')
      .pointsize(24)
      .annotate('© 2024 Example', '+10+10')
      .quality(85)
      .toFile(textWatermarkPath);

    console.log('✓ Text watermark added\n');
  } catch (error) {
    if (isFontError(error as Error)) {
      console.log('⊘ Skipped: No fonts available (portable binary without fontconfig)\n');
    } else {
      console.log('✗ Failed:', (error as Error).message, '\n');
    }
  }

  // Example 2: Watermark with different positions
  console.log('2. Watermarks with Different Positions (requires fonts)');
  console.log('-'.repeat(60));

  const positions: Array<
    | 'NorthWest'
    | 'North'
    | 'NorthEast'
    | 'West'
    | 'Center'
    | 'East'
    | 'SouthWest'
    | 'South'
    | 'SouthEast'
  > = ['NorthWest', 'North', 'NorthEast', 'SouthWest', 'South', 'SouthEast'];

  for (const position of positions) {
    try {
      const posPath = path.join(outputDir, `watermark-${position.toLowerCase()}.jpg`);

      await imageMagick(inputImage)
        .resize(600)
        .gravity(position)
        .fill('rgba(0,0,0,0.6)')
        .pointsize(20)
        .annotate('Watermark', '+10+10')
        .quality(85)
        .toFile(posPath);

      console.log(`  ✓ ${position}`);
    } catch (error) {
      console.log(`  ✗ ${position} failed:`, (error as Error).message);
    }
  }
  console.log('');

  // Example 3: Add photo frame/border
  console.log('3. Adding Photo Frame');
  console.log('-'.repeat(60));

  try {
    const framePath = path.join(outputDir, 'framed.jpg');

    await imageMagick(inputImage)
      .resize(600)
      .border(20, 20, 'white')
      .border(2, 2, 'gray')
      .quality(90)
      .toFile(framePath);

    console.log('✓ Frame added\n');
  } catch (error) {
    console.log('✗ Failed:', (error as Error).message, '\n');
  }

  // Example 4: Adding shadow effect
  console.log('4. Adding Shadow Effect');
  console.log('-'.repeat(60));

  try {
    const shadowPath = path.join(outputDir, 'shadow.png');

    await imageMagick(inputImage)
      .resize(400)
      .background('transparent')
      .shadow(80, 3, 5, 5)
      .toFile(shadowPath);

    console.log('✓ Shadow added\n');
  } catch (error) {
    console.log('✗ Failed:', (error as Error).message, '\n');
  }

  // Example 5: Using overlayImage helper (if two images are available)
  console.log('5. Overlay Image (if multiple samples exist)');
  console.log('-'.repeat(60));

  try {
    const samplesDir = path.join(__dirname, '../samples');
    const images = await fs.promises.readdir(samplesDir);
    const imageFiles = images.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

    if (imageFiles.length >= 2) {
      const overlayPath = path.join(outputDir, 'overlay.jpg');
      const bg = path.join(samplesDir, imageFiles[0]!);
      const overlay = path.join(samplesDir, imageFiles[1]!);

      // Create a resized version of overlay first
      const resizedOverlay = path.join(outputDir, 'overlay-temp.png');
      await imageMagick(overlay).resize(200, 200).toFile(resizedOverlay);

      await overlayImage(resizedOverlay, bg, overlayPath, {
        gravity: 'NorthEast',
        opacity: 80,
      });

      console.log('✓ Image overlay created\n');
    } else {
      console.log('⊘ Skipped - need at least 2 sample images\n');
    }
  } catch (error) {
    console.log('✗ Failed:', (error as Error).message, '\n');
  }

  // Example 6: Composite using fluent API
  console.log('6. Composite Using Fluent API');
  console.log('-'.repeat(60));

  try {
    const compositePath = path.join(outputDir, 'composite-fluent.jpg');

    // Add text and then composite - demonstrating chaining
    await imageMagick(inputImage)
      .resize(600)
      .gravity('South')
      .fill('white')
      .pointsize(30)
      .annotate('Original Image', '+0+20')
      .quality(90)
      .toFile(compositePath);

    console.log('✓ Composite with chaining created\n');
  } catch (error) {
    console.log('✗ Failed:', (error as Error).message, '\n');
  }

  // Example 7: Multiple text overlays
  console.log('7. Multiple Text Overlays');
  console.log('-'.repeat(60));

  try {
    const multiTextPath = path.join(outputDir, 'multi-text.jpg');

    await imageMagick(inputImage)
      .resize(600)
      .gravity('NorthWest')
      .fill('rgba(255,255,255,0.7)')
      .pointsize(16)
      .annotate('Top Left', '+10+10')
      .gravity('SouthEast')
      .fill('rgba(255,0,0,0.8)')
      .pointsize(20)
      .annotate('Bottom Right', '+10+10')
      .quality(90)
      .toFile(multiTextPath);

    console.log('✓ Multiple text overlays added\n');
  } catch (error) {
    console.log('✗ Failed:', (error as Error).message, '\n');
  }

  console.log('='.repeat(60));
  console.log('Composition examples completed!');
  console.log(`Check the ${path.relative(process.cwd(), outputDir)} directory for results`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
