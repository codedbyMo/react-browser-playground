// Verifies what the installed react-dom package actually exports,
// using the packages in this playground's node_modules.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const reactDom = require('react-dom');
const react = require('react');

console.log('react version:', react.version);
console.log("typeof react-dom 'browser' export:", typeof reactDom.browser);
console.log("typeof react 'use' export:", typeof react.use);

if (typeof reactDom.browser !== 'function') {
  console.error('FAIL: react-dom does not export a browser function');
  process.exit(1);
}

const value = reactDom.browser('probe reason');
console.log('browser() returns:', Object.prototype.toString.call(value));
console.log('OK: browser is exported by the installed react-dom.');
