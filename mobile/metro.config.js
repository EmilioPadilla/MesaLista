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

// The shared spine is symlinked from packages/shared (realpath outside this
// app), so its `react` / `@tanstack/react-query` imports could resolve to the
// web app's copy at the repo root — yielding two Reacts ("Invalid hook call").
// Pin these context-bearing singletons to the mobile app's node_modules.
const projectNodeModules = path.resolve(projectRoot, 'node_modules');
const isSingleton = (name) =>
  name === 'react' ||
  name.startsWith('react/') ||
  name === 'react-dom' ||
  name.startsWith('react-dom/') ||
  name === '@tanstack/react-query' ||
  name.startsWith('@tanstack/react-query/');

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isSingleton(moduleName)) {
    return { type: 'sourceFile', filePath: require.resolve(moduleName, { paths: [projectNodeModules] }) };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css' });
