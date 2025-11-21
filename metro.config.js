const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  watchFolders: [],
  resolver: {
    ...config.resolver,
    blockList: [
      /node_modules\/react-native\/ReactAndroid\/.*/,
      /node_modules\/react-native\/ReactCommon\/.*/,
    ],
  },
};
