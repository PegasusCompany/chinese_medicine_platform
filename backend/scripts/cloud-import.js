#!/usr/bin/env node

/**
 * Cloud-ready herb import script
 * Supports importing from local files, URLs, or cloud storage
 * Designed for AWS, Azure, GCP deployment
 */

const HerbImporter = require('./import-herbs');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class CloudHerbImporter extends HerbImporter {
  constructor() {
    super();
    this.tempDir = process.env.TEMP_DIR || '/tmp';
  }

  async importFromUrl(url, options = {}) {
    console.log(`Downloading from URL: ${url}`);
    
    const tempFile = path.join(this.tempDir, `herbs-${Date.now()}.${this.getFileExtension(url)}`);
    
    try {
      await this.downloadFile(url, tempFile);
      const result = await this.importFromFile(tempFile, options);
      
      // Log import to database
      await this.logImport({
        source: url,
        file_name: path.basename(url),
        ...result,
        status: 'completed'
      });
      
      return result;
    } catch (error) {
      await this.logImport({
        source: url,
        file_name: path.basename(url),
        status: 'failed',
        error_message: error.message
      });
      throw error;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  async importFromS3(bucketName, key, options = {}) {
    // For AWS S3 integration
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();
    
    console.log(`Importing from S3: s3://${bucketName}/${key}`);
    
    const tempFile = path.join(this.tempDir, `s3-${Date.now()}.${this.getFileExtension(key)}`);
    
    try {
      const params = { Bucket: bucketName, Key: key };
      const data = await s3.getObject(params).promise();
      
      fs.writeFileSync(tempFile, data.Body);
      
      const result = await this.importFromFile(tempFile, options);
      
      await this.logImport({
        source: `s3://${bucketName}/${key}`,
        file_name: key,
        ...result,
        status: 'completed'
      });
      
      return result;
    } catch (error) {
      await this.logImport({
        source: `s3://${bucketName}/${key}`,
        file_name: key,
        status: 'failed',
        error_message: error.message
      });
      throw error;
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  async downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      
      const file = fs.createWriteStream(filePath);
      
      client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Delete the file on error
          reject(err);
        });
      }).on('error', reject);
    });
  }

  getFileExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return ext || 'json';
  }

  async logImport(logData) {
    const db = require('../config/database');
    
    try {
      await db.query(`
        INSERT INTO import_logs (
          file_name, source, total_processed, imported, updated, skipped, 
          status, error_message, imported_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        logData.file_name,
        logData.source,
        logData.total || 0,
        logData.imported || 0,
        logData.updated || 0,
        logData.skipped || 0,
        logData.status,
        logData.error_message || null,
        process.env.USER || 'system'
      ]);
    } catch (error) {
      console.warn('Failed to log import:', error.message);
    }
  }

  async getImportHistory() {
    const db = require('../config/database');
    
    try {
      const result = await db.query(`
        SELECT * FROM import_logs 
        ORDER BY created_at DESC 
        LIMIT 50
      `);
      return result.rows;
    } catch (error) {
      console.error('Failed to get import history:', error.message);
      return [];
    }
  }
}

// Environment-specific configurations
const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      defaultSource: '../data/hk-common-herbs.json'
    },
    production: {
      defaultSource: process.env.HERBS_DATA_URL || 's3://your-bucket/herbs-data.json'
    },
    staging: {
      defaultSource: process.env.HERBS_DATA_URL || 'https://your-api.com/herbs.json'
    }
  };
  
  return configs[env] || configs.development;
};

// CLI interface for cloud deployment
async function main() {
  const args = process.argv.slice(2);
  const importer = new CloudHerbImporter();
  const config = getConfig();

  if (args.length === 0) {
    console.log('Cloud Herb Importer');
    console.log('Usage:');
    console.log('  node cloud-import.js <source> [options]');
    console.log('');
    console.log('Sources:');
    console.log('  file://<path>           Local file');
    console.log('  http(s)://<url>         Remote URL');
    console.log('  s3://<bucket>/<key>     AWS S3 object');
    console.log('  --default               Use environment default');
    console.log('  --history               Show import history');
    console.log('');
    console.log('Options:');
    console.log('  --update-existing       Update existing herbs');
    console.log('  --batch-size=N          Process N herbs at a time');
    console.log('');
    console.log('Examples:');
    console.log('  node cloud-import.js --default');
    console.log('  node cloud-import.js https://api.gov.hk/herbs.json');
    console.log('  node cloud-import.js s3://my-bucket/herbs.json');
    console.log('  node cloud-import.js --history');
    return;
  }

  if (args[0] === '--history') {
    const history = await importer.getImportHistory();
    console.log('\nImport History:');
    console.log('================');
    history.forEach(log => {
      console.log(`${log.created_at}: ${log.source}`);
      console.log(`  Status: ${log.status}`);
      console.log(`  Processed: ${log.total_processed}, Imported: ${log.imported}, Updated: ${log.updated}, Skipped: ${log.skipped}`);
      if (log.error_message) {
        console.log(`  Error: ${log.error_message}`);
      }
      console.log('');
    });
    return;
  }

  const source = args[0] === '--default' ? config.defaultSource : args[0];
  const options = {
    updateExisting: args.includes('--update-existing'),
    batchSize: 100
  };

  // Parse batch size
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  if (batchSizeArg) {
    options.batchSize = parseInt(batchSizeArg.split('=')[1]) || 100;
  }

  try {
    let result;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      result = await importer.importFromUrl(source, options);
    } else if (source.startsWith('s3://')) {
      const [, , bucketAndKey] = source.split('/');
      const [bucket, ...keyParts] = bucketAndKey.split('/');
      const key = keyParts.join('/');
      result = await importer.importFromS3(bucket, key, options);
    } else if (source.startsWith('file://')) {
      result = await importer.importFromFile(source.slice(7), options);
    } else {
      result = await importer.importFromFile(source, options);
    }

    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CloudHerbImporter;