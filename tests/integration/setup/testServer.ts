import app from '../../../src/app';
import { Application } from 'express';

/**
 * Test Server Setup
 * Export the Express app for testing without starting the actual server
 */

let testApp: Application | null = null;

export function getTestApp(): Application {
  if (!testApp) {
    testApp = app;
  }
  return testApp;
}

export default getTestApp();
