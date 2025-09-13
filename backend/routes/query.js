const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const githubService = require('../services/githubService');
const jiraService = require('../services/jiraService');
const documentService = require('../services/documentService');

/**
 * Main query endpoint - processes natural language queries
 */
router.post('/', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: 'Query is required and must be a string',
                example: { query: "Why was PR #456 merged without approval?" }
            });
        }

        // Analyze query with AI
        console.log(`Processing query: "${query}"`);
        const analysis = await aiService.analyzeQuery(query);
        console.log('Query analysis:', analysis);
        let evidence = {};
        let summary = '';

        // Route to appropriate service based on analysis
        switch (analysis.queryType) {
            case 'github':
                console.log("Handling GitHub query with params:", analysis);
                evidence = await handleGitHubQuery(analysis);
                break;
            case 'jira':
                evidence = await handleJiraQuery(analysis);
                break;
            case 'document':
                evidence = await handleDocumentQuery(analysis);
                break;
            case 'general':
                evidence = await handleGeneralQuery(analysis);
                break;
            default:
                evidence = { message: 'Query type not recognized', analysis };
        }

        // Generate AI summary
        summary = await aiService.generateSummary(evidence, analysis.intent);

        res.json({
            query: query,
            analysis: analysis,
            evidence: evidence,
            summary: summary,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Query processing error:', error);
        res.status(500).json({
            error: 'Failed to process query',
            message: error.message,
            query: req.body.query
        });
    }
});

/**
 * Handle GitHub-specific queries
 */
/**
 * Handle GitHub-specific queries - Updated with new use cases
 */
async function handleGitHubQuery(analysis) {
    const params = analysis.parameters;
    const query = analysis.intent.toLowerCase();
    
    try {
        // Use Case 1: PRs merged without approval
        if (query.includes('merged without approval') || query.includes('no approval')) {
            return await githubService.getPRsMergedWithoutApproval();
        }
        
        // Use Case 2: PRs reviewed by specific user
        if (query.includes('reviewed by') && params.user) {
            return await githubService.getPRsReviewedByUser(params.user);
        }
        
        // Use Case 3: PRs waiting for review
        if (query.includes('waiting for review') || query.includes('24 hours')) {
            return await githubService.getPRsWaitingForReview();
        }
        
        // Use Case 4: PRs merged in last week
        if (query.includes('last 7 days') || query.includes('last week')) {
            return await githubService.getPRsMergedLastWeek();
        }
        
        // Existing cases
        if (params.prNumber && params.repository) {
            const [owner, repo] = params.repository.split('/');
            return await githubService.getPullRequest(owner, repo, params.prNumber);
        } else if (params.prNumber) {
            return await githubService.getPullRequest("shambhavi-123", "sprinto-bot", params.prNumber);
        } else if (query.includes('pull request') || query.includes('last') && query.includes('pull')) {
            // Default: get pull requests
            return await githubService.getPullRequests();
        } else {
            // Default: get repositories
            return await githubService.getRepositories();
        }
    } catch (error) {
        return { error: error.message, queryType: 'github', parameters: params };
    }
}

/**
 * Handle JIRA-specific queries
 */
async function handleJiraQuery(analysis) {
    const params = analysis.parameters;

    try {
        if (params.issueKey) {
            return await jiraService.getIssue(params.issueKey);
        } else if (params.user) {
            return await jiraService.searchAccessIssues(params.user);
        } else {
            // Default search
            const jql = jiraService.generateJQL(params);
            return await jiraService.searchIssues(jql);
        }
    } catch (error) {
        return { error: error.message, queryType: 'jira', parameters: params };
    }
}

/**
 * Handle document-specific queries
 */
async function handleDocumentQuery(analysis) {
    try {
        const files = documentService.getAvailableFiles();

        if (files.length === 0) {
            return {
                message: 'No documents available for analysis',
                suggestion: 'Upload CSV or Excel files using the /api/documents/upload endpoint'
            };
        }

        // Analyze the most recent document
        const mostRecent = files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))[0];
        const analysisResult = await documentService.analyzeDocument(mostRecent.filename);

        // Handle export requests
        if (analysis.parameters.exportFormat) {
            let exportResult;
            if (analysis.parameters.exportFormat === 'excel') {
                exportResult = await documentService.exportToExcel(analysisResult.data, 'evidence_export');
            } else {
                exportResult = await documentService.exportToCSV(analysisResult.data, 'evidence_export');
            }
            analysisResult.export = exportResult;
        }

        return analysisResult;
    } catch (error) {
        return { error: error.message, queryType: 'document' };
    }
}

/**
 * Handle general queries requiring multiple sources
 */
async function handleGeneralQuery(analysis) {
    const results = {};

    try {
        // Try GitHub
        try {
            results.github = await githubService.getRepositories();
        } catch (error) {
            results.github = { error: error.message };
        }

        // Try JIRA
        try {
            results.jira = await jiraService.searchIssues('ORDER BY updated DESC', 10);
        } catch (error) {
            results.jira = { error: error.message };
        }

        // Try Documents
        try {
            const files = documentService.getAvailableFiles();
            results.documents = { available_files: files };
        } catch (error) {
            results.documents = { error: error.message };
        }

        return results;
    } catch (error) {
        return { error: error.message, queryType: 'general' };
    }
}

/**
 * Get query suggestions
 */
router.get('/suggestions', (req, res) => {
    res.json({
        suggestions: [
            {
                category: 'GitHub',
                examples: [
                    "Why was PR #456 merged without approval?",
                    "Show me the last 5 pull requests",
                    "List all open issues with high priority",
                    "Get details for pull request #123"
                ]
            },
            {
                category: 'JIRA',
                examples: [
                    "Show access given to Jane for Prod DB",
                    "List all tickets in TODO status",
                    "Find approval workflows for user access",
                    "Get issue ABC-123 details"
                ]
            },
            {
                category: 'Documents',
                examples: [
                    "Share the current count of laptops and export to CSV",
                    "Analyze the asset register",
                    "Process the uploaded invoice data",
                    "Show me document statistics"
                ]
            },
            {
                category: 'General',
                examples: [
                    "Show me all available evidence sources",
                    "What data is available for audit?",
                    "Give me a summary of recent activity"
                ]
            }
        ]
    });
});

module.exports = router;