require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./src/config/passport');
const pool = require('./src/config/database');
const { pollForProactiveActions } = require('./src/jobs/proactive.jobs');

const authRoutes = require('./src/routes/auth.routes');
const chatRoutes = require('./src/routes/chat.routes');
const syncRoutes = require('./src/routes/sync.routes');
const instructionsRoutes = require('./src/routes/instructions.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production', // Trust proxy in production
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-site cookies
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api', syncRoutes);
app.use('/api/instructions', instructionsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Start proactive polling (every 5 minutes)
    const pollingInterval = parseInt(process.env.POLLING_INTERVAL || '5');
    setInterval(() => {
      pollForProactiveActions().catch(console.error);
    }, pollingInterval * 60 * 1000);

    console.log(`✓ Proactive polling enabled (every ${pollingInterval} minutes)\n`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});

module.exports = app;
