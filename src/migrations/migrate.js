const { createTables } = require('./schema');

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    await createTables();
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
