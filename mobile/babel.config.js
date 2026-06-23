module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            // App-local (Expo template convention)
            '@': './src',
            // Shared spine — rewritten to bare package specifiers that Metro
            // resolves via resolver.extraNodeModules (see metro.config.js).
            // Same alias names the web app and the spine itself use, so
            // spine-internal imports (services/…, types/…) resolve too.
            types: '@mesalista/types',
            services: '@mesalista/shared/src/services',
            'src/services': '@mesalista/shared/src/services',
            hooks: '@mesalista/shared/src/hooks',
            'src/hooks': '@mesalista/shared/src/hooks',
            utils: '@mesalista/shared/src/utils',
            'src/utils': '@mesalista/shared/src/utils',
            config: '@mesalista/shared/src/config',
            'src/config': '@mesalista/shared/src/config',
            platform: '@mesalista/shared/src/platform',
            'src/platform': '@mesalista/shared/src/platform',
          },
        },
      ],
    ],
  };
};
