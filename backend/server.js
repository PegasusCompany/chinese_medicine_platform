const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const prescriptionRoutes = require('./routes/prescriptions');
const supplierRoutes = require('./routes/suppliers');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chinese Medicine Platform API is running', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chinese Medicine Platform API is running' });
});

// Setup endpoint for database initialization
app.post('/api/setup', async (req, res) => {
  try {
    console.log('🏗️  Starting database setup...');
    const { setupFoundation } = require('./scripts/setup/setup-foundation');
    await setupFoundation();
    res.json({ 
      status: 'success', 
      message: 'Database setup completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Setup failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database setup failed: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});