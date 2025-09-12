const axios = require('axios');

class GitHubService {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.token = process.env.GITHUB_TOKEN;

        if (!this.token) {
            console.warn('⚠️  GITHUB_TOKEN not found. GitHub features will be limited.');
        }

        this.headers = this.token ? {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Evidence-Bot/1.0'
        } : {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Evidence-Bot/1.0'
        };
    }

    /**
     * Get user's repositories
     */
    async getRepositories() {
        try {
            const response = await axios.get(`${this.baseURL}/user/repos`, {
                headers: this.headers,
                params: {
                    sort: 'updated',
                    per_page: 100
                }
            });

            return response.data.map(repo => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                private: repo.private,
                updated_at: repo.updated_at,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count
            }));
        } catch (error) {
            console.error('GitHub API Error (repos):', error.message);
            throw new Error(`Failed to fetch repositories: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get pull requests for a repository
     */
    async getPullRequests(owner, repo, state = 'all') {
        try {
            const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/pulls`, {
                headers: this.headers,
                params: {
                    state: state,
                    sort: 'updated',
                    per_page: 50
                }
            });

            return response.data.map(pr => ({
                number: pr.number,
                title: pr.title,
                state: pr.state,
                user: pr.user.login,
                created_at: pr.created_at,
                updated_at: pr.updated_at,
                merged_at: pr.merged_at,
                base: pr.base.ref,
                head: pr.head.ref,
                url: pr.html_url,
                mergeable: pr.mergeable,
                merged: pr.merged,
                draft: pr.draft
            }));
        } catch (error) {
            console.error('GitHub API Error (PRs):', error.message);
            throw new Error(`Failed to fetch pull requests: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get specific pull request details
     */
    async getPullRequest(owner, repo, prNumber) {
        try {
            const [prResponse, reviewsResponse] = await Promise.all([
                axios.get(`${this.baseURL}/repos/${owner}/${repo}/pulls/${prNumber}`, {
                    headers: this.headers
                }),
                axios.get(`${this.baseURL}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
                    headers: this.headers
                })
            ]);

            const pr = prResponse.data;
            const reviews = reviewsResponse.data;

            return {
                number: pr.number,
                title: pr.title,
                body: pr.body,
                state: pr.state,
                user: pr.user.login,
                created_at: pr.created_at,
                updated_at: pr.updated_at,
                merged_at: pr.merged_at,
                closed_at: pr.closed_at,
                base: pr.base.ref,
                head: pr.head.ref,
                url: pr.html_url,
                mergeable: pr.mergeable,
                merged: pr.merged,
                draft: pr.draft,
                additions: pr.additions,
                deletions: pr.deletions,
                changed_files: pr.changed_files,
                reviews: reviews.map(review => ({
                    id: review.id,
                    user: review.user.login,
                    state: review.state,
                    submitted_at: review.submitted_at,
                    body: review.body
                })),
                approvals: reviews.filter(r => r.state === 'APPROVED').length,
                request_changes: reviews.filter(r => r.state === 'CHANGES_REQUESTED').length
            };
        } catch (error) {
            console.error('GitHub API Error (PR details):', error.message);
            throw new Error(`Failed to fetch pull request: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get repository issues
     */
    async getIssues(owner, repo, state = 'all') {
        try {
            const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/issues`, {
                headers: this.headers,
                params: {
                    state: state,
                    sort: 'updated',
                    per_page: 50
                }
            });

            return response.data
                .filter(issue => !issue.pull_request) // Filter out PRs
                .map(issue => ({
                    number: issue.number,
                    title: issue.title,
                    body: issue.body,
                    state: issue.state,
                    user: issue.user.login,
                    assignees: issue.assignees.map(a => a.login),
                    labels: issue.labels.map(l => l.name),
                    created_at: issue.created_at,
                    updated_at: issue.updated_at,
                    closed_at: issue.closed_at,
                    url: issue.html_url
                }));
        } catch (error) {
            console.error('GitHub API Error (issues):', error.message);
            throw new Error(`Failed to fetch issues: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Search repositories
     */
    async searchRepositories(query) {
        try {
            const response = await axios.get(`${this.baseURL}/search/repositories`, {
                headers: this.headers,
                params: {
                    q: query,
                    sort: 'stars',
                    per_page: 20
                }
            });

            return {
                total_count: response.data.total_count,
                repositories: response.data.items.map(repo => ({
                    id: repo.id,
                    name: repo.name,
                    full_name: repo.full_name,
                    description: repo.description,
                    private: repo.private,
                    language: repo.language,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    updated_at: repo.updated_at
                }))
            };
        } catch (error) {
            console.error('GitHub API Error (search):', error.message);
            throw new Error(`Failed to search repositories: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get rate limit information
     */
    async getRateLimit() {
        try {
            const response = await axios.get(`${this.baseURL}/rate_limit`, {
                headers: this.headers
            });

            return response.data;
        } catch (error) {
            console.error('GitHub API Error (rate limit):', error.message);
            return null;
        }
    }
}

module.exports = new GitHubService();
