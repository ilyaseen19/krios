# Krios Backend

Backend service for Krios POS system with MongoDB Atlas synchronization capabilities.

## Features

- User authentication and authorization
- MongoDB Atlas integration for data backup
- Synchronization of IndexedDB data (products, transactions, users)
- Unique database per customer for data isolation

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the environment example file and update with your credentials:
   ```
   cp .env.example .env
   ```
4. Update the `.env` file with your MongoDB Atlas credentials and other configuration
5. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development, production)
- `MONGODB_URI`: MongoDB Atlas connection string
- `MONGODB_PREFIX`: Prefix for customer database names
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRES_IN`: JWT token expiration time
- `CLIENT_URL`: Frontend application URL for CORS

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get JWT token

### Sync Management
- `POST /api/sync/initialize`: Initialize a new database for a customer
- `GET /api/sync/status`: Get synchronization status

### Data Synchronization
- `POST /api/sync/products`: Sync products data
- `POST /api/sync/transactions`: Sync transactions data
- `POST /api/sync/users`: Sync users data

## Database Structure

Each customer gets their own MongoDB database with the following collections:
- `products`: Store product information
- `transactions`: Store transaction records
- `users`: Store user accounts
- `sync_metadata`: Store synchronization metadata