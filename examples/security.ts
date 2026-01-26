/**
 * Example: Security Best Practices
 *
 * Demonstrates how to use the security features and input validation
 * to prevent command injection and path traversal attacks.
 */

import {
  imageMagick,
  validateFilePath,
  validateDirectoryPath,
  sanitizeArgument,
  sanitizeArguments,
  batchResizeFiles,
  findImages,
} from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

async function main(): Promise<void> {
  console.log('ImageMagick Security Examples\n');
  console.log('='.repeat(60));

  // Example 1: Path validation
  console.log('\n1. Path Validation (Preventing Path Traversal)');
  console.log('-'.repeat(60));

  try {
    // This should work - relative path is okay without allowedDir
    const safePath = validateFilePath('./photos/image.jpg');
    console.log('✓ Valid path:', safePath);
  } catch (error) {
    console.log('✗ Path validation failed:', (error as Error).message);
  }

  try {
    // This should fail - path traversal outside allowed directory
    const maliciousPath = validateFilePath(
      '../../../etc/passwd',
      path.resolve('/allowed/directory')
    );
    console.log('✗ Malicious path allowed:', maliciousPath);
  } catch (error) {
    console.log('✓ Path traversal blocked:', (error as Error).message);
  }

  // Example 2: Directory validation
  console.log('\n2. Directory Validation');
  console.log('-'.repeat(60));

  try {
    const validDir = validateDirectoryPath('. /output');
    console.log('✓ Valid directory:', validDir);
  } catch (error) {
    console.log('✗ Directory validation failed:', (error as Error).message);
  }

  // Example 3: Argument sanitization
  console.log('\n3. Command Argument Sanitization');
  console.log('-'.repeat(60));

  try {
    // Safe arguments
    const safeArgs = sanitizeArguments([
      'convert',
      'input.jpg',
      '-resize',
      '800x600',
      'output.jpg',
    ]);
    console.log('✓ Safe arguments sanitized:', safeArgs.join(' '));
  } catch (error) {
    console.log('✗ Argument sanitization failed:', (error as Error).message);
  }

  try {
    // Attempt command injection with semicolon
    const maliciousArgs = sanitizeArguments([
      'convert',
      'input.jpg',
      '-resize',
      '800x600; rm -rf /', // Malicious command separator
      'output.jpg',
    ]);
    console.log('✗ Malicious arguments allowed:', maliciousArgs.join(' '));
  } catch (error) {
    console.log('✓ Command injection blocked:', (error as Error).message);
  }

  try {
    // Another injection attempt with &&
    const maliciousArgs2 = sanitizeArguments([
      'convert',
      'input.jpg',
      '-resize',
      '800x600 && cat /etc/passwd', // Command chaining
      'output.jpg',
    ]);
    console.log('✗ Malicious arguments allowed:', maliciousArgs2.join(' '));
  } catch (error) {
    console.log('✓ Command chaining blocked:', (error as Error).message);
  }

  try {
    // Null byte injection
    const nullByteArgs = sanitizeArguments([
      'convert',
      'input.jpg\x00.exe',
      '-resize',
      '800',
      'output.jpg',
    ]);
    console.log('✗ Null byte allowed:', nullByteArgs.join(' '));
  } catch (error) {
    console.log('✓ Null byte blocked:', (error as Error).message);
  }

  try {
    // Pipe injection
    const pipeArgs = sanitizeArguments([
      'convert',
      'input.jpg',
      '-resize',
      '800 | cat /etc/passwd',
      'output.jpg',
    ]);
    console.log('✗ Pipe injection allowed:', pipeArgs.join(' '));
  } catch (error) {
    console.log('✓ Pipe injection blocked:', (error as Error).message);
  }

  // Example 4: Safe batch processing
  console.log('\n4. Safe Batch Processing');
  console.log('-'.repeat(60));

  const inputDir = path.join(__dirname, '../samples');
  const outputDir = path.join(__dirname, '../outputs/security');

  // Create output directory
  await fs.promises.mkdir(outputDir, { recursive: true });

  try {
    // The batch functions automatically validate paths
    const images = await findImages(inputDir, { recursive: false });

    if (images.length > 0) {
      console.log(`Processing ${images.length} images with automatic validation...`);

      // The batchResizeFiles function validates all paths automatically
      const result = await batchResizeFiles(
        images.slice(0, 3),
        outputDir,
        { width: 400 },
        { quality: 80 }
      );

      console.log(`✓ Processed ${result.success.length} images safely`);
      if (result.failed.length > 0) {
        console.log(`  Failed: ${result.failed.length}`);
      }
    } else {
      console.log('No images found for batch processing demo');
    }
  } catch (error) {
    console.log('Batch processing error:', (error as Error).message);
  }

  // Example 5: Safe image operations with fluent API
  console.log('\n5. Safe Image Operations (Automatic Sanitization)');
  console.log('-'.repeat(60));

  const inputImage = path.join(__dirname, '../samples/nextdownloader.png');
  const outputPath = path.join(__dirname, '../outputs/security/validated.jpg');

  try {
    // The imageMagick function automatically sanitizes all arguments
    await imageMagick(inputImage).resize(300).quality(85).toFile(outputPath);

    console.log('✓ Image processed safely with automatic validation');
  } catch (error) {
    console.log('✗ Image processing failed:', (error as Error).message);
  }

  // Example 6: Validating user input
  console.log('\n6. Validating User Input (Web Forms, APIs, etc.)');
  console.log('-'.repeat(60));

  function safeImageProcessing(userInput: {
    imagePath: string;
    width: number;
    quality: number;
  }): void {
    try {
      // Always validate user input
      const validatedPath = validateFilePath(userInput.imagePath);
      console.log(`✓ User input validated: ${path.basename(validatedPath)}`);

      // Validate numeric parameters
      if (userInput.width < 1 || userInput.width > 10000) {
        throw new Error('Width must be between 1 and 10000');
      }

      if (userInput.quality < 1 || userInput.quality > 100) {
        throw new Error('Quality must be between 1 and 100');
      }

      console.log('✓ All user inputs are safe to process');
    } catch (error) {
      console.log('✗ Invalid user input:', (error as Error).message);
    }
  }

  // Test with safe input
  safeImageProcessing({
    imagePath: './uploads/photo.jpg',
    width: 800,
    quality: 85,
  });

  // Test with malicious input
  safeImageProcessing({
    imagePath: '../../../etc/passwd',
    width: 800,
    quality: 85,
  });

  // Test with invalid numeric input
  safeImageProcessing({
    imagePath: './uploads/photo.jpg',
    width: 50000, // Too large
    quality: 85,
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Security Best Practices Summary:');
  console.log('-'.repeat(60));
  console.log('1. Always validate file paths with validateFilePath()');
  console.log('2. Use validateDirectoryPath() for directory inputs');
  console.log('3. The wrapper automatically sanitizes command arguments');
  console.log('4. Batch processing functions validate paths automatically');
  console.log('5. Validate all user input before processing');
  console.log('6. Never concatenate user input into command strings');
  console.log('7. Use the fluent API instead of raw commands when possible');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
