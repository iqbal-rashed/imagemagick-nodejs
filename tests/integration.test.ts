/**
 * Integration Tests
 *
 * End-to-end tests that verify the complete functionality
 * of the ImageMagick wrapper.
 *
 * Note: These tests require ImageMagick to be installed.
 * They will be skipped if ImageMagick is not available.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  imageMagick,
  identify,
  isAvailable,
  getVersion,
  convert,
  composite,
  findImages,
  processBatch,
  batchResizeFiles,
  batchConvertFiles,
  batchOptimizeFiles,
  type BatchProgress,
} from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

const testDir = path.join(__dirname, '../test-output');
const sampleDir = path.join(__dirname, '../samples');

let sampleImage: string;
let isIMAvailable: boolean = false;

beforeAll(async () => {
  // Check if ImageMagick is available
  isIMAvailable = await isAvailable();

  if (!isIMAvailable) {
    return;
  }

  // Create test output directory
  await fs.promises.mkdir(testDir, { recursive: true });

  // Find a sample image
  const images = await findImages(sampleDir, { recursive: false });
  sampleImage = images.length > 0 ? images[0]! : '';
});

const itIfAvailable = (name: string, fn: () => Promise<void> | void) => {
  it(name, async () => {
    if (!isIMAvailable) {
      console.warn(`Skipping "${name}": ImageMagick not available`);
      return;
    }
    await fn();
  });
};

describe('Integration Tests', () => {
  describe('Basic Operations', () => {
    itIfAvailable('should get version information', async () => {
      const version = await getVersion();
      expect(version).toBeDefined();
      expect(version.version).toMatch(/\d+\.\d+\.\d+/);
      expect(version.major).toBeGreaterThan(0);
    });

    itIfAvailable('should identify image information', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const info = await identify(sampleImage);
      expect(info).toBeDefined();
      expect(info.width).toBeGreaterThan(0);
      expect(info.height).toBeGreaterThan(0);
      expect(info.format).toBeDefined();
    });

    itIfAvailable('should resize an image', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const outputPath = path.join(testDir, 'resize-test.jpg');
      await imageMagick(sampleImage).resize(400).toFile(outputPath);

      const exists = await fs.promises
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      // Verify the new dimensions
      const info = await identify(outputPath);
      expect(info.width).toBe(400);
    });

    itIfAvailable('should apply multiple operations', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const outputPath = path.join(testDir, 'multi-op-test.jpg');
      await imageMagick(sampleImage).resize(400).quality(85).grayscale().toFile(outputPath);

      const exists = await fs.promises
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Fluent API', () => {
    it('should chain multiple operations', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const outputPath = path.join(testDir, 'chained-test.jpg');
      await imageMagick(sampleImage).resize(300).blur(2).sharpen(1).quality(80).toFile(outputPath);

      const exists = await fs.promises
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create thumbnail', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const outputPath = path.join(testDir, 'thumbnail-test.jpg');
      await imageMagick(sampleImage)
        .thumbnail(150, 150)
        .extent(150, 150, 'Center', 'white')
        .toFile(outputPath);

      const info = await identify(outputPath);
      expect(info.width).toBe(150);
      expect(info.height).toBe(150);
    });

    it('should apply filters', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const filters = [
        { name: 'blur', fn: (im: ReturnType<typeof imageMagick>) => im.blur(5) },
        { name: 'sharpen', fn: (im: ReturnType<typeof imageMagick>) => im.sharpen(2) },
        { name: 'grayscale', fn: (im: ReturnType<typeof imageMagick>) => im.grayscale() },
      ];

      for (const filter of filters) {
        const outputPath = path.join(testDir, `filter-${filter.name}.jpg`);
        await filter.fn(imageMagick(sampleImage).resize(300)).toFile(outputPath);

        const exists = await fs.promises
          .access(outputPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      }
    }, 15000);
  });

  describe('Batch Processing', () => {
    it('should find images in directory', async () => {
      const images = await findImages(sampleDir, { recursive: false });
      expect(Array.isArray(images)).toBe(true);
    });

    it('should process batch with progress tracking', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const progressUpdates: BatchProgress[] = [];
      const images = [sampleImage];

      const result = await processBatch(
        images,
        (file) => {
          const baseName = path.basename(file, path.extname(file));
          return ['convert', file, '-resize', '200', path.join(testDir, `${baseName}-batch.jpg`)];
        },
        {
          onProgress: (progress) => {
            progressUpdates.push(progress);
          },
        }
      );

      expect(result.success.length).toBeGreaterThan(0);
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it('should batch resize images', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const outputDir = path.join(testDir, 'batch-resize');
      await fs.promises.mkdir(outputDir, { recursive: true });

      const images = [sampleImage];
      const result = await batchResizeFiles(images, outputDir, { width: 250 });

      expect(result.success.length).toBeGreaterThan(0);
    });

    it('should batch convert formats', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const outputDir = path.join(testDir, 'batch-convert');
      await fs.promises.mkdir(outputDir, { recursive: true });

      const images = [sampleImage];
      const result = await batchConvertFiles(images, outputDir, 'png', { quality: 90 });

      expect(result.success.length).toBeGreaterThan(0);
    }, 15000);

    it('should batch optimize images', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const outputDir = path.join(testDir, 'batch-optimize');
      await fs.promises.mkdir(outputDir, { recursive: true });

      const images = [sampleImage];
      const result = await batchOptimizeFiles(images, outputDir, { quality: 85 });

      expect(result.success.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Command Builders', () => {
    it('should build convert command', () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const args = convert(sampleImage)
        .resize(400)
        .quality(85)
        .output(path.join(testDir, 'convert-test.jpg'))
        .build();

      expect(args).toContain('convert');
      expect(args).toContain('-resize');
      expect(args).toContain('-quality');
    });

    it('should build composite command', () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const overlayPath = path.join(testDir, 'overlay.png');
      const args = composite(overlayPath, sampleImage)
        .gravity('SouthEast')
        .dissolve(50)
        .output(path.join(testDir, 'composite-test.jpg'))
        .build();

      expect(args).toContain('composite');
      expect(args).toContain('-gravity');
      expect(args).toContain('-dissolve');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input file gracefully', async () => {
      const invalidPath = '/nonexistent/path/to/image.jpg';

      await expect(imageMagick(invalidPath).resize(400).toFile('/tmp/test.jpg')).rejects.toThrow();
    });

    it('should handle invalid operations gracefully', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      // This should handle invalid operations gracefully
      // Use a completely invalid flag that ImageMagick will reject
      await expect(
        imageMagick(sampleImage).raw('-invalid-operation-xyz').toFile('/tmp/test.jpg')
      ).rejects.toThrow();
    });
  });

  describe('Output Formats', () => {
    it('should convert to different formats', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const formats = ['png', 'webp', 'gif'];

      for (const format of formats) {
        const outputPath = path.join(testDir, `convert-${format}.${format}`);
        await imageMagick(sampleImage).resize(200).toFile(outputPath);

        const exists = await fs.promises
          .access(outputPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      }
    }, 15000);
  });

  describe('Performance', () => {
    it('should process image in reasonable time', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const start = Date.now();
      const outputPath = path.join(testDir, 'perf-test.jpg');
      await imageMagick(sampleImage).resize(400).quality(85).toFile(outputPath);
      const duration = Date.now() - start;

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle common image processing workflow', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      // Typical web image optimization workflow
      const outputPath = path.join(testDir, 'workflow-web.jpg');
      await imageMagick(sampleImage)
        .resize(1200) // Max width for web
        .quality(85) // Good quality/size balance
        .strip() // Remove metadata for privacy
        .interlace('Plane') // Progressive loading
        .toFile(outputPath);

      const exists = await fs.promises
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create thumbnail with padding', async () => {
      if (!sampleImage) {
        console.warn('Skipping: No sample image found');
        return;
      }

      const outputPath = path.join(testDir, 'workflow-thumb.jpg');
      await imageMagick(sampleImage)
        .thumbnail(200, 200)
        .extent(200, 200, 'Center', 'white')
        .quality(80)
        .toFile(outputPath);

      const info = await identify(outputPath);
      expect(info.width).toBe(200);
      expect(info.height).toBe(200);
    });
  });
});
