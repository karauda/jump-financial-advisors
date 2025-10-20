const pool = require('./database');

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...');

    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✓ pgvector extension enabled');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        google_id VARCHAR(255) UNIQUE,
        google_tokens JSONB,
        hubspot_tokens JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Conversations table created');

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        tool_calls JSONB,
        tool_call_id VARCHAR(255),
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Messages table created');

    // Ongoing instructions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ongoing_instructions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        instruction TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Ongoing instructions table created');

    // Tasks table (for multi-step operations)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        context JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tasks table created');

    // Emails table (for RAG)
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email_id VARCHAR(255) UNIQUE NOT NULL,
        thread_id VARCHAR(255),
        subject TEXT,
        from_email VARCHAR(255),
        from_name VARCHAR(255),
        to_emails TEXT[],
        content TEXT,
        snippet TEXT,
        date TIMESTAMP,
        labels TEXT[],
        embedding vector(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Emails table created');

    // Create index for email embeddings
    await client.query(`
      CREATE INDEX IF NOT EXISTS emails_embedding_idx
      ON emails USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✓ Email embeddings index created');

    // HubSpot contacts table (for RAG)
    await client.query(`
      CREATE TABLE IF NOT EXISTS hubspot_contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        contact_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        company VARCHAR(255),
        phone VARCHAR(50),
        properties JSONB,
        embedding vector(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ HubSpot contacts table created');

    // Create index for contact embeddings
    await client.query(`
      CREATE INDEX IF NOT EXISTS hubspot_contacts_embedding_idx
      ON hubspot_contacts USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✓ HubSpot contacts embeddings index created');

    // HubSpot notes table (for RAG)
    await client.query(`
      CREATE TABLE IF NOT EXISTS hubspot_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        note_id VARCHAR(255) UNIQUE NOT NULL,
        contact_id VARCHAR(255),
        content TEXT,
        created_date TIMESTAMP,
        embedding vector(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ HubSpot notes table created');

    // Create index for note embeddings
    await client.query(`
      CREATE INDEX IF NOT EXISTS hubspot_notes_embedding_idx
      ON hubspot_notes USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✓ HubSpot notes embeddings index created');

    // Calendar events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id VARCHAR(255) UNIQUE NOT NULL,
        summary TEXT,
        description TEXT,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        attendees JSONB,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Calendar events table created');

    // Sync status table (track last sync times)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service VARCHAR(50) NOT NULL,
        last_sync TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        error TEXT,
        UNIQUE(user_id, service)
      );
    `);
    console.log('✓ Sync status table created');

    console.log('\n✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = migrate;
