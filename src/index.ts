/**
 * ImageMagick Node.js Wrapper
 *
 * A comprehensive Node.js wrapper for the ImageMagick CLI.
 *
 * @packageDocumentation
 */

// ============================================================================
// Core Exports
// ============================================================================

export * from './core/types';
export * from './core/binary';
export {
  execute,
  executeStream,
  executeSubcommand,
  executeBatch,
  executeSequential,
  type StreamResult,
} from './core/executor';

// Re-export logger configuration
export { configureLogger, resetLogger, LogLevel } from './utils/logger';

// ============================================================================
// Error Exports
// ============================================================================

export {
  ImageMagickError,
  BinaryNotFoundError,
  ExecutionError,
  TimeoutError,
  InputError,
  OutputError,
  UnsupportedFormatError,
  ParseError,
} from './utils/errors';

// ============================================================================
// Command Exports
// ============================================================================

// Convert
export {
  convert,
  ConvertArgs,
  runConvert,
  runConvertStream,
  convertImage,
} from './commands/convert';

// Identify
export {
  identify,
  identifyVerbose,
  getFormat,
  getDimensions,
  getColorspace,
  getDepth,
  getQuality,
  getFilesize,
  getColorCount,
  getHistogram,
  isValid,
  getFrameCount,
  getExif,
} from './commands/identify';

// Mogrify
export {
  mogrify,
  MogrifyArgs,
  runMogrify,
  batchResize,
  batchConvert,
  batchStrip,
  batchAutoOrient,
  batchOptimize,
} from './commands/mogrify';

// Composite
export {
  composite,
  CompositeArgs,
  runComposite,
  overlayImage,
  addWatermark,
  blendImages,
  applyMask,
} from './commands/composite';

// Montage
export {
  montage,
  MontageArgs,
  runMontage,
  createContactSheet,
  createPolaroidMontage,
  createThumbnailGallery,
} from './commands/montage';

// Compare
export {
  compare,
  CompareArgs,
  runCompare,
  compareImages,
  areIdentical,
  getSSIM,
  getPerceptualDifference,
  createDiffImage,
  type CompareMetric,
} from './commands/compare';

// Animate
export {
  animate,
  AnimateArgs,
  runAnimate,
  createGif,
  createWebP,
  extractFrames,
  getFrameCount as getAnimationFrameCount,
  getFrameDelays,
  optimizeGif,
  changeSpeed,
  reverseAnimation,
  createBouncingAnimation,
} from './commands/animate';

// Import (Screen Capture)
export {
  importScreen,
  ImportArgs,
  runImport,
  captureScreen,
  captureWindow,
  captureRegion,
} from './commands/import';

// Display
export { display, DisplayArgs, runDisplay, showImage, slideshow } from './commands/display';

// Stream
export {
  stream,
  StreamArgs,
  runStream,
  runStreamPipe,
  extractRGB,
  extractRGBA,
  extractGrayscale,
  extractRegion,
  getPixelBuffer,
  type StorageType,
} from './commands/stream';

// ============================================================================
// High-Level API Exports
// ============================================================================

export { ImageMagick, imageMagick, im } from './api/ImageMagick';

// ============================================================================
// Utility Exports
// ============================================================================

export {
  FORMAT_MIME_TYPES,
  LOSSY_FORMATS,
  TRANSPARENT_FORMATS,
  ANIMATED_FORMATS,
  getMimeType,
  isLossyFormat,
  supportsTransparency,
  supportsAnimation,
  getFormatFromExtension,
  getExtensionForFormat,
  isFormatSupported,
  getRecommendedQuality,
  normalizeGeometry,
  parseGeometry,
  formatFileSize,
  parseFileSize,
  escapeArg,
  isImageFile,
  detectFormat,
  calculateAspectRatio,
  maintainAspectRatio,
  extractPalette,
} from './utils/formats';

export {
  processBatch,
  findImages,
  batchResize as batchResizeFiles,
  batchConvert as batchConvertFiles,
  batchOptimize as batchOptimizeFiles,
  batchWatermark,
  type ProgressCallback,
  type BatchProgress,
  type BatchOptions,
  type BatchResult,
} from './utils/batch';

export {
  sanitizeArgument,
  sanitizeArguments,
  validateFilePath,
  validateDirectoryPath,
  validateNumber,
  validateString,
} from './utils/validation';
