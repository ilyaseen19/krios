/**
 * Entry point for the Krios backend server
 * This file loads the compiled JavaScript from the dist folder
 */

// Check if we're in production or development mode
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // In production, load the compiled JavaScript
  require('./dist/index.js');
} else {
  // In development, we can use ts-node to run TypeScript directly
  // This is just a fallback, as normally the dev script would be used directly
  console.log('Loading backend in development mode...');
  require('ts-node/register');
  require('./src/index.ts');
}