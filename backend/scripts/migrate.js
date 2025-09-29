const db = require('../config/database');

const createTables = async () => {
  try {
    // Users table (practitioners and suppliers)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('practitioner', 'supplier')),
        phone VARCHAR(20),
        address TEXT,
        license_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enhanced Herbs table with additional fields for government data
    await db.query(`
      CREATE TABLE IF NOT EXISTS herbs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        chinese_name VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        properties VARCHAR(255),
        contraindications TEXT,
        dosage_range VARCHAR(100),
        approval_status VARCHAR(50) DEFAULT 'approved',
        unit VARCHAR(20) DEFAULT 'gram',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prescriptions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id SERIAL PRIMARY KEY,
        practitioner_id INTEGER REFERENCES users(id),
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(20),
        patient_address TEXT,
        treatment_days INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prescription items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS prescription_items (
        id SERIAL PRIMARY KEY,
        prescription_id INTEGER REFERENCES prescriptions(id),
        herb_id INTEGER REFERENCES herbs(id),
        quantity_per_day DECIMAL(10,2) NOT NULL,
        total_quantity DECIMAL(10,2) NOT NULL,
        notes TEXT
      )
    `);

    // Orders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        prescription_id INTEGER REFERENCES prescriptions(id),
        supplier_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('accepted', 'preparing', 'packed', 'shipped', 'delivered')),
        estimated_completion DATE,
        actual_completion DATE,
        total_amount DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Supplier inventory table
    await db.query(`
      CREATE TABLE IF NOT EXISTS supplier_inventory (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES users(id),
        herb_id INTEGER REFERENCES herbs(id),
        quantity_available DECIMAL(10,2) NOT NULL DEFAULT 0,
        price_per_gram DECIMAL(10,4),
        quality_grade VARCHAR(10),
        expiry_date DATE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(supplier_id, herb_id)
      )
    `);

    // Import logs table for tracking herb imports
    await db.query(`
      CREATE TABLE IF NOT EXISTS import_logs (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255),
        source VARCHAR(255),
        total_processed INTEGER,
        imported INTEGER,
        updated INTEGER,
        skipped INTEGER,
        status VARCHAR(20) DEFAULT 'completed',
        error_message TEXT,
        imported_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();