const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root for changes
config.watchFolders = [monorepoRoot];

// Add resolution for monorepo packages
config.resolver.extraNodeModules = {
    '@roomz/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
};

module.exports = config;
