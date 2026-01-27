/**
 * ImageMagick Binary Installer
 *
 * Downloads pre-built ImageMagick binaries from GitHub releases during npm install.
 * Detects platform, architecture, and libc type to download the correct binary.
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as tar from 'tar';
import { VENDOR_DIR, BIN_DIR } from '../utils/paths';

// Configuration
const GITHUB_REPO = 'iqbal-rashed/imagemagick-nodejs';
const RELEASE_TAG = 'bin-main';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface ReleaseInfo {
  assets: ReleaseAsset[];
}

/**
 * Detect if running on musl libc (Alpine, etc.)
 */
function isMusl(): boolean {
  if (process.platform !== 'linux') return false;

  try {
    // Check if ldd reports musl
    const lddOutput = execSync('ldd --version 2>&1 || true', { encoding: 'utf8' });
    if (lddOutput.toLowerCase().includes('musl')) return true;

    // Check for Alpine
    if (fs.existsSync('/etc/alpine-release')) return true;

    // Check libc.musl-* files
    const libDir = fs.readdirSync('/lib').filter((f) => f.startsWith('libc.musl'));
    if (libDir.length > 0) return true;
  } catch {
    // Fallback: assume glibc
  }

  return false;
}

/**
 * Get the platform identifier for download
 */
function getPlatformId(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32') {
    if (arch === 'x64') return 'windows-x64';
    if (arch === 'ia32') return 'windows-x86';
    throw new Error(`Unsupported Windows architecture: ${arch}`);
  }

  if (platform === 'darwin') {
    if (arch === 'arm64') return 'macos-arm64';
    if (arch === 'x64') return 'macos-x64';
    throw new Error(`Unsupported macOS architecture: ${arch}`);
  }

  if (platform === 'linux') {
    const libc = isMusl() ? 'musl' : 'glibc';
    if (arch === 'x64') return `linux-${libc}-amd64`;
    if (arch === 'arm64') return `linux-${libc}-arm64`;
    throw new Error(`Unsupported Linux architecture: ${arch}`);
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * Allowed domains for redirects (GitHub domains)
 */
const ALLOWED_REDIRECT_DOMAINS = [
  'github.com',
  'api.github.com',
  'objects.githubusercontent.com',
  'codeload.github.com',
  'raw.githubusercontent.com',
  'release-assets.githubusercontent.com',
];

/**
 * Validate that a URL is from an allowed domain
 */
function validateRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check if hostname ends with one of the allowed domains
    return ALLOWED_REDIRECT_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Fetch JSON from URL with redirect handling
 */
function fetchJson(url: string): Promise<ReleaseInfo> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const headers: Record<string, string> = {
      'User-Agent': 'imagemagick-nodejs',
      Accept: 'application/vnd.github.v3+json',
    };

    // Use GITHUB_TOKEN if available (avoids rate limiting in CI)
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers,
    };

    https
      .get(options, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location;
          if (location) {
            // Validate redirect URL to prevent redirect attacks
            if (!validateRedirectUrl(location)) {
              reject(new Error(`Redirect to disallowed domain: ${location}`));
              return;
            }
            fetchJson(location).then(resolve).catch(reject);
          } else {
            reject(new Error('Redirect without location header'));
          }
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch release: ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk.toString()));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as ReleaseInfo);
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e}`));
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Download a file from URL with redirect handling
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const request = (downloadUrl: string): void => {
      https
        .get(downloadUrl, (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            const location = res.headers.location;
            if (location) {
              // Validate redirect URL to prevent redirect attacks
              if (!validateRedirectUrl(location)) {
                reject(new Error(`Redirect to disallowed domain: ${location}`));
                return;
              }
              request(location);
            } else {
              reject(new Error('Redirect without location header'));
            }
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`Download failed: ${res.statusCode}`));
            return;
          }

          const totalSize = parseInt(res.headers['content-length'] ?? '0', 10);
          let downloadedSize = 0;

          res.on('data', (chunk: Buffer) => {
            downloadedSize += chunk.length;
            if (totalSize > 0) {
              const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
              process.stdout.write(`\r  Downloading: ${percent}%`);
            }
          });

          res.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(' Done!');
            resolve();
          });
        })
        .on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
    };

    request(url);
  });
}

/**
 * Extract tar.gz archive
 */
async function extractTarGz(tarPath: string, destDir: string): Promise<void> {
  // Extract with strip:1 to remove the top-level bundle directory
  // All platforms now have consistent structure with bin/ subdirectory
  await tar.extract({
    file: tarPath,
    cwd: destDir,
    strip: 1,
  });

  console.log(`  Extracted to ${destDir}`);
}

/**
 * Make binary executable on Unix
 */
function makeExecutable(binaryPath: string): void {
  if (process.platform === 'win32') return;

  try {
    fs.chmodSync(binaryPath, 0o755);
  } catch (err) {
    console.warn(`Warning: Could not make binary executable: ${err}`);
  }
}

/**
 * Main installation function
 */
async function install(): Promise<void> {
  console.log('[imagemagick-nodejs] Installing ImageMagick binary...');

  // Skip if IMAGEMAGICK_SKIP_DOWNLOAD is set
  if (process.env['IMAGEMAGICK_SKIP_DOWNLOAD']) {
    console.log('  Skipping download (IMAGEMAGICK_SKIP_DOWNLOAD is set)');
    return;
  }

  // Skip if binary already exists
  const binaryName = process.platform === 'win32' ? 'magick.exe' : 'magick';
  const binaryPath = path.join(BIN_DIR, binaryName);

  if (fs.existsSync(binaryPath)) {
    console.log('  Binary already exists, skipping download');
    return;
  }

  try {
    const platformId = getPlatformId();
    console.log(`  Platform: ${platformId}`);

    // Fetch release info
    console.log('  Fetching release info...');
    const releaseUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${RELEASE_TAG}`;
    const release = await fetchJson(releaseUrl);

    // Find matching asset
    const assetPattern = new RegExp(`imagemagick-.*-${platformId}\\.tar\\.gz$`);
    const asset = release.assets.find((a) => assetPattern.test(a.name));

    if (!asset) {
      console.error(`  ERROR: No binary available for ${platformId}`);
      console.error('  Available assets:', release.assets.map((a) => a.name).join(', '));
      console.error('  You may need to install ImageMagick manually.');
      process.exit(0); // Don't fail the install, just warn
    }

    console.log(`  Found asset: ${asset.name}`);

    // Create vendor directory
    fs.mkdirSync(BIN_DIR, { recursive: true });

    // Download tarball to package root (we'll extract there to get the bin/ structure)
    const tarPath = path.join(VENDOR_DIR, asset.name);
    await downloadFile(asset.browser_download_url, tarPath);

    // Extract to package root (tar.gz contains bundle/bin/*, after strip:1 we get bin/*)
    console.log('  Extracting...');
    await extractTarGz(tarPath, VENDOR_DIR);

    // Cleanup tarball
    fs.unlinkSync(tarPath);

    // Make binary executable
    makeExecutable(binaryPath);

    // Verify installation
    if (fs.existsSync(binaryPath)) {
      console.log(`  ✓ ImageMagick installed to ${BIN_DIR}`);
    } else {
      throw new Error('Binary not found after extraction');
    }
  } catch (err) {
    console.error(`  ERROR: ${err}`);
    console.error('  ImageMagick binary download failed.');
    console.error('  The package will still work if ImageMagick is installed on your system.');
    // Don't fail the install - user might have ImageMagick installed globally
    process.exit(0);
  }
}

// Run installation
install()
  .catch((err) => {
    console.error('Installation failed:', err);
  })
  .finally(() => process.exit(0));
