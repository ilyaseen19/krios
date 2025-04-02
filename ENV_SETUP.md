# Environment Configuration

This project uses environment variables for configuration. This allows for different settings across development, testing, and production environments.

## Setup

1. Copy the `.env.example` file to a new file named `.env`
2. Modify the values in the `.env` file as needed for your environment

## Available Environment Variables

| Variable | Description | Default |
|----------|-------------|--------|
| VITE_API_BASE_URL | Base URL for API endpoints | http://localhost:7001/api |

## Usage

Environment variables are accessed through the `envService.ts` file. Import the variables you need from this service rather than accessing `import.meta.env` directly:

```typescript
import { API_BASE_URL } from './services/envService';

// Use API_BASE_URL in your code
const response = await fetch(`${API_BASE_URL}/some-endpoint`);
```

## Adding New Environment Variables

When adding new environment variables:

1. Add the variable to both `.env` and `.env.example` files
2. Add the variable to the `envService.ts` file
3. Update this documentation

## Important Notes

- All environment variables used by Vite must be prefixed with `VITE_`
- The `.env` file should not be committed to version control (it's added to `.gitignore`)
- The `.env.example` file should be committed as a template