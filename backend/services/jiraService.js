const axios = require('axios');

class JiraService {
    constructor() {
        this.baseURL = process.env.JIRA_URL;
        this.email = process.env.JIRA_EMAIL;
        this.apiToken = process.env.JIRA_API_TOKEN;

        if (!this.baseURL || !this.email || !this.apiToken) {
            console.warn('⚠️  JIRA credentials not found. JIRA features will be limited.');
            this.configured = false;
            return;
        }

        this.configured = true;
        this.auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
        this.headers = {
            'Authorization': `Basic ${this.auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    /**
     * Test JIRA connection
     */
    async testConnection() {
        if (!this.configured) {
            throw new Error('JIRA not configured. Please set JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN in .env');
        }

        try {
            const response = await axios.get(`${this.baseURL}/rest/api/3/myself`, {
                headers: this.headers,
                timeout: 10000
            });

            return {
                connected: true,
                user: response.data.displayName,
                accountId: response.data.accountId,
                emailAddress: response.data.emailAddress
            };
        } catch (error) {
            console.error('JIRA Connection Error:', error.message);
            throw new Error(`JIRA connection failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Search for issues using JQL
     */
    async searchIssues(jql = '', maxResults = 50) {
        if (!this.configured) {
            throw new Error('JIRA not configured');
        }

        try {
            const response = await axios.post(`${this.baseURL}/rest/api/3/search`, {
                jql: jql,
                maxResults: maxResults,
                fields: [
                    'summary',
                    'status',
                    'assignee',
                    'reporter',
                    'created',
                    'updated',
                    'priority',
                    'issuetype',
                    'project',
                    'description',
                    'comment'
                ]
            }, {
                headers: this.headers
            });

            return {
                total: response.data.total,
                issues: response.data.issues.map(issue => ({
                    key: issue.key,
                    id: issue.id,
                    summary: issue.fields.summary,
                    description: issue.fields.description,
                    status: issue.fields.status?.name,
                    statusCategory: issue.fields.status?.statusCategory?.name,
                    priority: issue.fields.priority?.name,
                    issueType: issue.fields.issuetype?.name,
                    project: issue.fields.project?.key,
                    assignee: issue.fields.assignee?.displayName,
                    reporter: issue.fields.reporter?.displayName,
                    created: issue.fields.created,
                    updated: issue.fields.updated,
                    url: `${this.baseURL}/browse/${issue.key}`
                }))
            };
        } catch (error) {
            console.error('JIRA Search Error:', error.message);
            throw new Error(`Failed to search JIRA issues: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }

    /**
     * Get specific issue
     */
    async getIssue(issueKey) {
        if (!this.configured) {
            throw new Error('JIRA not configured');
        }

        try {
            const response = await axios.get(`${this.baseURL}/rest/api/3/issue/${issueKey}`, {
                headers: this.headers,
                params: {
                    expand: 'changelog,transitions'
                }
            });

            const issue = response.data;

            return {
                key: issue.key,
                id: issue.id,
                summary: issue.fields.summary,
                description: issue.fields.description,
                status: issue.fields.status?.name,
                statusCategory: issue.fields.status?.statusCategory?.name,
                priority: issue.fields.priority?.name,
                issueType: issue.fields.issuetype?.name,
                project: {
                    key: issue.fields.project?.key,
                    name: issue.fields.project?.name
                },
                assignee: issue.fields.assignee ? {
                    displayName: issue.fields.assignee.displayName,
                    emailAddress: issue.fields.assignee.emailAddress,
                    accountId: issue.fields.assignee.accountId
                } : null,
                reporter: issue.fields.reporter ? {
                    displayName: issue.fields.reporter.displayName,
                    emailAddress: issue.fields.reporter.emailAddress,
                    accountId: issue.fields.reporter.accountId
                } : null,
                created: issue.fields.created,
                updated: issue.fields.updated,
                url: `${this.baseURL}/browse/${issue.key}`,
                changelog: issue.changelog?.histories?.map(history => ({
                    created: history.created,
                    author: history.author?.displayName,
                    items: history.items?.map(item => ({
                        field: item.field,
                        fieldtype: item.fieldtype,
                        from: item.fromString,
                        to: item.toString
                    }))
                })) || []
            };
        } catch (error) {
            console.error('JIRA Get Issue Error:', error.message);
            throw new Error(`Failed to get JIRA issue: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }

    /**
     * Get projects
     */
    async getProjects() {
        if (!this.configured) {
            throw new Error('JIRA not configured');
        }

        try {
            const response = await axios.get(`${this.baseURL}/rest/api/3/project`, {
                headers: this.headers
            });

            return response.data.map(project => ({
                id: project.id,
                key: project.key,
                name: project.name,
                projectTypeKey: project.projectTypeKey,
                lead: project.lead?.displayName,
                url: project.self
            }));
        } catch (error) {
            console.error('JIRA Projects Error:', error.message);
            throw new Error(`Failed to get JIRA projects: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }

    /**
     * Search for access-related issues
     */
    async searchAccessIssues(username) {
        const jql = `text ~ "${username}" OR text ~ "access" AND text ~ "${username}" ORDER BY updated DESC`;
        return this.searchIssues(jql, 20);
    }

    /**
     * Get workflow transitions for an issue
     */
    async getTransitions(issueKey) {
        if (!this.configured) {
            throw new Error('JIRA not configured');
        }

        try {
            const response = await axios.get(`${this.baseURL}/rest/api/3/issue/${issueKey}/transitions`, {
                headers: this.headers
            });

            return response.data.transitions.map(transition => ({
                id: transition.id,
                name: transition.name,
                to: transition.to?.name,
                hasScreen: transition.hasScreen
            }));
        } catch (error) {
            console.error('JIRA Transitions Error:', error.message);
            throw new Error(`Failed to get transitions: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }

    /**
     * Get issue comments
     */
    async getComments(issueKey) {
        if (!this.configured) {
            throw new Error('JIRA not configured');
        }

        try {
            const response = await axios.get(`${this.baseURL}/rest/api/3/issue/${issueKey}/comment`, {
                headers: this.headers
            });

            return response.data.comments.map(comment => ({
                id: comment.id,
                author: comment.author?.displayName,
                body: comment.body,
                created: comment.created,
                updated: comment.updated
            }));
        } catch (error) {
            console.error('JIRA Comments Error:', error.message);
            throw new Error(`Failed to get comments: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }

    /**
     * Generate JQL based on query parameters
     */
    generateJQL(params) {
        const conditions = [];

        if (params.project) {
            conditions.push(`project = "${params.project}"`);
        }

        if (params.status) {
            conditions.push(`status = "${params.status}"`);
        }

        if (params.assignee) {
            conditions.push(`assignee = "${params.assignee}"`);
        }

        if (params.user) {
            conditions.push(`(text ~ "${params.user}" OR assignee = "${params.user}" OR reporter = "${params.user}")`);
        }

        if (params.text) {
            conditions.push(`text ~ "${params.text}"`);
        }

        if (conditions.length === 0) {
            return 'ORDER BY updated DESC';
        }

        return conditions.join(' AND ') + ' ORDER BY updated DESC';
    }
}

module.exports = new JiraService();
