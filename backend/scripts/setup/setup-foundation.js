const { cleanupDatabase } = require('../database/cleanup');
const { spawn } = require('child_process');
const path = require('path');

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 Running ${scriptPath}${args.length ? ' ' + args.join(' ') : ''}...`);
    const child = spawn('node', [scriptPath, ...args], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptPath} completed successfully`);
        resolve();
      } else {
        reject(new Error(`${scriptPath} failed with code ${code}`));
      }
    });
  });
}

async function setupFoundation() {
  console.log('🏗️  Setting up Chinese Medicine Platform Foundation');
  console.log('==================================================\n');
  
  try {
    // Step 1: Clean existing data
    console.log('Step 1: Cleaning database...');
    await cleanupDatabase();
    
    // Step 2: Run foundation scripts in order
    console.log('\nStep 2: Setting up database schema...');
    await runScript('database/migrate.js');
    
    console.log('\nStep 3: Adding herb table enhancements...');
    await runScript('database/migrations/add-herb-columns.js');
    
    console.log('\nStep 4: Adding prescription enhancements...');
    await runScript('database/migrations/add-doses-per-day.js');
    
    console.log('\nStep 5: Creating test users...');
    await runScript('seed/seed-users.js');
    
    console.log('\nStep 6: Setting up suppliers with pricing...');
    await runScript('seed/seed-suppliers-with-pricing.js');
    
    console.log('\nStep 7: Importing Hong Kong herbs database...');
    await runScript('data/import-herbs.js', ['../data/hk-comprehensive-herbs.json']);
    
    console.log('\nStep 8: Enriching supplier inventory for demos...');
    await runScript('seed/enrich-supplier-inventory.js');
    
    console.log('\n🎉 Foundation setup completed successfully!');
    console.log('\n📋 Your system now has:');
    console.log('   ✓ Clean database schema');
    console.log('   ✓ Test users (practitioners & suppliers)');
    console.log('   ✓ Hong Kong approved herbs database');
    console.log('   ✓ Supplier pricing data');
    console.log('   ✓ Enhanced prescription features');
    console.log('   ✓ Enriched supplier inventory for meaningful demos');
    
    console.log('\n🚀 System is ready for prescription creation and testing!');
    console.log('\n💡 Optional: Run demo data creation:');
    console.log('   docker-compose exec backend node scripts/seed/demo/create-demo-data.js');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the database is running: docker-compose up -d db');
    console.log('   2. Check database connection settings');
    console.log('   3. Ensure all required files exist in backend/scripts/');
    process.exit(1);
  }
}

if (require.main === module) {
  setupFoundation();
}

module.exports = { setupFoundation };