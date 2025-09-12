# Evidence-on-Demand Bot 🤖

An AI-powered assistant that instantly fetches and formats evidence from various sources for audits, compliance checks, and incident investigations.

## 🚀 Features

- **Natural Language Processing**: Ask questions in plain English
- **Multi-Source Integration**: Connects to GitHub, JIRA, and document repositories
- **Document Parsing**: Processes CSV, Excel files automatically
- **AI-Powered Analysis**: Uses Google Gemini AI for intelligent query interpretation
- **Export Capabilities**: Download results in CSV/Excel format
- **Real-time Results**: Instant evidence retrieval and formatting

## 🛠️ Technology Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Google Gemini API (Free Tier)
- **Integrations**: GitHub REST API, JIRA REST API
- **File Processing**: SheetJS, csv-parser

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Free API keys for:
  - Google Gemini API
  - GitHub Personal Access Token
  - JIRA API Token (if using JIRA)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd evidence-bot
npm run install-all
```

### 2. Environment Configuration

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual API keys:

```env
# Get your Gemini API key from: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Create GitHub token at: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_personal_access_token_here

# For JIRA Cloud integration
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_jira_api_token_here
```

### 3. Run the Application

```bash
# Start both frontend and backend simultaneously
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📖 How to Get API Keys

### Google Gemini API (Free)
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

### GitHub Personal Access Token (Free)
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token (classic)
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy the token to your `.env` file

### JIRA API Token (Free for Atlassian Cloud)
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage/api-tokens)
2. Create an API token
3. Copy your JIRA URL, email, and token to your `.env` file

## 🔍 Example Queries

### GitHub Integration
- "Why was PR #456 merged without approval?"
- "Show me the last 5 pull requests in the main repository"
- "List all open issues with high priority"

### JIRA Integration
- "Show access given to Jane for Prod DB"
- "List all tickets in TODO status"
- "Find approval workflows for user access"

### Document Parsing
- "Share the current count of laptops in the office and export to CSV"
- "Analyze the asset register and show summary"
- "Process the uploaded invoice data"

## 📁 Project Structure

```
evidence-bot/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── utils/          # Utilities
│   └── package.json
├── backend/                 # Express backend
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   └── uploads/            # File uploads
├── .env.example            # Environment variables template
└── README.md              # This file
```

## 🔧 Development

### Adding New Data Sources

1. Create a new service file in `backend/services/`
2. Add corresponding route in `backend/routes/`
3. Update the AI service to handle new query types
4. Add frontend components if needed

### Extending AI Capabilities

The AI service (`backend/services/aiService.js`) can be extended to:
- Handle more complex query types
- Add query rewriting capabilities
- Implement multi-source aggregation

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm start
```

### Frontend Build
```bash
cd frontend
npm run build
```

## 🤝 API Endpoints

- `POST /api/query` - Process natural language queries
- `GET /api/github/repos` - List repositories
- `GET /api/github/prs/:repo` - Get pull requests
- `GET /api/jira/issues` - Get JIRA issues
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents/analyze/:filename` - Analyze uploaded documents

## 🛡️ Security Notes

- API keys are stored in environment variables
- CORS is configured for development
- File uploads are limited and validated
- Authentication headers are properly handled

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

1. **API Key Errors**: Verify all API keys are correctly set in `.env`
2. **CORS Issues**: Ensure frontend URL matches in backend CORS config
3. **File Upload Issues**: Check file permissions in uploads directory
4. **Port Conflicts**: Change ports in package.json if needed

### Support

For issues and questions:
1. Check the console logs for detailed error messages
2. Verify API key validity
3. Ensure all dependencies are installed
4. Check network connectivity for API calls

## 🏆 Hackathon Submission

This project fulfills all mandatory requirements:
- ✅ Natural Language Query Handling
- ✅ Evidence Retrieval from APIs (GitHub/JIRA)
- ✅ Evidence Retrieval Without APIs (Document parsing)
- ✅ Response Formatting & Delivery
- ✅ Export functionality
- ✅ AI-powered query interpretation
