const db = require('../../config/database');

// Herbs that should be available from all suppliers for meaningful demos
const essentialDemoHerbs = [
  'Ginseng', 'Licorice Root', 'Astragalus Root', 'White Peony Root',
  'Coptis Rhizome', 'Honeysuckle Flower', 'Angelica Root', 'Prepared Rehmannia Root',
  'Aconite', 'Dried Ginger', 'Saposhnikovia Root', 'Angelica', 'Tangerine Peel',
  'Fritillaria Bulb', 'Platycodon Root', 'Cinnamon Bark', 'Atractylodes Rhizome',
  'Jujube Kernel', 'Coix Seed', 'Red Peony Root', 'Raw Rehmannia Root',
  'Ligusticum Rhizome', 'Longan Flesh', 'Ophiopogon Root', 'Poria'
];

// Hong Kong pricing data for herbs (HK$ per gram)
const herbPricing = {
  'Ginseng': { base: 10.0, range: [8.0, 15.0] },
  'Licorice Root': { base: 0.6, range: [0.3, 0.8] },
  'Astragalus Root': { base: 1.2, range: [0.8, 1.5] },
  'White Peony Root': { base: 2.0, range: [1.5, 2.8] },
  'Coptis Rhizome': { base: 2.8, range: [2.0, 4.0] },
  'Honeysuckle Flower': { base: 0.9, range: [0.6, 1.3] },
  'Angelica Root': { base: 1.8, range: [1.2, 2.5] },
  'Prepared Rehmannia Root': { base: 1.5, range: [1.0, 2.0] },
  'Aconite': { base: 3.5, range: [2.5, 4.5] },
  'Dried Ginger': { base: 0.8, range: [0.5, 1.2] },
  'Saposhnikovia Root': { base: 1.4, range: [1.0, 2.0] },
  'Angelica': { base: 1.8, range: [1.2, 2.5] },
  'Tangerine Peel': { base: 0.7, range: [0.4, 1.0] },
  'Fritillaria Bulb': { base: 4.0, range: [3.0, 5.5] },
  'Platycodon Root': { base: 1.1, range: [0.8, 1.5] },
  'Cinnamon Bark': { base: 1.2, range: [0.8, 1.8] },
  'Atractylodes Rhizome': { base: 0.9, range: [0.6, 1.3] },
  'Jujube Kernel': { base: 2.2, range: [1.8, 3.0] },
  'Coix Seed': { base: 0.6, range: [0.4, 0.9] },
  'Red Peony Root': { base: 1.4, range: [1.0, 2.0] },
  'Raw Rehmannia Root': { base: 1.0, range: [0.7, 1.5] },
  'Ligusticum Rhizome': { base: 1.6, range: [1.2, 2.2] },
  'Longan Flesh': { base: 2.5, range: [2.0, 3.2] },
  'Ophiopogon Root': { base: 1.8, range: [1.2, 2.5] },
  'Poria': { base: 0.8, range: [0.5, 1.2] }
};

// Supplier strategies
const supplierStrategies = {
  'Golden Herbs Supply Co.': { multiplier: 1.0, quality: 'A' },
  'Dragon Well Herbs Ltd.': { multiplier: 0.85, quality: 'B' },
  'Jade Mountain Trading': { multiplier: 1.25, quality: 'A' },
  'Harmony Herb Wholesale': { multiplier: 0.70, quality: 'C' },
  'Phoenix Traditional Medicine': { multiplier: 0.95, quality: 'B' }
};

