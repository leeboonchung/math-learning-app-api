const { Pool } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL or use individual components
const databaseUrl = process.env.DATABASE_URL;

let dbConfig;

if (databaseUrl) {
  // Use connection string
  dbConfig = {
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
  };
} else {
  // Use individual environment variables as fallback
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
  };
}

console.log('🔧 Database configuration:', {
  host: dbConfig.host || 'from connection string',
  port: dbConfig.port || 'from connection string',
  database: dbConfig.database || 'from connection string',
  ssl: !!dbConfig.ssl
});

const pool = new Pool(dbConfig);

// Test database connection on startup (non-blocking)
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully');
    console.log('📍 Database:', client.database);
    console.log('🔗 Host:', client.host);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Please check your DATABASE_URL in .env file');
    console.error('⚠️  API will start but database operations will fail');
  }
};

// Test connection immediately (but don't exit on failure)
testConnection();

// Handle pool events
pool.on('connect', (client) => {
  console.log('🔗 New database client connected');
});

pool.on('error', (err, client) => {
  console.error('💥 Unexpected database error:', err);
});

pool.on('remove', (client) => {
  console.log('📤 Database client removed from pool');
});

module.exports = {
  // Execute a query with parameters
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('🔍 Query executed:', { text: text.substring(0, 50) + '...', duration: `${duration}ms`, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('❌ Query error:', error.message);
      console.error('📝 Query:', text);
      throw error;
    }
  },

  // Get a client from the pool for transactions
  getClient: async () => {
    try {
      const client = await pool.connect();
      console.log('🎯 Database client acquired from pool');
      return client;
    } catch (error) {
      console.error('❌ Failed to get database client:', error.message);
      throw error;
    }
  },

  // Execute a transaction
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log('🚀 Transaction started');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('🔄 Transaction rolled back:', error.message);
      throw error;
    } finally {
      client.release();
      console.log('📤 Transaction client released');
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as version');
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  },

  // Graceful shutdown
  close: async () => {
    console.log('🔄 Closing database pool...');
    await pool.end();
    console.log('✅ Database pool closed');
  },

  // Direct pool access for advanced usage
  pool
};
