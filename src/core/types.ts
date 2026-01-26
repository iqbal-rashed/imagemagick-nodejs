/**
 * ImageMagick Node.js Wrapper - Type Definitions
 *
 * Comprehensive TypeScript types for all ImageMagick options and operations.
 */

// ============================================================================
// Core Types
// ============================================================================

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecuteOptions {
  /** Working directory for command execution */
  cwd?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Custom environment variables */
  env?: Record<string, string>;
  /** Enable verbose logging */
  verbose?: boolean;
}

export interface ImageMagickConfig {
  /** Path to the ImageMagick binary (magick or convert) */
  binaryPath?: string;
  /** Default timeout for operations in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

// ============================================================================
// Geometry Types
// ============================================================================

export interface Geometry {
  width?: number;
  height?: number;
  xOffset?: number;
  yOffset?: number;
  /** Resize flags: !, <, >, ^, %, @ */
  flag?: GeometryFlag;
}

export type GeometryFlag =
  | '!' // Ignore aspect ratio
  | '<' // Only shrink larger
  | '>' // Only enlarge smaller
  | '^' // Minimum dimensions
  | '%' // Percentage
  | '@'; // Pixel count limit

export type GravityType =
  | 'NorthWest'
  | 'North'
  | 'NorthEast'
  | 'West'
  | 'Center'
  | 'East'
  | 'SouthWest'
  | 'South'
  | 'SouthEast';

// ============================================================================
// Color Types
// ============================================================================

export type ColorspaceType =
  | 'RGB'
  | 'sRGB'
  | 'GRAY'
  | 'CMYK'
  | 'HSL'
  | 'HSB'
  | 'LAB'
  | 'XYZ'
  | 'YCbCr'
  | 'YUV'
  | 'Transparent';

export interface ModulateOptions {
  brightness?: number;
  saturation?: number;
  hue?: number;
}

export interface LevelOptions {
  blackPoint?: number | string;
  whitePoint?: number | string;
  gamma?: number;
}

// ============================================================================
// Filter & Effect Types
// ============================================================================

export type FilterType =
  | 'Point'
  | 'Box'
  | 'Triangle'
  | 'Hermite'
  | 'Hanning'
  | 'Hamming'
  | 'Blackman'
  | 'Gaussian'
  | 'Quadratic'
  | 'Cubic'
  | 'Catrom'
  | 'Mitchell'
  | 'Lanczos'
  | 'Bessel'
  | 'Sinc';

export interface BlurOptions {
  radius?: number;
  sigma: number;
}

export interface SharpenOptions {
  radius?: number;
  sigma: number;
}

export interface UnsharpMaskOptions {
  radius: number;
  sigma: number;
  amount: number;
  threshold: number;
}

export interface ShadowOptions {
  opacity: number;
  sigma: number;
  xOffset?: number;
  yOffset?: number;
}

// ============================================================================
// Drawing Types
// ============================================================================

export interface FontOptions {
  font?: string;
  pointsize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  gravity?: GravityType;
}

export interface AnnotateOptions extends FontOptions {
  text: string;
  geometry?: string;
  angle?: number;
}

