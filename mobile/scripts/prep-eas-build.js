#!/usr/bin/env node
/**
 * Vendors the sibling monorepo folders (packages/shared, types) into
 * mobile/_vendor/ so they get included in the archive that `eas build`
 * uploads. EAS only uploads the app directory it was invoked from, so
 * without this step Metro can't resolve @mesalista/* on the build server
 * and the "Bundle JavaScript" phase fails.
 *
 * Runs a deep copy (not symlinks) to guarantee the contents survive the
 * archive step. Cleans _vendor/ first so a stale copy never sneaks in.
 *
 * Re-runs link-shared.js at the end so node_modules/@mesalista/* points
 * at the freshly vendored copy — the same layout EAS's postinstall will
 * produce on the build server.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(projectRoot, '..');
const vendorRoot = path.join(projectRoot, '_vendor');

const targets = [
  { from: path.join(monorepoRoot, 'packages', 'shared'), to: path.join(vendorRoot, 'shared') },
  { from: path.join(monorepoRoot, 'types'), to: path.join(vendorRoot, 'types') },
];

const ignore = new Set(['node_modules', 'dist', 'build', '.turbo', '.next']);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      fs.copyFileSync(fs.realpathSync(srcPath), destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.rmSync(vendorRoot, { recursive: true, force: true });

for (const { from, to } of targets) {
  if (!fs.existsSync(from)) {
    console.error(`[prep-eas-build] source missing: ${from}`);
    process.exit(1);
  }
  copyDir(from, to);
  console.log(`[prep-eas-build] ${path.relative(projectRoot, from)} -> ${path.relative(projectRoot, to)}`);
}

execSync('node ./scripts/link-shared.js', { cwd: projectRoot, stdio: 'inherit' });
console.log('[prep-eas-build] done. Ready for `eas build`.');
