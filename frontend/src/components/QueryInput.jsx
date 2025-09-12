import React, { useState, useRef } from 'react';
import { Send, Mic, Upload, Lightbulb } from 'lucide-react';
import { EXAMPLE_QUERIES } from '../utils/constants';

const QueryInput = ({ onSubmit, loading, onFileUpload }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSubmit(query.trim());
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset file input
    e.target.value = '';
  };

  const allSuggestions = [
    ...EXAMPLE_QUERIES.github,
    ...EXAMPLE_QUERIES.jira,
    ...EXAMPLE_QUERIES.document,
    ...EXAMPLE_QUERIES.general
  ];

  return (
    <div className="query-input-container">
      <form onSubmit={handleSubmit} className="query-form">
        <div className="input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me anything about your evidence... (e.g., 'Why was PR #456 merged?')"
            disabled={loading}
            className="query-input"
            onFocus={() => setShowSuggestions(true)}
          />

          <div className="input-actions">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="action-button upload-button"
              title="Upload Document"
              disabled={loading}
            >
              <Upload size={20} />
            </button>

            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="action-button suggestions-button"
              title="Show Examples"
            >
              <Lightbulb size={20} />
            </button>

            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="action-button submit-button"
              title="Send Query"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </form>

      {showSuggestions && (
        <div className="suggestions-dropdown">
          <div className="suggestions-header">
            <h4>Example Queries</h4>
            <button 
              onClick={() => setShowSuggestions(false)}
              className="close-button"
            >
              ×
            </button>
          </div>

          <div className="suggestions-grid">
            <div className="suggestion-category">
              <h5>🔧 GitHub</h5>
              {EXAMPLE_QUERIES.github.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="suggestion-category">
              <h5>🎫 JIRA</h5>
              {EXAMPLE_QUERIES.jira.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="suggestion-category">
              <h5>📄 Documents</h5>
              {EXAMPLE_QUERIES.document.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="suggestion-category">
              <h5>🔍 General</h5>
              {EXAMPLE_QUERIES.general.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryInput;
