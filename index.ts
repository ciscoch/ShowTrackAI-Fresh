import 'react-native-url-polyfill/auto';

// Add polyfills for React Native compatibility
if (!global.structuredClone) {
  global.structuredClone = require('structured-clone');
}

// Add Buffer polyfill for React Native
if (!global.Buffer) {
  global.Buffer = require('buffer').Buffer;
}

// Add process polyfill for React Native
if (!global.process) {
  global.process = require('process');
}

// Add console.log timing for development debugging
if (__DEV__) {
  const originalLog = console.log;
  console.log = (...args) => {
    originalLog(new Date().toLocaleTimeString(), ...args);
  };
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
