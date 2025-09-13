import React, { useState, useEffect } from 'react';
import { Search, Bot, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import QueryInput from './components/QueryInput';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { processQuery, documentAPI, getSystemHealth } from './services/api';
import { STATUS } from './utils/constants';

function App() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(STATUS.IDLE);

  // Check system health on component mount
  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      const health = await getSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('System health check failed:', error);
    }
  };

  const handleQuery = async (queryText) => {
    setStatus(STATUS.LOADING);
    setError(null);
    setResult(null);

    try {
      console.log('Processing query:', queryText);
      const response = await processQuery(queryText);
      setResult(response);
      setStatus(STATUS.SUCCESS);
    } catch (error) {
      console.error('Query processing failed:', error);
      setError(error.message);
      setStatus(STATUS.ERROR);
    }
  };

  const handleFileUpload = async (file) => {
    setUploadStatus(STATUS.LOADING);
    setError(null);

    try {
      console.log('Uploading file:', file.name);
      const response = await documentAPI.uploadFile(file);

      // Auto-process a query about the uploaded file
      const autoQuery = `Analyze the uploaded file ${file.name} and show me the summary`;
      await handleQuery(autoQuery);
      setUploadStatus(STATUS.SUCCESS);
    } catch (error) {
      console.error('File upload failed:', error);
      setError(error.message);
      setUploadStatus(STATUS.ERROR);
    }
  };

  const getHealthStatus = (service) => {
    if (!systemHealth || !systemHealth[service]) return 'unknown';
    return systemHealth[service].status === 'healthy' ? 'healthy' : 'error';
  };

 const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Bot className="w-8 h-8 text-blue-600" />
            <div className="logo-text">
              <h1>Evidence-on-Demand Bot</h1>
              <p>AI-powered evidence gathering for audits & compliance</p>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          {/* Welcome Message */}
          {status === STATUS.IDLE && !result && (
            <div className="welcome-section">
              <div className="welcome-content">
                
                <h2>What evidence do you need?</h2>
                

                <div className="features-grid">
                  <div className="feature-card">
                    <h3>🔧 GitHub Integration</h3>
                    <p>Query pull requests, issues, and repository information</p>
                  </div>
                  <div className="feature-card">
                    <h3>🎫 JIRA Integration</h3>
                    <p>Search tickets, track approvals, and access workflows</p>
                  </div>
                  <div className="feature-card">
                    <h3>📄 Document Analysis</h3>
                    <p>Upload and analyze CSV files with AI insights</p>
                  </div>
                  <div className="feature-card">
                    <h3>🤖 AI-Powered</h3>
                    <p>Natural language queries with intelligent responses</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Query Input */}
          <div className="query-section">
            <QueryInput
              onSubmit={handleQuery}
              loading={status === STATUS.LOADING}
              onFileUpload={handleFileUpload}
            />

            {uploadStatus === STATUS.LOADING && (
              <div className="upload-status">
                <LoadingSpinner message="Uploading and analyzing file..." size="small" />
              </div>
            )}
          </div>

          {/* Loading State */}
          {status === STATUS.LOADING && (
            <div className="loading-section">
              <LoadingSpinner message="Processing your query..." />
              <div className="loading-steps">
                <div className="step">🔍 Analyzing your query</div>
                <div className="step">🔗 Connecting to data sources</div>
                <div className="step">🤖 Generating AI insights</div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-section">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="error-content">
                <h3>Something went wrong</h3>
                <p>{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setStatus(STATUS.IDLE);
                  }}
                  className="retry-button"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {result && status === STATUS.SUCCESS && (
            <div className="results-section">
              <ResultDisplay result={result} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p >Evidence-on-Demand Bot v1.0 | Build with Love ❤ | Chhalaang 4.0 | The Tech Divas</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
