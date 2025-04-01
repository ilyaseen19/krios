import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_PREFIX = process.env.MONGODB_PREFIX || 'krios_';

// Connect to the main MongoDB database
export const connectToMongoDB = async (): Promise<typeof mongoose> => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Connect to a customer-specific database
export const connectToCustomerDB = async (customerId: string, companyName?: string): Promise<mongoose.Connection> => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // Create a shortened customer ID (first 8 characters) to keep database name within MongoDB's 38-byte limit
  const shortCustomerId = customerId.split('-')[0];
  
  // Use company name as prefix if provided, otherwise use default prefix
  const dbPrefix = companyName ? 
    `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_` : 
    MONGODB_PREFIX;

  // If company name is provided, check if a database for this company already exists
  if (companyName) {
    try {
      const existingCustomerIds = await getCustomerDatabases(companyName);
      
      // If there are existing databases for this company, use the first one
      if (existingCustomerIds.length > 0) {
        // Get the short customer ID for database name
        const existingShortCustomerId = existingCustomerIds[0].split('-')[0];
        console.log(`Using existing company database: ${dbPrefix}${existingShortCustomerId}`);
        
        // Create a database URI with the existing database name
        const [baseUri, queryParams] = MONGODB_URI.split('?');
        const existingDbUri = `${baseUri.replace(/\/[^\/]*$/, '')}/${dbPrefix}${existingShortCustomerId}${queryParams ? `?${queryParams}` : ''}`;
        
        // Connect to the existing database
        const connection = await mongoose.createConnection(existingDbUri).asPromise();
        return connection;
      }
    } catch (error) {
      console.error(`Error checking for existing company databases:`, error);
      // Continue with creating a new database if there was an error checking for existing ones
    }
  }

  // Create a customer-specific database URI
  const [baseUri, queryParams] = MONGODB_URI.split('?');
  const customerDbUri = `${baseUri.replace(/\/[^/]*$/, '')}/${dbPrefix}${shortCustomerId}${queryParams ? `?${queryParams}` : ''}`;

  try {
    // Create a new connection for this customer
    const connection = await mongoose.createConnection(customerDbUri).asPromise();
    return connection;
  } catch (error) {
    console.error(`Error connecting to customer database ${dbPrefix}${shortCustomerId}:`, error);
    throw error;
  }
};

// Get all customer database connections and return customerId fields
export const getCustomerDatabases = async (companyName: string): Promise<string[]> => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    const adminDb = mongoose.connection.db.admin();
    const dbs = await adminDb.listDatabases();
    
    // Use company name as prefix if provided, otherwise use default prefix
    const dbPrefix = companyName ? 
      `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_` : 
      MONGODB_PREFIX;
    
    // Filter databases that start with our prefix
    const customerDbNames = dbs.databases
      .filter((db: { name: string }) => db.name.startsWith(dbPrefix))
      .map((db: { name: string }) => db.name);
    
    // Array to store customer IDs
    const customerIds: string[] = [];
    
    // Connect to each database and retrieve the customerId
    for (const dbName of customerDbNames) {
      try {
        // Create a connection to this database
        const [baseUri, queryParams] = MONGODB_URI.split('?');
        const dbUri = `${baseUri.replace(/\/[^\/]*$/, '')}/${dbName}${queryParams ? `?${queryParams}` : ''}`;
        
        const connection = await mongoose.createConnection(dbUri).asPromise();
        
        // Try to find a document in the SyncMetadata collection that contains customerId
        const syncMetadataCollection = connection.collection('syncmetadatas');
        const syncMetadataDoc = await syncMetadataCollection.findOne({ customerId: { $exists: true } });
        
        if (syncMetadataDoc && syncMetadataDoc.customerId) {
          customerIds.push(syncMetadataDoc.customerId);
        }
        
        // Close the connection
        await connection.close();
      } catch (dbError) {
        console.error(`Error retrieving customerId from database ${dbName}:`, dbError);
        // If there's an error, use the database name without prefix as fallback
        const shortDbName = dbName.replace(dbPrefix, '');
        customerIds.push(shortDbName);
      }
    }
    
    return customerIds;
  } catch (error) {
    console.error('Error listing customer databases:', error);
    throw error;
  }
};

// Check if a customer database exists
export const customerDbExists = async (customerId: string, companyName: string): Promise<boolean> => {
  console.log(customerId, companyName);
  
  try {
    const customerIds = await getCustomerDatabases(companyName);
    return customerIds.includes(customerId);
  } catch (error) {
    console.error(`Error checking if customer database ${customerId} exists:`, error);
    return false;
  }
};

// Get company-specific database name
export const getCompanyDbPrefix = (companyName: string): string => {
  return companyName ? 
    `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_` : 
    MONGODB_PREFIX;
};