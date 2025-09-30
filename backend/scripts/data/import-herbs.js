const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../../config/database');

class HerbImporter {
  constructor() {
    this.supportedFormats = ['csv', 'json'];
    this.requiredFields = ['name', 'chinese_name'];
    this.optionalFields = ['description', 'category', 'properties', 'contraindications', 'dosage_range', 'approval_status'];
  }

  async importFromFile(filePath, options = {}) {
    try {
      console.log(`Starting import from: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileExtension = path.extname(filePath).toLowerCase().slice(1);
      
      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: ${this.supportedFormats.join(', ')}`);
      }

      let herbs = [];
      
      if (fileExtension === 'csv') {
        herbs = await this.parseCSV(filePath);
      } else if (fileExtension === 'json') {
        herbs = await this.parseJSON(filePath);
      }

      console.log(`Parsed ${herbs.length} herbs from file`);
      
      const validatedHerbs = this.validateHerbs(herbs);
      console.log(`${validatedHerbs.length} herbs passed validation`);
      
      const importResult = await this.importToDatabase(validatedHerbs, options);
      
      console.log('Import completed successfully!');
      console.log(`- Total processed: ${herbs.length}`);
      console.log(`- Valid herbs: ${validatedHerbs.length}`);
      console.log(`- Imported: ${importResult.imported}`);
      console.log(`- Updated: ${importResult.updated}`);
      console.log(`- Skipped: ${importResult.skipped}`);
      
      return importResult;
    } catch (error) {
      console.error('Import failed:', error.message);
      throw error;
    }
  }

  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const herbs = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Convert CSV row to herb object
          const herb = this.normalizeHerbData(row);
          if (herb) herbs.push(herb);
        })
        .on('end', () => resolve(herbs))
        .on('error', reject);
    });
  }

  async parseJSON(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Handle different JSON structures
    let herbs = [];
    if (Array.isArray(data)) {
      herbs = data;
    } else if (data.herbs && Array.isArray(data.herbs)) {
      herbs = data.herbs;
    } else if (data.data && Array.isArray(data.data)) {
      herbs = data.data;
    } else {
      throw new Error('Invalid JSON structure. Expected array of herbs or object with herbs/data property');
    }
    
    return herbs.map(herb => this.normalizeHerbData(herb));
  }

  normalizeHerbData(rawData) {
    // Handle different field name variations
    const fieldMappings = {
      name: ['name', 'english_name', 'herb_name', 'Name', 'English Name'],
      chinese_name: ['chinese_name', 'chinese', 'traditional_name', 'Chinese Name', '中文名', '藥材名'],
      description: ['description', 'desc', 'Description', '描述'],
      category: ['category', 'type', 'Category', '類別'],
      properties: ['properties', 'nature', 'Properties', '性味'],
      contraindications: ['contraindications', 'warnings', 'Contraindications', '禁忌'],
      dosage_range: ['dosage_range', 'dosage', 'Dosage', '用量'],
      approval_status: ['approval_status', 'status', 'approved', 'Status', '批准狀態']
    };

    const herb = {};
    
    for (const [standardField, possibleFields] of Object.entries(fieldMappings)) {
      for (const field of possibleFields) {
        if (rawData[field] !== undefined && rawData[field] !== null && rawData[field] !== '') {
          herb[standardField] = String(rawData[field]).trim();
          break;
        }
      }
    }

    return herb;
  }

  validateHerbs(herbs) {
    return herbs.filter(herb => {
      // Check required fields
      for (const field of this.requiredFields) {
        if (!herb[field] || herb[field].trim() === '') {
          console.warn(`Skipping herb: missing required field '${field}'`, herb);
          return false;
        }
      }
      
      // Basic validation
      if (herb.name.length < 2) {
        console.warn(`Skipping herb: name too short`, herb);
        return false;
      }
      
      return true;
    });
  }

  async importToDatabase(herbs, options = {}) {
    const { updateExisting = false, batchSize = 100 } = options;
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    await db.query('BEGIN');

    try {
      // Process herbs in batches for better performance
      for (let i = 0; i < herbs.length; i += batchSize) {
        const batch = herbs.slice(i, i + batchSize);
        
        for (const herb of batch) {
          const result = await this.insertOrUpdateHerb(herb, updateExisting);
          
          if (result === 'imported') imported++;
          else if (result === 'updated') updated++;
          else skipped++;
        }
        
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(herbs.length / batchSize)}`);
      }

      await db.query('COMMIT');
      
      return { imported, updated, skipped, total: herbs.length };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  async insertOrUpdateHerb(herb, updateExisting) {
    // Check if herb already exists
    const existingHerb = await db.query(
      'SELECT id FROM herbs WHERE name = $1 OR chinese_name = $2',
      [herb.name, herb.chinese_name]
    );

    if (existingHerb.rows.length > 0) {
      if (updateExisting) {
        // Update existing herb
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        for (const [field, value] of Object.entries(herb)) {
          if (field !== 'name') { // Don't update the primary identifier
            updateFields.push(`${field} = $${paramIndex}`);
            updateValues.push(value);
            paramIndex++;
          }
        }

        if (updateFields.length > 0) {
          updateValues.push(existingHerb.rows[0].id);
          await db.query(
            `UPDATE herbs SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
            updateValues
          );
          return 'updated';
        }
      }
      return 'skipped';
    } else {
      // Insert new herb
      const fields = Object.keys(herb);
      const values = Object.values(herb);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

      await db.query(
        `INSERT INTO herbs (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      );
      return 'imported';
    }
  }

  async generateSampleFiles() {
    // Generate sample CSV file
    const csvContent = `name,chinese_name,description,category,properties,dosage_range
Ginseng,人参,Adaptogenic herb for energy and vitality,Tonifying,Sweet and slightly warm,3-9g
Astragalus,黄芪,Immune system support and qi tonification,Tonifying,Sweet and slightly warm,9-30g
Licorice Root,甘草,Harmonizing herb used in many formulas,Harmonizing,Sweet and neutral,3-9g`;

    fs.writeFileSync(path.join(__dirname, '../../data/sample-herbs.csv'), csvContent);

    // Generate sample JSON file
    const jsonContent = {
      source: "Hong Kong Government - Chinese Medicine Division",
      last_updated: new Date().toISOString(),
      herbs: [
        {
          name: "Ginseng",
          chinese_name: "人参",
          description: "Adaptogenic herb for energy and vitality",
          category: "Tonifying",
          properties: "Sweet and slightly warm",
          dosage_range: "3-9g",
          approval_status: "Approved"
        },
        {
          name: "Astragalus",
          chinese_name: "黄芪", 
          description: "Immune system support and qi tonification",
          category: "Tonifying",
          properties: "Sweet and slightly warm",
          dosage_range: "9-30g",
          approval_status: "Approved"
        }
      ]
    };

    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dataDir, 'sample-herbs.json'), 
      JSON.stringify(jsonContent, null, 2)
    );

    console.log('Sample files generated:');
    console.log('- backend/data/sample-herbs.csv');
    console.log('- backend/data/sample-herbs.json');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const importer = new HerbImporter();

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node import-herbs.js <file-path> [options]');
    console.log('  node import-herbs.js --generate-samples');
    console.log('');
    console.log('Options:');
    console.log('  --update-existing    Update existing herbs instead of skipping');
    console.log('  --batch-size=N       Process N herbs at a time (default: 100)');
    console.log('');
    console.log('Examples:');
    console.log('  node import-herbs.js ../../data/hk-herbs.csv');
    console.log('  node import-herbs.js ../../data/herbs.json --update-existing');
    console.log('  node import-herbs.js --generate-samples');
    return;
  }

  if (args[0] === '--generate-samples') {
    await importer.generateSampleFiles();
    return;
  }

  const filePath = args[0];
  const options = {
    updateExisting: args.includes('--update-existing'),
    batchSize: 100
  };

  // Parse batch size if provided
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  if (batchSizeArg) {
    options.batchSize = parseInt(batchSizeArg.split('=')[1]) || 100;
  }

  try {
    await importer.importFromFile(filePath, options);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = HerbImporter;