/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  getMimeType,
  isLossyFormat,
  supportsTransparency,
  supportsAnimation,
  getFormatFromExtension,
  getExtensionForFormat,
  getRecommendedQuality,
  normalizeGeometry,
  parseGeometry,
  formatFileSize,
  parseFileSize,
  calculateAspectRatio,
  maintainAspectRatio,
} from '../src/utils/formats';

describe('Format Utilities', () => {
  describe('getMimeType', () => {
    it('should return correct MIME types', () => {
      expect(getMimeType('jpg')).toBe('image/jpeg');
      expect(getMimeType('jpeg')).toBe('image/jpeg');
      expect(getMimeType('png')).toBe('image/png');
      expect(getMimeType('gif')).toBe('image/gif');
      expect(getMimeType('webp')).toBe('image/webp');
      expect(getMimeType('pdf')).toBe('application/pdf');
    });

    it('should be case insensitive', () => {
      expect(getMimeType('JPG')).toBe('image/jpeg');
      expect(getMimeType('PNG')).toBe('image/png');
    });

    it('should return undefined for unknown formats', () => {
      expect(getMimeType('xyz')).toBeUndefined();
    });
  });

  describe('isLossyFormat', () => {
    it('should identify lossy formats', () => {
      expect(isLossyFormat('jpg')).toBe(true);
      expect(isLossyFormat('jpeg')).toBe(true);
      expect(isLossyFormat('webp')).toBe(true);
      expect(isLossyFormat('avif')).toBe(true);
    });

    it('should identify non-lossy formats', () => {
      expect(isLossyFormat('png')).toBe(false);
      expect(isLossyFormat('gif')).toBe(false);
      expect(isLossyFormat('bmp')).toBe(false);
    });
  });

  describe('supportsTransparency', () => {
    it('should identify formats with transparency support', () => {
      expect(supportsTransparency('png')).toBe(true);
      expect(supportsTransparency('gif')).toBe(true);
      expect(supportsTransparency('webp')).toBe(true);
    });

    it('should identify formats without transparency', () => {
      expect(supportsTransparency('jpg')).toBe(false);
      expect(supportsTransparency('bmp')).toBe(false);
    });
  });

  describe('supportsAnimation', () => {
    it('should identify animated formats', () => {
      expect(supportsAnimation('gif')).toBe(true);
      expect(supportsAnimation('webp')).toBe(true);
      expect(supportsAnimation('avif')).toBe(true);
    });

    it('should identify static formats', () => {
      expect(supportsAnimation('jpg')).toBe(false);
      expect(supportsAnimation('bmp')).toBe(false);
    });
  });

  describe('getFormatFromExtension', () => {
    it('should extract format from path', () => {
      expect(getFormatFromExtension('image.jpg')).toBe('jpg');
      expect(getFormatFromExtension('/path/to/image.png')).toBe('png');
      expect(getFormatFromExtension('file.WEBP')).toBe('webp');
    });
  });

  describe('getExtensionForFormat', () => {
    it('should return correct extensions', () => {
      expect(getExtensionForFormat('jpeg')).toBe('jpg');
      expect(getExtensionForFormat('tiff')).toBe('tif');
      expect(getExtensionForFormat('png')).toBe('png');
    });
  });

  describe('getRecommendedQuality', () => {
    it('should return format-specific quality', () => {
      expect(getRecommendedQuality('jpg')).toBe(85);
      expect(getRecommendedQuality('webp')).toBe(82);
      expect(getRecommendedQuality('avif')).toBe(65);
      expect(getRecommendedQuality('png')).toBe(100);
    });
  });
});

describe('Geometry Utilities', () => {
  describe('normalizeGeometry', () => {
    it('should create geometry strings', () => {
      expect(normalizeGeometry(800, 600)).toBe('800x600');
      expect(normalizeGeometry(800)).toBe('800');
      expect(normalizeGeometry(undefined, 600)).toBe('x600');
      expect(normalizeGeometry(800, 600, 10, 20)).toBe('800x600+10+20');
      expect(normalizeGeometry(800, 600, -10, -20)).toBe('800x600-10-20');
    });
  });

  describe('parseGeometry', () => {
    it('should parse geometry strings', () => {
      expect(parseGeometry('800x600')).toEqual({ width: 800, height: 600 });
      expect(parseGeometry('800')).toEqual({ width: 800 });
      expect(parseGeometry('800x600+10+20')).toEqual({
        width: 800,
        height: 600,
        x: 10,
        y: 20,
      });
    });
  });
});

describe('File Size Utilities', () => {
  describe('formatFileSize', () => {
    it('should format bytes to human readable', () => {
      expect(formatFileSize(512)).toBe('512.00 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
    });
  });

  describe('parseFileSize', () => {
    it('should parse size strings to bytes', () => {
      expect(parseFileSize('512B')).toBe(512);
      expect(parseFileSize('1KB')).toBe(1024);
      expect(parseFileSize('1MB')).toBe(1048576);
      expect(parseFileSize('1 GB')).toBe(1073741824);
    });
  });
});

describe('Aspect Ratio Utilities', () => {
  describe('calculateAspectRatio', () => {
    it('should calculate correct ratios', () => {
      expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
      expect(calculateAspectRatio(1000, 1000)).toBe(1);
      expect(calculateAspectRatio(800, 600)).toBeCloseTo(4 / 3);
    });
  });

  describe('maintainAspectRatio', () => {
    it('should calculate dimensions maintaining ratio', () => {
      // Scale down by width
      expect(maintainAspectRatio(1920, 1080, 960)).toEqual({
        width: 960,
        height: 540,
      });

      // Scale down by height
      expect(maintainAspectRatio(1920, 1080, undefined, 540)).toEqual({
        width: 960,
        height: 540,
      });

      // Fit within constraints
      expect(maintainAspectRatio(1920, 1080, 800, 600)).toEqual({
        width: 800,
        height: 450,
      });
    });

    it('should return original dimensions if no target', () => {
      expect(maintainAspectRatio(1920, 1080)).toEqual({
        width: 1920,
        height: 1080,
      });
    });
  });
});
