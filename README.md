# Financial Advisor AI Agent

An intelligent AI assistant for financial advisors that integrates with Gmail, Google Calendar, and HubSpot CRM to automate client communications and manage relationships.

## Features

- **AI-Powered Chat Interface**: ChatGPT-like interface for interacting with your data
- **RAG (Retrieval Augmented Generation)**: Semantic search through emails and contacts using pgvector
- **Gmail Integration**: Read and send emails automatically
- **Google Calendar**: Schedule meetings and check availability
- **HubSpot CRM**: Manage contacts and add notes
- **Proactive Agent**: Automatically responds to emails based on your instructions
- **Multi-Step Tasks**: Handles complex workflows that require waiting for responses

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL (pgvector), Redis
- **Frontend**: React, Vite, Tailwind CSS
- **AI**: OpenAI GPT-4o with function calling
- **Integrations**: Google OAuth, Gmail API, Calendar API, HubSpot API

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- PostgreSQL 16+ with pgvector
- Redis 7+
- OpenAI API key
- Google Cloud Console account
- HubSpot developer account (free)

### Installation

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start database services
docker compose up -d

# Run database migration
cd backend && npm run migrate

# Configure environment variables (see below)

# Start the application
cd backend && npm run dev        # Terminal 1
cd frontend && npm run dev       # Terminal 2
```

Visit http://localhost:5173

### Environment Variables

Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development
SESSION_SECRET=your-random-secret-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_advisor_ai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
HUBSPOT_CLIENT_ID=your-hubspot-client-id
HUBSPOT_CLIENT_SECRET=your-hubspot-client-secret
HUBSPOT_REDIRECT_URI=http://localhost:3001/auth/hubspot/callback
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Gmail API, Calendar API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3001/auth/google/callback`
5. Add test users including `webshookeng@gmail.com`
6. Copy Client ID and Secret to `.env`

### HubSpot OAuth

1. Go to [HubSpot Developers](https://developers.hubspot.com/)
2. Create an app
3. Add redirect URL: `http://localhost:3001/auth/hubspot/callback`
4. Required scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.schemas.contacts.read`
   - `crm.schemas.contacts.write`
   - `crm.objects.companies.read`
   - `crm.objects.deals.read`
5. Copy App ID and Client Secret to `.env`

## Usage

1. **Login** with Google OAuth
2. **Connect HubSpot** using the button in the header
3. **Sync Data** to import emails, contacts, and calendar events
4. **Start chatting** with the AI agent!

### Example Queries

```
Who mentioned their kid plays baseball?
Show me my HubSpot contacts
What meetings do I have this week?
Schedule a meeting with [contact name] for next Tuesday
```

### Ongoing Instructions

Set persistent rules for the AI to follow:
```
When someone new emails me, create a HubSpot contact for them
```

The agent will automatically execute these instructions when polling detects new emails.

## Deployment

Deploy to Render using the included `render.yaml` blueprint:

1. Push to GitHub
2. Connect repository to Render
3. Render automatically deploys all services
4. Configure environment variables
5. Update OAuth redirect URIs
6. Run database migration

See `render.yaml` for service configuration.

## API Endpoints

- `GET/POST /auth/*` - Authentication endpoints
- `GET/POST /api/conversations` - Conversation management
- `POST /api/conversations/:id/messages` - Send messages
- `POST /api/sync` - Trigger data sync
- `GET/POST /api/instructions` - Manage ongoing instructions

## Database Schema

- `users` - User accounts with OAuth tokens
- `conversations` - Chat conversations
- `messages` - Chat messages with tool calls
- `emails` - Emails with vector embeddings (1536-dim)
- `hubspot_contacts` - Contacts with embeddings
- `hubspot_notes` - Notes with embeddings
- `calendar_events` - Calendar events
- `tasks` - Multi-step task tracking
- `ongoing_instructions` - Persistent AI instructions
- `sync_status` - Sync job status

## Security

- OAuth 2.0 for all integrations
- Secure session management with HTTP-only cookies
- CORS protection
- Environment-based configuration
- No credentials in code

## License

This project was created for a job application challenge.

## Contact

For questions about this project, please reach out through the hiring process.
