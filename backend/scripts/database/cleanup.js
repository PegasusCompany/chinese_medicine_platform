const db = require('../../config/database');

async function cleanupDatabase() {
  try {
    console.log('🧹 Cleaning up database...');
    
    // Clear transactional data but keep core structure
    const tablesToClear = [
      'prescription_herbs',
      'prescriptions', 
      'orders',
      'order_items'
    ];
    
    for (const table of tablesToClear) {
      try {
        await db.query(`DELETE FROM ${table}`);
        console.log(`✓ Cleared ${table} table`);
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          console.log(`- Table ${table} doesn't exist yet (that's ok)`);
        }
      }
    }
    
    // Reset sequences
    try {
      await db.query(`ALTER SEQUENCE prescriptions_id_seq RESTART WITH 1`);
      await db.query(`ALTER SEQUENCE orders_id_seq RESTART WITH 1`);
      console.log('✓ Reset ID sequences');
    } catch (error) {
      console.log('- Some sequences don\'t exist yet (that\'s ok)');
    }
    
    console.log('✅ Database cleanup completed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log('Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDatabase };