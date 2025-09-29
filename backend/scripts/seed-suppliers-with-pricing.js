const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Hong Kong Chinese Herb Pricing Data (HK$ per gram)
const herbPricing = {
  // Premium Herbs (HK$2-20+ per gram)
  "Ginseng": { base: 10.0, range: [8.0, 15.0] },
  "Cordyceps": { base: 20.0, range: [15.0, 25.0] },
  "American Ginseng": { base: 8.0, range: [6.0, 12.0] },
  "Dendrobium Stem": { base: 6.0, range: [4.0, 8.0] },
  "Donkey-hide Gelatin": { base: 4.5, range: [3.0, 6.0] },
  
  // Mid-Range Herbs (HK$0.50-3 per gram)
  "Astragalus Root": { base: 1.2, range: [0.8, 1.5] },
  "Angelica Root": { base: 1.8, range: [1.2, 2.5] },
  "Prepared Rehmannia Root": { base: 1.5, range: [1.0, 2.0] },
  "White Peony Root": { base: 2.0, range: [1.5, 2.8] },
  "Polygonatum Rhizome": { base: 2.8, range: [2.0, 3.5] },
  "Polygonum Root": { base: 2.2, range: [1.8, 3.0] },
  "Goji Berry": { base: 1.5, range: [1.0, 2.2] },
  "Ophiopogon Root": { base: 1.8, range: [1.2, 2.5] },
  "Eucommia Bark": { base: 1.6, range: [1.0, 2.3] },
  "Morinda Root": { base: 2.5, range: [2.0, 3.2] },
  
  // Common Herbs (HK$0.20-1 per gram)
  "Licorice Root": { base: 0.6, range: [0.3, 0.8] },
  "Poria": { base: 0.8, range: [0.5, 1.2] },
  "Chrysanthemum Flower": { base: 1.1, range: [0.8, 1.5] },
  "Honeysuckle Flower": { base: 0.9, range: [0.6, 1.3] },
  "Tangerine Peel": { base: 0.7, range: [0.4, 1.0] },
  "White Atractylodes Rhizome": { base: 0.9, range: [0.6, 1.3] },
  "Chinese Yam": { base: 0.5, range: [0.3, 0.8] },
  "Jujube Date": { base: 0.4, range: [0.2, 0.7] },
  "Coix Seed": { base: 0.6, range: [0.4, 0.9] },
  "Fresh Ginger": { base: 0.3, range: [0.2, 0.5] },
  "Cassia Twig": { base: 0.8, range: [0.5, 1.2] },
  "Scutellaria Root": { base: 1.2, range: [0.8, 1.8] },
  "Coptis Rhizome": { base: 2.8, range: [2.0, 4.0] },
  "Raw Rehmannia Root": { base: 1.0, range: [0.7, 1.5] },
  "Red Peony Root": { base: 1.4, range: [1.0, 2.0] },
  "Safflower": { base: 1.8, range: [1.2, 2.5] },
  "Peach Kernel": { base: 1.0, range: [0.7, 1.4] },
  "Ligusticum Rhizome": { base: 1.6, range: [1.2, 2.2] },
  "Schisandra Berry": { base: 2.2, range: [1.8, 3.0] }
};

// Supplier profiles with different business strategies
const supplierProfiles = [
  {
    name: "Golden Herbs Supply Co.",
    email: "supplier@test.com", // Existing supplier
    strategy: "premium",
    priceMultiplier: 1.0, // Base pricing
    qualityFocus: "A",
    description: "Premium quality herbs with excellent reputation"
  },
  {
    name: "Dragon Well Herbs Ltd.",
    email: "dragonwell@test.com",
    strategy: "competitive",
    priceMultiplier: 0.85, // 15% cheaper
    qualityFocus: "B",
    description: "Competitive pricing with good quality"
  },
  {
    name: "Jade Mountain Trading",
    email: "jademountain@test.com",
    strategy: "premium_plus",
    priceMultiplier: 1.25, // 25% more expensive
    qualityFocus: "A",
    description: "Ultra-premium herbs, highest quality standards"
  },
  {
    name: "Harmony Herb Wholesale",
    email: "harmony@test.com",
    strategy: "budget",
    priceMultiplier: 0.70, // 30% cheaper
    qualityFocus: "C",
    description: "Budget-friendly options, basic quality"
  },
  {
    name: "Phoenix Traditional Medicine",
    email: "phoenix@test.com",
    strategy: "balanced",
    priceMultiplier: 0.95, // 5% cheaper
    qualityFocus: "B",
    description: "Balanced pricing and quality, reliable supplier"
  }
];

const createSuppliersWithInventory = async () => {
  try {
    console.log('🏥 Creating supplier test accounts with realistic pricing...');
    
    // Get all herbs from database
    const herbsResult = await db.query('SELECT id, name FROM herbs ORDER BY name');
    const herbs = herbsResult.rows;
    
    console.log(`📋 Found ${herbs.length} herbs in database`);

    for (const profile of supplierProfiles) {
      console.log(`\n👤 Creating supplier: ${profile.name}`);
      
      // Create or update supplier user
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const userResult = await db.query(`
        INSERT INTO users (email, password, name, user_type, phone, address, license_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) 
        DO UPDATE SET 
          name = $3, phone = $5, address = $6, license_number = $7
        RETURNING id
      `, [
        profile.email,
        hashedPassword,
        profile.name,
        'supplier',
        `+852-${Math.floor(Math.random() * 90000000) + 10000000}`,
        `${Math.floor(Math.random() * 999) + 1} ${['Central', 'Wan Chai', 'Causeway Bay', 'Tsim Sha Tsui', 'Mong Kok'][Math.floor(Math.random() * 5)]}, Hong Kong`,
        `HERB-${profile.strategy.toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`
      ]);

      const supplierId = userResult.rows[0].id;
      
      // Clear existing inventory for this supplier
      await db.query('DELETE FROM supplier_inventory WHERE supplier_id = $1', [supplierId]);
      
      // Add inventory for each herb with realistic pricing and stock levels
      let addedCount = 0;
      
      for (const herb of herbs) {
        const pricing = herbPricing[herb.name];
        if (!pricing) continue; // Skip herbs without pricing data
        
        // Calculate price based on supplier strategy
        const basePrice = pricing.base * profile.priceMultiplier;
        
        // Add some randomness within the range
        const minPrice = Math.min(...pricing.range) * profile.priceMultiplier;
        const maxPrice = Math.max(...pricing.range) * profile.priceMultiplier;
        const finalPrice = Math.max(minPrice, Math.min(maxPrice, 
          basePrice + (Math.random() - 0.5) * 0.4 * basePrice
        ));
        
        // Generate realistic stock levels based on herb popularity
        let stockLevel;
        if (pricing.base > 10) { // Premium herbs
          stockLevel = Math.floor(Math.random() * 500) + 100; // 100-600g
        } else if (pricing.base > 2) { // Mid-range herbs
          stockLevel = Math.floor(Math.random() * 2000) + 500; // 500-2500g
        } else { // Common herbs
          stockLevel = Math.floor(Math.random() * 5000) + 1000; // 1000-6000g
        }
        
        // Ensure all suppliers carry common/essential herbs, others have 85% availability
        const essentialHerbs = [
          'Ginseng', 'Astragalus Root', 'Licorice Root', 'Jujube Date',
          'Angelica Root', 'White Peony Root', 'Prepared Rehmannia Root',
          'Chrysanthemum Flower', 'Honeysuckle Flower', 'Poria'
        ];
        
        if (!essentialHerbs.includes(herb.name) && Math.random() > 0.85) continue;
        
        // Generate expiry date (6 months to 2 years from now)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + Math.floor(Math.random() * 18) + 6);
        
        await db.query(`
          INSERT INTO supplier_inventory (
            supplier_id, herb_id, quantity_available, price_per_gram, 
            quality_grade, expiry_date
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          supplierId,
          herb.id,
          stockLevel,
          Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
          profile.qualityFocus,
          expiryDate.toISOString().split('T')[0]
        ]);
        
        addedCount++;
      }
      
      console.log(`   ✅ Added ${addedCount} herbs to inventory`);
      console.log(`   💰 Strategy: ${profile.strategy} (${profile.priceMultiplier}x pricing)`);
      console.log(`   🏆 Quality Focus: Grade ${profile.qualityFocus}`);
    }

    console.log('\n🎉 Supplier seeding completed successfully!');
    console.log('\n📊 Test Supplier Accounts Created:');
    console.log('=====================================');
    
    for (const profile of supplierProfiles) {
      console.log(`${profile.name}:`);
      console.log(`  Email: ${profile.email}`);
      console.log(`  Password: password123`);
      console.log(`  Strategy: ${profile.strategy}`);
      console.log(`  Description: ${profile.description}`);
      console.log('');
    }
    
    console.log('🧪 Testing Features Available:');
    console.log('- Compare prices across suppliers');
    console.log('- Filter by quality grade (A/B/C)');
    console.log('- Check inventory availability');
    console.log('- Test different supplier strategies');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating suppliers:', error);
    process.exit(1);
  }
};

createSuppliersWithInventory();