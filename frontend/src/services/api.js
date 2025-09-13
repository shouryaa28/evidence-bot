import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

// Main query function
export const processQuery = async (query) => {
  try {
    const response = await api.post('/query', { query });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to process query');
  }
};

// Get query suggestions
export const getQuerySuggestions = async () => {
  try {
    const response = await api.get('/query/suggestions');
    return response.data;
  } catch (error) {
    throw new Error('Failed to get suggestions');
  }
};

// GitHub API functions
export const githubAPI = {
  getRepositories: async () => {
    const response = await api.get('https://api.github.com/repos/shambhavi-123/sprinto-bot');
    return response.data;
  },

  getPullRequests: async (owner, repo, state = 'all') => {
    const response = await api.get(`https://api.github.com/repos/shambhavi-123/sprinto-bot/pulls`, {
      params: { state }
    });
    console.log("------",response);
    return response.data;
  },

  getPullRequest: async (owner, repo, prNumber) => {
    const response = await api.get(`https://api.github.com/repos/shambhavi-123/sprinto-bot/pulls`);
    return response.data;
  },

  getIssues: async (owner, repo, state = 'all') => {
    const response = await api.get(`/github/repos/${owner}/${repo}/issues`, {
      params: { state }
    });
    return response.data;
  },

  searchRepositories: async (query) => {
    const response = await api.get('/github/search/repos', {
      params: { q: query }
    });
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get('/github/health');
    return response.data;
  }
};



// Document API functions
export const documentAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  analyzeDocument: async (filename) => {
    const response = await api.get(`/documents/analyze/${filename}`);
    return response.data;
  },

  getFiles: async () => {
    const response = await api.get('/documents/files');
    return response.data;
  },

  exportToCSV: async (data, filename = 'evidence_export') => {
    const response = await api.post('/documents/export/csv', { data, filename });
    return response.data;
  },

  exportToExcel: async (data, filename = 'evidence_export') => {
    const response = await api.post('/documents/export/excel', { data, filename });
    return response.data;
  },

  deleteFile: async (filename) => {
    const response = await api.delete(`/documents/files/${filename}`);
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get('/documents/health');
    return response.data;
  }
};

// Health check for all services
export const getSystemHealth = async () => {
  try {
    const [backend, github, documents] = await Promise.allSettled([
      api.get('/health'),
      githubAPI.getHealth(),
      
      documentAPI.getHealth()
    ]);

    return {
      backend: backend.status === 'fulfilled' ? backend.value.data : { status: 'error', error: backend.reason?.message },
      github: github.status === 'fulfilled' ? github.value : { status: 'error', error: github.reason?.message },
    
      documents: documents.status === 'fulfilled' ? documents.value : { status: 'error', error: documents.reason?.message }
    };
  } catch (error) {
    throw new Error('Failed to check system health');
  }
};

export default api;