async function enrichSupplierInventory() {
  try {
    console.log('🏥 Enriching supplier inventory for meaningful demos...');
    
    // Get all suppliers
    const suppliersResult = await db.query('SELECT id, name FROM users WHERE user_type = $1', ['supplier']);
    const suppliers = suppliersResult.rows;
    
    console.log(`📋 Found ${suppliers.length} suppliers`);
    
    // Get herb IDs for essential demo herbs
    const herbsResult = await db.query(
      'SELECT id, name FROM herbs WHERE name = ANY($1)',
      [essentialDemoHerbs]
    );
    const herbs = herbsResult.rows;
    
    console.log(`📋 Found ${herbs.length} essential demo herbs in database`);
    
    let addedCount = 0;
    let updatedCount = 0;
    
    for (const supplier of suppliers) {
      console.log(`\n👤 Processing supplier: ${supplier.name}`);
      const strategy = supplierStrategies[supplier.name] || { multiplier: 1.0, quality: 'B' };
      
      for (const herb of herbs) {
        const pricing = herbPricing[herb.name];
        if (!pricing) continue;
        
        // Check if inventory already exists
        const existingResult = await db.query(
          'SELECT id, quantity_available FROM supplier_inventory WHERE supplier_id = $1 AND herb_id = $2',
          [supplier.id, herb.id]
        );
        
        // Calculate price based on supplier strategy
        const basePrice = pricing.base * strategy.multiplier;
        const minPrice = Math.min(...pricing.range) * strategy.multiplier;
        const maxPrice = Math.max(...pricing.range) * strategy.multiplier;
        const finalPrice = Math.max(minPrice, Math.min(maxPrice, 
          basePrice + (Math.random() - 0.5) * 0.4 * basePrice
        ));
        
        // Generate realistic stock levels
        let stockLevel;
        if (pricing.base > 5) { // Premium herbs
          stockLevel = Math.floor(Math.random() * 800) + 200; // 200-1000g
        } else if (pricing.base > 1) { // Mid-range herbs
          stockLevel = Math.floor(Math.random() * 3000) + 1000; // 1000-4000g
        } else { // Common herbs
          stockLevel = Math.floor(Math.random() * 6000) + 2000; // 2000-8000g
        }
        
        // Generate expiry date (6 months to 2 years from now)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + Math.floor(Math.random() * 18) + 6);
        
        if (existingResult.rows.length > 0) {
          // Update existing inventory if stock is low
          const existing = existingResult.rows[0];
          if (existing.quantity_available < 500) {
            await db.query(`
              UPDATE supplier_inventory 
              SET quantity_available = $1, price_per_gram = $2, quality_grade = $3, expiry_date = $4, updated_at = CURRENT_TIMESTAMP
              WHERE id = $5
            `, [
              stockLevel,
              Math.round(finalPrice * 100) / 100,
              strategy.quality,
              expiryDate.toISOString().split('T')[0],
              existing.id
            ]);
            updatedCount++;
          }
        } else {
          // Add new inventory
          await db.query(`
            INSERT INTO supplier_inventory (
              supplier_id, herb_id, quantity_available, price_per_gram, 
              quality_grade, expiry_date
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            supplier.id,
            herb.id,
            stockLevel,
            Math.round(finalPrice * 100) / 100,
            strategy.quality,
            expiryDate.toISOString().split('T')[0]
          ]);
          addedCount++;
        }
      }
      
      console.log(`   ✅ Processed ${herbs.length} herbs for ${supplier.name}`);
    }
    
    console.log('\n🎉 Supplier inventory enrichment completed!');
    console.log(`📊 Results:`);
    console.log(`   - Added: ${addedCount} new inventory items`);
    console.log(`   - Updated: ${updatedCount} existing items`);
    
    // Verify coverage
    const coverageResult = await db.query(`
      SELECT h.name, COUNT(si.supplier_id) as supplier_count
      FROM herbs h
      LEFT JOIN supplier_inventory si ON h.id = si.herb_id
      WHERE h.name = ANY($1)
      GROUP BY h.id, h.name
      ORDER BY supplier_count DESC, h.name
    `, [essentialDemoHerbs]);
    
    console.log('\n📋 Supplier coverage for demo herbs:');
    coverageResult.rows.forEach(row => {
      const status = row.supplier_count >= 3 ? '✅' : '⚠️';
      console.log(`   ${status} ${row.name}: ${row.supplier_count} suppliers`);
    });
    
    console.log('\n🚀 Demo prescriptions should now have meaningful supplier comparisons!');
    
  } catch (error) {
    console.error('❌ Error enriching supplier inventory:', error);
    throw error;
  }
}

if (require.main === module) {
  enrichSupplierInventory()
    .then(() => {
      console.log('✨ Inventory enrichment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Inventory enrichment failed:', error);
      process.exit(1);
    });
}

module.exports = { enrichSupplierInventory };