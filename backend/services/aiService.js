const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️  GEMINI_API_KEY not found. AI features will be limited.');
            this.genAI = null;
            return;
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    /**
     * Analyze user query and determine intent and parameters
     */
    async analyzeQuery(userQuery) {
        if (!this.genAI) {
            return this.fallbackAnalysis(userQuery);
        }

        try {
            const prompt = `
Analyze this user query for an evidence gathering system and provide a structured response:

User Query: "${userQuery}"

Please determine:
1. Query Type: github, jira, document, or general
2. Intent: What is the user trying to find?
3. Parameters: Extract relevant identifiers (PR numbers, issue keys, file names, etc.)
4. Source: Which system should be queried?
5. Action: What specific action should be taken?

Respond in JSON format:
{
    "queryType": "github|jira|document|general",
    "intent": "brief description",
    "parameters": {
        "prNumber": "if mentioned",
        "issueKey": "if mentioned",
        "repository": "if mentioned",
        "fileName": "if mentioned",
        "user": "if mentioned",
        "dateRange": "if mentioned"
    },
    "source": "specific system to query",
    "action": "specific action to perform",
    "confidence": 0.95
}
            `;

            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Try to parse JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                return this.fallbackAnalysis(userQuery);
            }
        } catch (error) {
            console.error('AI Analysis Error:', error.message);
            return this.fallbackAnalysis(userQuery);
        }
    }

    /**
     * Fallback analysis without AI
     */
    fallbackAnalysis(userQuery) {
        const query = userQuery.toLowerCase();

        // Simple keyword matching
        if (query.includes('pr') || query.includes('pull request') || query.includes('github') || query.includes('merge')) {
            return {
                queryType: 'github',
                intent: 'Query GitHub repository information',
                parameters: this.extractGitHubParams(query),
                source: 'github',
                action: 'fetch_github_data',
                confidence: 0.7
            };
        } else if (query.includes('jira') || query.includes('ticket') || query.includes('issue') || query.includes('access')) {
            return {
                queryType: 'jira',
                intent: 'Query JIRA ticket information',
                parameters: this.extractJiraParams(query),
                source: 'jira',
                action: 'fetch_jira_data',
                confidence: 0.7
            };
        } else if (query.includes('csv') || query.includes('excel') || query.includes('file') || query.includes('document')) {
            return {
                queryType: 'document',
                intent: 'Analyze document data',
                parameters: this.extractDocumentParams(query),
                source: 'document',
                action: 'analyze_document',
                confidence: 0.8
            };
        } else {
            return {
                queryType: 'general',
                intent: 'General query requiring multiple sources',
                parameters: {},
                source: 'multiple',
                action: 'multi_source_search',
                confidence: 0.5
            };
        }
    }

    /**
     * Extract GitHub-specific parameters
     */
    extractGitHubParams(query) {
        const params = {};

        // Extract PR number
        const prMatch = query.match(/pr[\s#]*([0-9]+)|pull request[\s#]*([0-9]+)/i);
        if (prMatch) {
            params.prNumber = prMatch[1] || prMatch[2];
        }

        // Extract repository name
        const repoMatch = query.match(/repo[\s:]*([\w-]+\/[\w-]+)|repository[\s:]*([\w-]+\/[\w-]+)/i);
        if (repoMatch) {
            params.repository = repoMatch[1] || repoMatch[2];
        }

        return params;
    }

    /**
     * Extract JIRA-specific parameters
     */
    extractJiraParams(query) {
        const params = {};

        // Extract issue key
        const issueMatch = query.match(/([A-Z]+)-([0-9]+)/);
        if (issueMatch) {
            params.issueKey = issueMatch[0];
        }

        // Extract user name
        const userMatch = query.match(/user[\s:]*([\w]+)|access[\s\w]*to[\s]*([\w]+)/i);
        if (userMatch) {
            params.user = userMatch[1] || userMatch[2];
        }

        return params;
    }

    /**
     * Extract document-specific parameters
     */
    extractDocumentParams(query) {
        const params = {};

        // Extract file type
        if (query.includes('csv')) params.fileType = 'csv';
        if (query.includes('excel') || query.includes('xlsx')) params.fileType = 'excel';

        // Extract export format
        if (query.includes('export')) {
            if (query.includes('csv')) params.exportFormat = 'csv';
            if (query.includes('excel') || query.includes('xlsx')) params.exportFormat = 'excel';
        }

        return params;
    }

    /**
     * Generate a summary of the results
     */
    async generateSummary(data, queryIntent) {
        if (!this.genAI) {
            return this.fallbackSummary(data, queryIntent);
        }

        try {
            const prompt = `
Generate a concise summary for audit evidence based on this data:

Query Intent: ${queryIntent}
Data: ${JSON.stringify(data, null, 2)}

Please provide:
1. A brief summary of findings
2. Key evidence points
3. Any potential compliance concerns
4. Recommendations if applicable

Format as a professional audit summary.
            `;

            const result = await this.model.generateContent(prompt);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error('Summary Generation Error:', error.message);
            return this.fallbackSummary(data, queryIntent);
        }
    }

    /**
     * Fallback summary without AI
     */
    fallbackSummary(data, queryIntent) {
        if (Array.isArray(data)) {
            return `Found ${data.length} items matching your query: "${queryIntent}". Data has been retrieved and is ready for export.`;
        } else if (typeof data === 'object') {
            const keys = Object.keys(data);
            return `Retrieved evidence with ${keys.length} data points: ${keys.join(', ')}. Query: "${queryIntent}"`;
        } else {
            return `Evidence retrieved for query: "${queryIntent}". Data is available for review.`;
        }
    }
}

module.exports = new AIService();
