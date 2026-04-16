// Main Express Server
// Entry point for the Mini CRM backend and static frontend hosting.

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running.',
    timestamp: new Date().toISOString(),
  });
});

if (process.env.DEMO_MODE === 'true') {
  app.use('/api', require('./routes/demo'));
} else {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/leads', require('./routes/leads'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/followups', require('./routes/followUps'));
}

app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint not found.',
    });
  }

  return res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (process.env.DEMO_MODE !== 'true') {
    await connectDB();
  } else {
    console.log('Demo mode enabled: using in-memory sample data.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;

