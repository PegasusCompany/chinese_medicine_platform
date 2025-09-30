const db = require('../../../config/database');

async function addDosesPerDayColumn() {
  try {
    console.log('Adding doses_per_day column to prescriptions table...');
    
    // Check if column already exists
    const columnCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'prescriptions' AND column_name = 'doses_per_day'
    `);
    
    if (columnCheck.rows.length === 0) {
      // Add the column
      await db.query(`
        ALTER TABLE prescriptions 
        ADD COLUMN doses_per_day INTEGER NOT NULL DEFAULT 2
      `);
      console.log('✅ Added doses_per_day column successfully');
    } else {
      console.log('ℹ️  doses_per_day column already exists');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error adding doses_per_day column:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addDosesPerDayColumn()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addDosesPerDayColumn };