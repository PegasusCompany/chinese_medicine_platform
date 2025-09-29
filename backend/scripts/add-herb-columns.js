const db = require('../config/database');

const addColumns = async () => {
  try {
    console.log('Adding missing columns to herbs table...');

    // Add columns if they don't exist
    const columnsToAdd = [
      'category VARCHAR(100)',
      'properties VARCHAR(255)',
      'contraindications TEXT',
      'dosage_range VARCHAR(100)',
      'approval_status VARCHAR(50) DEFAULT \'approved\''
    ];

    for (const column of columnsToAdd) {
      const [columnName] = column.split(' ');
      
      try {
        await db.query(`ALTER TABLE herbs ADD COLUMN ${column}`);
        console.log(`✓ Added column: ${columnName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`- Column ${columnName} already exists`);
        } else {
          console.error(`✗ Error adding column ${columnName}:`, error.message);
        }
      }
    }

    console.log('Column addition completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  }
};

addColumns();