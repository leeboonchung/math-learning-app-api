const db = require('../config/database');

class DatabaseService {
  /**
   * Execute a database health check
   * @returns {Object} Database health status
   */
  static async healthCheck() {
    try {
      const result = await db.query('SELECT NOW() as current_time, version() as version');
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        pool: {
          total: db.pool.totalCount,
          idle: db.pool.idleCount,
          waiting: db.pool.waitingCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute a transaction with proper error handling
   * @param {Function} callback - Transaction callback function
   * @returns {*} Transaction result
   */
  static async executeTransaction(callback) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      const serviceError = new Error('Transaction failed');
      serviceError.code = 'TRANSACTION_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a safe query with error handling
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Object} Query result
   */
  static async executeQuery(text, params = []) {
    try {
      const result = await db.query(text, params);
      return result;
    } catch (error) {
      const serviceError = new Error('Database query failed');
      serviceError.code = 'QUERY_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Test database connectivity
   * @returns {boolean} Connection status
   */
  static async testConnection() {
    try {
      await db.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get database performance metrics
   * @returns {Object} Performance metrics
   */
  static async getPerformanceMetrics() {
    try {
      const queries = [
        'SELECT COUNT(*) as total_connections FROM pg_stat_activity',
        'SELECT datname, numbackends as connections FROM pg_stat_database WHERE datname = current_database()',
        'SELECT schemaname, tablename, n_tup_ins as inserts, n_tup_upd as updates, n_tup_del as deletes FROM pg_stat_user_tables'
      ];

      const results = await Promise.all(
        queries.map(query => this.executeQuery(query))
      );

      return {
        total_connections: results[0].rows[0]?.total_connections || 0,
        database_connections: results[1].rows[0]?.connections || 0,
        table_stats: results[2].rows || []
      };
    } catch (error) {
      return {
        error: 'Failed to retrieve performance metrics',
        message: error.message
      };
    }
  }

  /**
   * Clean up old data (maintenance operation)
   * @param {number} daysOld - Number of days to keep
   * @returns {Object} Cleanup result
   */
  static async cleanupOldData(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.executeTransaction(async (client) => {
        // Example: Clean up old lesson attempts
        const cleanupResult = await client.query(
          'DELETE FROM lesson_attempts WHERE submitted_at < $1',
          [cutoffDate]
        );

        return {
          deleted_attempts: cleanupResult.rowCount,
          cutoff_date: cutoffDate
        };
      });

      return result;
    } catch (error) {
      const serviceError = new Error('Data cleanup failed');
      serviceError.code = 'CLEANUP_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Backup database statistics
   * @returns {Object} Backup information
   */
  static async getBackupInfo() {
    try {
      const result = await this.executeQuery(`
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `);

      return {
        schema_stats: result.rows,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: 'Failed to retrieve backup information',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = DatabaseService;
