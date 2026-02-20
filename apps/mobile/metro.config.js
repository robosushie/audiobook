const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so Metro sees workspace packages
config.watchFolders = [workspaceRoot];

// Resolve from app first, then workspace root (for hoisted pnpm packages)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Allow Metro to follow pnpm symlinks so workspace packages resolve correctly
config.resolver.unstable_enableSymlinks = true;

// Block Metro from crawling the Next.js app (it has CSS that Metro can't handle)
config.resolver.blockList = [/apps[/\\]web[/\\].*/];

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });