// Learn more https://docs.expo.dev/guides/customizing-metro
// Monorepo setup: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the repo root so Metro can read the real shared spine + root types
// that mobile/node_modules/@mesalista/{shared,types} symlink to (created by the
// "link:shared" postinstall script). Babel rewrites the `services/…`, `types/…`
// aliases to those `@mesalista/*` package specifiers (see babel.config.js).
config.watchFolders = [monorepoRoot];

module.exports = withNativeWind(config, { input: './src/global.css' });
