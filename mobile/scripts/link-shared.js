#!/usr/bin/env node
/**
 * Links the monorepo's shared packages into this app's node_modules so Metro
 * resolves them as real packages:
 *   node_modules/@mesalista/shared -> ../../packages/shared
 *   node_modules/@mesalista/types  -> ../../types
 *
 * Metro rejects relative imports that escape the project root and won't index
 * sibling folders via watchFolders/extraNodeModules alone, so the spine must be
 * reachable through node_modules. Runs automatically on `npm install`
 * (postinstall) and is idempotent.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const scope = path.join(projectRoot, 'node_modules', '@mesalista');
fs.mkdirSync(scope, { recursive: true });

const links = {
  shared: path.join(projectRoot, '..', 'packages', 'shared'),
  types: path.join(projectRoot, '..', 'types'),
};

for (const [name, target] of Object.entries(links)) {
  const linkPath = path.join(scope, name);
  try {
    if (fs.existsSync(linkPath) || fs.lstatSync(linkPath, { throwIfNoEntry: false })) {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  } catch {
    /* nothing to remove */
  }
  if (!fs.existsSync(target)) {
    console.warn(`[link-shared] target missing, skipping: ${target}`);
    continue;
  }
  const relTarget = path.relative(scope, target);
  fs.symlinkSync(relTarget, linkPath, 'dir');
  console.log(`[link-shared] @mesalista/${name} -> ${relTarget}`);
}
