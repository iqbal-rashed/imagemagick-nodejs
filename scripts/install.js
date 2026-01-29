#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const tar = require('tar');

function findPackageRoot(startDir) {
  let current = startDir;
  while (true) {
    if (fs.existsSync(path.join(current, 'package.json'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
}

const PACKAGE_ROOT = findPackageRoot(__dirname);
const VENDOR_DIR = path.join(PACKAGE_ROOT, 'vendor');
const BIN_DIR = path.join(VENDOR_DIR, 'bin');
const GITHUB_REPO = 'iqbal-rashed/imagemagick-nodejs';
const RELEASE_TAG = 'bin-main';

const ALLOWED_DOMAINS = [
  'github.com',
  'api.github.com',
  'objects.githubusercontent.com',
  'codeload.github.com',
  'raw.githubusercontent.com',
  'release-assets.githubusercontent.com',
];

function isMusl() {
  if (process.platform !== 'linux') return false;
  try {
    if (execSync('ldd --version 2>&1 || true', { encoding: 'utf8' }).toLowerCase().includes('musl'))
      return true;
    if (fs.existsSync('/etc/alpine-release')) return true;
    if (fs.readdirSync('/lib').filter((f) => f.startsWith('libc.musl')).length > 0) return true;
  } catch {}
  return false;
}

function getPlatformId() {
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

function validateUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ALLOWED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = {
      'User-Agent': 'imagemagick-nodejs',
      Accept: 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    https
      .get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location;
          if (!location) return reject(new Error('Redirect without location header'));
          if (!validateUrl(location))
            return reject(new Error(`Redirect to disallowed domain: ${location}`));
          return fetchJson(location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200)
          return reject(new Error(`Failed to fetch release: ${res.statusCode}`));
        let data = '';
        res.on('data', (chunk) => (data += chunk.toString()));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e}`));
          }
        });
      })
      .on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = (downloadUrl) => {
      const parsed = new URL(downloadUrl);
      const headers = { 'User-Agent': 'imagemagick-nodejs' };
      if (process.env.GITHUB_TOKEN && parsed.hostname.includes('github')) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      https
        .get(
          { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers },
          (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
              const location = res.headers.location;
              if (!location) return reject(new Error('Redirect without location header'));
              if (!validateUrl(location))
                return reject(new Error(`Redirect to disallowed domain: ${location}`));
              return request(location);
            }
            if (res.statusCode !== 200)
              return reject(new Error(`Download failed: ${res.statusCode}`));

            const totalSize = parseInt(res.headers['content-length'] ?? '0', 10);
            let downloadedSize = 0;
            res.on('data', (chunk) => {
              downloadedSize += chunk.length;
              if (totalSize > 0)
                process.stdout.write(
                  `\r  Downloading: ${((downloadedSize / totalSize) * 100).toFixed(1)}%`
                );
            });
            res.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(' Done!');
              resolve();
            });
          }
        )
        .on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
    };
    request(url);
  });
}

async function extractTarGz(tarPath, destDir) {
  await tar.extract({ file: tarPath, cwd: destDir, strip: 1 });
  console.log(`  Extracted to ${destDir}`);
}

function makeExecutable(binaryPath) {
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(binaryPath, 0o755);
    } catch (err) {
      console.warn(`Warning: Could not make binary executable: ${err}`);
    }
  }
}

async function install() {
  console.log('[imagemagick-nodejs] Installing ImageMagick binary...');

  if (process.env.IMAGEMAGICK_SKIP_DOWNLOAD) {
    console.log('  Skipping download (IMAGEMAGICK_SKIP_DOWNLOAD is set)');
    return;
  }

  const binaryName = process.platform === 'win32' ? 'magick.exe' : 'magick';
  const binaryPath = path.join(BIN_DIR, binaryName);

  if (fs.existsSync(binaryPath)) {
    console.log('  Binary already exists, skipping download');
    return;
  }

  try {
    const platformId = getPlatformId();
    console.log(`  Platform: ${platformId}`);
    console.log('  Fetching release info...');

    const release = await fetchJson(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${RELEASE_TAG}`
    );
    const assetPattern = new RegExp(`imagemagick-.*-${platformId}\\.tar\\.gz$`);
    const asset = release.assets.find((a) => assetPattern.test(a.name));

    if (!asset) {
      console.error(`  ERROR: No binary available for ${platformId}`);
      console.error('  Available assets:', release.assets.map((a) => a.name).join(', '));
      console.error('  You may need to install ImageMagick manually.');
      process.exit(0);
    }

    console.log(`  Found asset: ${asset.name}`);
    fs.mkdirSync(BIN_DIR, { recursive: true });

    const tarPath = path.join(VENDOR_DIR, asset.name);
    await downloadFile(asset.browser_download_url, tarPath);

    console.log('  Extracting...');
    await extractTarGz(tarPath, VENDOR_DIR);
    fs.unlinkSync(tarPath);
    makeExecutable(binaryPath);

    if (fs.existsSync(binaryPath)) {
      console.log(`  ✓ ImageMagick installed to ${BIN_DIR}`);
    } else {
      throw new Error('Binary not found after extraction');
    }
  } catch (err) {
    console.error(`  ERROR: ${err}`);
    console.error('  ImageMagick binary download failed.');
    console.error('  The package will still work if ImageMagick is installed on your system.');
    process.exit(0);
  }
}

install()
  .catch((err) => {
    console.error('Installation failed:', err);
  })
  .finally(() => process.exit(0));
