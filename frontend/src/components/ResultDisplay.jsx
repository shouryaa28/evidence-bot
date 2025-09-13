import React, { useState } from 'react';
import { 
  Download, 
  ExternalLink, 
  FileText, 
  GitPullRequest, 
  Ticket, 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Eye
} from 'lucide-react';
import { documentAPI } from '../services/api';

const ResultDisplay = ({ result }) => {
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleExport = async (format) => {
    if (!result.evidence?.data && !Array.isArray(result.evidence)) {
      alert('No data available for export');
      return;
    }

    setExporting(true);
    try {
      const data = result.evidence.data || result.evidence;
      let exportResult;

      if (format === 'csv') {
        exportResult = await documentAPI.exportToCSV(data, 'query_results');
      } else {
        exportResult = await documentAPI.exportToExcel(data, 'query_results');
      }

      // Create download link
      const downloadUrl = exportResult.downloadUrl || `/uploads/${exportResult.export.filename}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = exportResult.export.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderGitHubResult = (evidence) => {
    if (evidence.error) {
        return <ErrorMessage error={evidence.error} />;
    }

    console.log("Rendering GitHub evidence:", evidence); // Debug log

    // Handle use case results with count and prs properties
    if (evidence.count !== undefined && evidence.prs) {
        return (
            <div className="github-analysis">
                <div className="result-header">
                    <GitPullRequest className="w-6 h-6 text-purple-600" />
                    <h3>PRs Merged Without Approval</h3>
                    <span className="count-badge">{evidence.count} found</span>
                </div>
                
                {evidence.prs.length > 0 ? (
                    <div className="prs-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>PR ID</th>
                                    <th>Title</th>
                                    <th>Merged By</th>
                                    <th>Reviews</th>
                                    <th>Merged At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {evidence.prs.map((pr, i) => (
                                    <tr key={i}>
                                        <td>#{pr.pr_id}</td>
                                        <td>{pr.title}</td>
                                        <td>{pr.merged_by}</td>
                                        <td>{pr.reviews.length} reviews</td>
                                        <td>{formatDate(pr.merged_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>No PRs found that were merged without approval.</p>
                )}
            </div>
        );
    }

    // Handle other use case results (arrays with pr_id)
    if (Array.isArray(evidence) && evidence.length > 0 && evidence[0].pr_id) {
        return (
            <div className="github-analysis">
                <div className="result-header">
                    <GitPullRequest className="w-6 h-6 text-purple-600" />
                    <h3>Pull Request Analysis</h3>
                    <span className="count-badge">{evidence.length} found</span>
                </div>
                
                <div className="prs-table">
                    <table>
                        <thead>
                            <tr>
                                <th>PR ID</th>
                                <th>Title</th>
                                {evidence[0].reviewer && <th>Reviewer</th>}
                                {evidence[0].decision && <th>Decision</th>}
                                {evidence[0].waiting_time && <th>Waiting Time</th>}
                                {evidence[0].approvers && <th>Approvers</th>}
                                {evidence[0].merged_at && <th>Merged At</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {evidence.map((item, i) => (
                                <tr key={i}>
                                    <td>#{item.pr_id}</td>
                                    <td>{item.title}</td>
                                    {item.reviewer && <td>{item.reviewer}</td>}
                                    {item.decision && <td><span className={`review-state ${item.decision.toLowerCase()}`}>{item.decision}</span></td>}
                                    {item.waiting_time && <td>{item.waiting_time}</td>}
                                    {item.approvers && <td>{Array.isArray(item.approvers) ? item.approvers.join(', ') : item.approvers}</td>}
                                    {item.merged_at && <td>{formatDate(item.merged_at)}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Single PR (has number property)
    if (evidence.number) {
        return (
            <div className="github-pr">
                <div className="result-header">
                    <GitPullRequest className="w-6 h-6 text-purple-600" />
                    <h3>Pull Request #{evidence.number}</h3>
                    <span className={`status-badge ${evidence.state}`}>
                        {evidence.state}
                    </span>
                </div>
                
                <div className="pr-details">
                    <h4>{evidence.title}</h4>
                    <div className="pr-meta">
                        <span><User size={16} /> {evidence.user}</span>
                        <span><Calendar size={16} /> {formatDate(evidence.created_at)}</span>
                        {evidence.merged_at && <span>✅ Merged {formatDate(evidence.merged_at)}</span>}
                    </div>
                    
                    <div className="pr-stats">
                        <span className="stat">+{evidence.additions || 0} -{evidence.deletions || 0}</span>
                        <span className="stat">{evidence.changed_files || 0} files</span>
                        <span className="stat">{evidence.approvals || 0} approvals</span>
                    </div>
                    
                    {evidence.reviews && evidence.reviews.length > 0 && (
                        <div className="reviews">
                            <h5>Reviews</h5>
                            {evidence.reviews.map((review, i) => (
                                <div key={i} className={`review ${review.state.toLowerCase()}`}>
                                    <span className="reviewer">{review.user}</span>
                                    <span className={`review-state ${review.state.toLowerCase()}`}>
                                        {review.state === 'APPROVED' && <CheckCircle size={16} />}
                                        {review.state === 'CHANGES_REQUESTED' && <XCircle size={16} />}
                                        {review.state}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="external-link">
                        <ExternalLink size={16} />
                        View on GitHub
                    </a>
                </div>
            </div>
        );
    }

    // Multiple PRs array (normal PR objects with number property)
    if (Array.isArray(evidence) && evidence.length > 0 && evidence[0].number) {
        return (
            <div className="github-list">
                <div className="list-header">
                    <h3>{evidence.length} Pull Requests Found</h3>
                </div>
                {evidence.map((pr, i) => (
                    <div key={i} className="github-item">
                        <div className="pr-item">
                            <div className="pr-header">
                                <span className={`status-badge ${pr.state}`}>{pr.state}</span>
                                <h4>#{pr.number}: {pr.title}</h4>
                            </div>
                            <div className="pr-meta">
                                <span><User size={16} /> {pr.user}</span>
                                <span><Calendar size={16} /> {formatDate(pr.created_at)}</span>
                                {pr.merged && <span>✅ Merged</span>}
                                <span>{pr.approvals || 0} approvals</span>
                                {pr.reviews && <span>{pr.reviews.length} reviews</span>}
                            </div>
                            
                            {pr.reviews && pr.reviews.length > 0 && (
                                <div className="pr-reviews-summary">
                                    <strong>Reviews:</strong>
                                    {pr.reviews.slice(0, 3).map((review, j) => (
                                        <span key={j} className={`review-badge ${review.state.toLowerCase()}`}>
                                            {review.user}: {review.state}
                                        </span>
                                    ))}
                                    {pr.reviews.length > 3 && <span>+{pr.reviews.length - 3} more</span>}
                                </div>
                            )}
                            
                            <a href={pr.url} target="_blank" rel="noopener noreferrer" className="external-link">
                                <ExternalLink size={16} />
                                View PR
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Repository array
    if (Array.isArray(evidence) && evidence.length > 0 && evidence[0].full_name) {
        return (
            <div className="github-list">
                <div className="list-header">
                    <h3>{evidence.length} Repositories Found</h3>
                </div>
                {evidence.map((repo, i) => (
                    <div key={i} className="github-item">
                        <div className="repo-item">
                            <h4>{repo.full_name}</h4>
                            <p>{repo.description}</p>
                            <div className="repo-meta">
                                <span>⭐ {repo.stars}</span>
                                <span>🍴 {repo.forks}</span>
                                <span>{repo.language}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return <div>GitHub data received but format not recognized. Type: {typeof evidence}, Length: {Array.isArray(evidence) ? evidence.length : 'N/A'}</div>;
};

  
   

  const renderDocumentResult = (evidence) => {
    if (evidence.error) {
      return <ErrorMessage error={evidence.error} />;
    }

    return (
      <div className="document-result">
        <div className="result-header">
          <FileText className="w-6 h-6 text-green-600" />
          <h3>Document Analysis: {evidence.filename}</h3>
        </div>

        <div className="document-stats">
          <div className="stat-card">
            <span className="stat-number">{evidence.rowCount || 0}</span>
            <span className="stat-label">Rows</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{evidence.headers?.length || 0}</span>
            <span className="stat-label">Columns</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{Math.round((evidence.fileSize || 0) / 1024)} KB</span>
            <span className="stat-label">File Size</span>
          </div>
        </div>

        {evidence.headers && (
          <div className="headers-section">
            <h4>Columns</h4>
            <div className="headers-list">
              {evidence.headers.map((header, i) => (
                <span key={i} className="header-badge">{header}</span>
              ))}
            </div>
          </div>
        )}

        {evidence.analysis?.insights && (
          <div className="insights-section">
            <h4>Insights</h4>
            {evidence.analysis.insights.map((insight, i) => (
              <div key={i} className="insight-item">
                <AlertCircle size={16} />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}

        {evidence.data && evidence.data.length > 0 && (
          <div className="data-preview">
            <h4>Data Preview (First 5 rows)</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {evidence.headers.map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evidence.data.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {evidence.headers.map((header, j) => (
                        <td key={j}>{row[header] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ErrorMessage = ({ error }) => (
    <div className="error-message">
      <XCircle className="w-6 h-6 text-red-500" />
      <div>
        <h4>Error</h4>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="result-display">
      {/* Query Information */}
      <div className="query-info">
        <div className="query-text">
          <strong>Query:</strong> "{result.query}"
        </div>
        <div className="query-meta">
          <span>Type: {result.analysis?.queryType}</span>
          <span>Confidence: {Math.round((result.analysis?.confidence || 0) * 100)}%</span>
          <button
            onClick={() => copyToClipboard(result.query)}
            className="copy-button"
            title="Copy query"
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Evidence Results */}
      <div className="evidence-section">
        {result.analysis?.queryType === 'github' && renderGitHubResult(result.evidence)}
       
        {result.analysis?.queryType === 'document' && renderDocumentResult(result.evidence)}
        {result.analysis?.queryType === 'general' && (
          <div className="general-result">
            <h3>Multi-Source Results</h3>
            {result.evidence.github && (
              <div className="source-section">
                <h4>GitHub</h4>
                {renderGitHubResult(result.evidence.github)}
              </div>
            )}
            
            {result.evidence.documents && (
              <div className="source-section">
                <h4>Documents</h4>
                <div>Available files: {result.evidence.documents.available_files?.length || 0}</div>
              </div>
              
            )}
          </div>
        )}
      </div>

      {/* AI Summary */}
      {result.summary && (
        <div className="summary-section">
          <h4>AI Analysis</h4>
          <div className="summary-content">
            {result.summary.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      {(result.evidence?.data || Array.isArray(result.evidence)) && (
        <div className="export-section">
          <h4>Export Options</h4>
          <div className="export-buttons">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="export-button csv"
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="export-button excel"
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;