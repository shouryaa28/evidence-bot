// API endpoints
export const API_BASE_URL = '/api';
export const BACKEND_URL = 'http://localhost:5000';

// Query types
export const QUERY_TYPES = {
  GITHUB: 'github',
  DOCUMENT: 'document',
  GENERAL: 'general'
};

// File types
export const SUPPORTED_FILE_TYPES = {
  CSV: '.csv',
    
};

// Status constants
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Example queries
export const EXAMPLE_QUERIES = {
  github: [
    "Why was PR #456 merged without approval?",
    "Show me the last 5 pull requests",
    "List all open issues with high priority",

  ],
  
  document: [
    "Share the current count of laptops and export to CSV",
    "Process the uploaded invoice data",
    "Show me document statistics"
  ],
  general: [
    "Show me all available evidence sources",
    "What data is available for audit?",
    "Give me a summary of recent activity"
  ]
};

// Colors
export const COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  GRAY: '#6b7280'
};

// Maximum file size for uploads (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
