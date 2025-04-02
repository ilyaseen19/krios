/**
 * Environment Service
 * 
 * This service provides access to environment variables throughout the application.
 * It uses Vite's import.meta.env for accessing environment variables at runtime.
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Helper function to get any environment variable with type safety
export function getEnvVariable<T>(key: string, defaultValue: T): T {
  const value = import.meta.env[key];
  return value !== undefined ? value as unknown as T : defaultValue;
}