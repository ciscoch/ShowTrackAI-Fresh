/**
 * Metro Configuration for ShowTrackAI
 * 
 * Includes Sentry integration for source map uploads and debug symbol generation
 * while preserving the custom SentryService implementation.
 */

const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// Get the Sentry-enhanced Expo Metro configuration
const config = getSentryExpoConfig(__dirname);

// Export the configuration for Metro bundler
module.exports = config;