export interface DrawCommand {
  primitive:
    | 'point'
    | 'line'
    | 'rectangle'
    | 'roundRectangle'
    | 'arc'
    | 'ellipse'
    | 'circle'
    | 'polyline'
    | 'polygon'
    | 'bezier'
    | 'path'
    | 'image'
    | 'text';
  coordinates: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

// ============================================================================
// Composite Types
// ============================================================================

export type CompositeOperator =
  | 'Over'
  | 'In'
  | 'Out'
  | 'Atop'
  | 'Xor'
  | 'Plus'
  | 'Minus'
  | 'Add'
  | 'Subtract'
  | 'Difference'
  | 'Divide'
  | 'Multiply'
  | 'Bumpmap'
  | 'Copy'
  | 'CopyRed'
  | 'CopyGreen'
  | 'CopyBlue'
  | 'CopyOpacity'
  | 'CopyCyan'
  | 'CopyMagenta'
  | 'CopyYellow'
  | 'CopyBlack'
  | 'Blend'
  | 'Dissolve'
  | 'Displace'
  | 'Distort'
  | 'Modulate'
  | 'Illuminate'
  | 'HardLight'
  | 'SoftLight'
  | 'ColorBurn'
  | 'ColorDodge'
  | 'Screen'
  | 'Overlay'
  | 'Darken'
  | 'Lighten'
  | 'LinearDodge'
  | 'LinearBurn'
  | 'LinearLight'
  | 'VividLight'
  | 'PinLight'
  | 'HardMix';

export interface CompositeOptions {
  compose?: CompositeOperator;
  geometry?: string;
  gravity?: GravityType;
  blend?: number | string;
  dissolve?: number;
  tile?: boolean;
}

// ============================================================================
// Image Information Types
// ============================================================================

export interface ImageInfo {
  format: string;
  width: number;
  height: number;
  depth: number;
  colorspace: string;
  filesize: string;
  compression?: string;
  quality?: number;
  density?: { x: number; y: number; units: string };
  geometry?: string;
  units?: string;
  type?: string;
  endianness?: string;
  colorType?: string;
  mime?: string;
  class?: string;
  properties?: Record<string, string>;
}

// ============================================================================
// Operation Options
// ============================================================================

export interface ResizeOptions {
  width?: number;
  height?: number;
  /** Resize geometry string (e.g., "800x600>") */
  geometry?: string;
  filter?: FilterType;
  /** Keep aspect ratio (default: true) */
  keepAspectRatio?: boolean;
  /** Only shrink if larger than target */
  onlyShrinkLarger?: boolean;
  /** Only enlarge if smaller than target */
  onlyEnlargeSmaller?: boolean;
}

export interface CropOptions {
  width: number;
  height: number;
  x?: number;
  y?: number;
  gravity?: GravityType;
  /** Repage after crop to reset virtual canvas */
  repage?: boolean;
}

export interface RotateOptions {
  degrees: number;
  background?: string;
}

export interface BorderOptions {
  width: number;
  height?: number;
  color?: string;
}

export interface ExtentOptions {
  width: number;
  height: number;
  gravity?: GravityType;
  background?: string;
}

export interface TrimOptions {
  fuzz?: number | string;
}

// ============================================================================
// Format & Quality Options
// ============================================================================

export type ImageFormat =
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'avif'
  | 'heic'
  | 'tiff'
  | 'tif'
  | 'bmp'
  | 'ico'
  | 'pdf'
  | 'svg'
  | 'psd'
  | 'raw'
  | 'eps'
  | 'dng'
  | 'cr2'
  | 'nef';

export interface OutputOptions {
  format?: ImageFormat | string;
  quality?: number;
  /** Strip metadata */
  strip?: boolean;
  /** Interlace method */
  interlace?: 'None' | 'Line' | 'Plane' | 'Partition' | 'JPEG' | 'GIF' | 'PNG';
  /** Compression type */
  compress?:
    | 'None'
    | 'BZip'
    | 'Fax'
    | 'Group4'
    | 'JPEG'
    | 'JPEG2000'
    | 'Lossless'
    | 'LZW'
    | 'RLE'
    | 'Zip'
    | 'WebP'
    | 'DWAA'
    | 'DWAB';
  /** Define format-specific options */
  define?: Record<string, string>;
}

// ============================================================================
// Montage Options
// ============================================================================

export interface MontageOptions {
  /** Tile geometry (e.g., "3x3") */
  tile?: string;
  /** Geometry of each tile */
  geometry?: string;
  /** Background color */
  background?: string;
  /** Border width */
  borderWidth?: number;
  /** Border color */
  borderColor?: string;
  /** Shadow */
  shadow?: boolean;
  /** Frame */
  frame?: string;
  /** Title */
  title?: string;
  /** Label */
  label?: string;
  /** Gravity */
  gravity?: GravityType;
  /** Font */
  font?: string;
  /** Point size */
  pointsize?: number;
}

// ============================================================================
// Compare Options
// ============================================================================

export interface CompareOptions {
  /** Comparison metric */
  metric?:
    | 'AE'
    | 'DSSIM'
    | 'Fuzz'
    | 'MAE'
    | 'MEPP'
    | 'MSE'
    | 'NCC'
    | 'PAE'
    | 'PHASH'
    | 'PSNR'
    | 'RMSE'
    | 'SSIM';
  /** Highlight color for differences */
  highlightColor?: string;
  /** Lowlight color for similar areas */
  lowlightColor?: string;
  /** Fuzz factor for comparison */
  fuzz?: number | string;
}

export interface CompareResult {
  /** The difference value based on the metric used */
  difference: number;
  /** Whether the images are identical (difference is 0 or within threshold) */
  identical: boolean;
  /** Raw output from compare command */
  raw: string;
}

// ============================================================================
// Animation Options
// ============================================================================

export interface AnimationOptions {
  /** Delay between frames in hundredths of second */
  delay?: number;
  /** Loop count (0 = infinite) */
  loop?: number;
  /** Dispose method */
  dispose?: 'Undefined' | 'None' | 'Background' | 'Previous';
}

// ============================================================================
// Stream Options
// ============================================================================

export interface StreamOptions {
  /** Map string for pixel extraction */
  map?: string;
  /** Storage type */
  storageType?: 'char' | 'double' | 'float' | 'integer' | 'long' | 'quantum' | 'short';
}

// ============================================================================
// Mogrify Options
// ============================================================================

export interface MogrifyOptions extends OutputOptions {
  /** Output directory for processed files */
  path?: string;
  /** Output format to convert to */
  outputFormat?: ImageFormat | string;
}

// ============================================================================
// Import (Screen Capture) Options
// ============================================================================

export interface ImportOptions {
  /** Capture the entire screen */
  screen?: boolean;
  /** Capture a specific window by ID */
  window?: string;
  /** Capture root window */
  root?: boolean;
  /** Delay before capture in seconds */
  pause?: number;
  /** Frame the captured window */
  frame?: boolean;
  /** Include window border */
  border?: boolean;
  /** Silent mode */
  silent?: boolean;
  /** Crop region */
  crop?: string;
}

// ============================================================================
// Display Options
// ============================================================================

export interface DisplayOptions {
  /** Window title */
  title?: string;
  /** Geometry for window */
  geometry?: string;
  /** Immutable display */
  immutable?: boolean;
  /** Update display when image file changes */
  update?: boolean;
  /** Delay between images in slideshow mode */
  delay?: number;
}
