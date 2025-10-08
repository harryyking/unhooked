const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { withSentryMetroConfig } = require('@sentry/react-native/metro');

const config = getDefaultConfig(__dirname);


// module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
module.exports = withSentryMetroConfig(config)