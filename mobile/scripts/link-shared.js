#!/usr/bin/env node
/**
 * Links the shared spine into this app's node_modules so Metro resolves it
 * as a real package:
 *   node_modules/@mesalista/shared -> ../../packages/shared  (local dev)
 *                                     ../../_vendor/shared   (EAS build fallback)
 *   node_modules/@mesalista/types  -> ../../types            (local dev)
 *                                     ../../_vendor/types    (EAS build fallback)
 *
 * Metro rejects relative imports that escape the project root and won't index
 * sibling folders via watchFolders/extraNodeModules alone, so the spine must
 * be reachable through node_modules. Runs automatically on `npm install`
 * (postinstall) and is idempotent.
 *
 * EAS Build uploads only the app directory, so the sibling monorepo paths
 * don't exist on the build server. `scripts/prep-eas-build.js` vendors the
 * spine into ./_vendor/ before `eas build`; this script picks up that copy
 * when the sibling paths are absent.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const scope = path.join(projectRoot, 'node_modules', '@mesalista');
fs.mkdirSync(scope, { recursive: true });

const candidates = {
  shared: [
    path.join(projectRoot, '..', 'packages', 'shared'),
    path.join(projectRoot, '_vendor', 'shared'),
  ],
  types: [
    path.join(projectRoot, '..', 'types'),
    path.join(projectRoot, '_vendor', 'types'),
  ],
};

for (const [name, paths] of Object.entries(candidates)) {
  const linkPath = path.join(scope, name);
  try {
    if (fs.existsSync(linkPath) || fs.lstatSync(linkPath, { throwIfNoEntry: false })) {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  } catch {
    /* nothing to remove */
  }
  const target = paths.find((p) => fs.existsSync(p));
  if (!target) {
    console.warn(`[link-shared] no target found for @mesalista/${name}, tried: ${paths.join(', ')}`);
    continue;
  }
  const relTarget = path.relative(scope, target);
  fs.symlinkSync(relTarget, linkPath, 'dir');
  console.log(`[link-shared] @mesalista/${name} -> ${relTarget}`);
}
