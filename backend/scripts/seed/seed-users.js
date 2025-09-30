const bcrypt = require('bcryptjs');
const db = require('../../config/database');

const createTestUsers = async () => {
    try {
        console.log('Creating test users...');

        // Hash passwords
        const practitionerPassword = await bcrypt.hash('password123', 12);
        const supplierPassword = await bcrypt.hash('password123', 12);

        // Create practitioner user
        await db.query(`
      INSERT INTO users (email, password, name, user_type, phone, address, license_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `, [
            'practitioner@test.com',
            practitionerPassword,
            'Dr. Li Wei',
            'practitioner',
            '+1-555-0101',
            '123 Medical Center, San Francisco, CA',
            'TCM-2024-001'
        ]);

        // Create supplier user
        await db.query(`
      INSERT INTO users (email, password, name, user_type, phone, address, license_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `, [
            'supplier@test.com',
            supplierPassword,
            'Golden Herbs Supply Co.',
            'supplier',
            '+1-555-0202',
            '456 Herb Street, Oakland, CA',
            'HERB-SUP-2024-001'
        ]);

        // Add some common herbs to the database
        const commonHerbs = [
            { name: 'Ginseng', chinese_name: '人参' },
            { name: 'Goji Berry', chinese_name: '枸杞' },
            { name: 'Astragalus', chinese_name: '黄芪' },
            { name: 'Licorice Root', chinese_name: '甘草' },
            { name: 'Angelica', chinese_name: '当归' },
            { name: 'Rehmannia', chinese_name: '地黄' },
            { name: 'Schisandra', chinese_name: '五味子' },
            { name: 'Chrysanthemum', chinese_name: '菊花' }
        ];

        for (const herb of commonHerbs) {
            // Check if herb already exists
            const existingHerb = await db.query('SELECT id FROM herbs WHERE name = $1', [herb.name]);
            if (existingHerb.rows.length === 0) {
                await db.query(`
          INSERT INTO herbs (name, chinese_name)
          VALUES ($1, $2)
        `, [herb.name, herb.chinese_name]);
            }
        }

        console.log('Test users and herbs created successfully!');
        console.log('\n=== TEST USER CREDENTIALS ===');
        console.log('Practitioner Login:');
        console.log('  Email: practitioner@test.com');
        console.log('  Password: password123');
        console.log('\nSupplier Login:');
        console.log('  Email: supplier@test.com');
        console.log('  Password: password123');
        console.log('===============================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating test users:', error);
        process.exit(1);
    }
};

createTestUsers();