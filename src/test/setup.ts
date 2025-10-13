import '@testing-library/jest-dom';

// Simple polyfills for Node environment
import { TextEncoder, TextDecoder } from 'util';

// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

// Mock API module for integration tests
jest.mock('../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  isAxiosError: jest.fn()
}));