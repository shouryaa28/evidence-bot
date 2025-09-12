const express = require('express');
const router = express.Router();
const githubService = require('../services/githubService');

/**
 * Get user's repositories
 */
router.get('/repos', async (req, res) => {
    try {
        const repos = await githubService.getRepositories();
        res.json({
            count: repos.length,
            repositories: repos
        });
    } catch (error) {
        console.error('GitHub repos error:', error);
        res.status(500).json({
            error: 'Failed to fetch repositories',
            message: error.message
        });
    }
});

/**
 * Get pull requests for a repository
 */
router.get('/repos/:owner/:repo/pulls', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { state = 'all' } = req.query;

        const prs = await githubService.getPullRequests(owner, repo, state);
        res.json({
            repository: `${owner}/${repo}`,
            state: state,
            count: prs.length,
            pullRequests: prs
        });
    } catch (error) {
        console.error('GitHub PRs error:', error);
        res.status(500).json({
            error: 'Failed to fetch pull requests',
            message: error.message
        });
    }
});

/**
 * Get specific pull request
 */
router.get('/repos/:owner/:repo/pulls/:prNumber', async (req, res) => {
    try {
        const { owner, repo, prNumber } = req.params;

        const pr = await githubService.getPullRequest(owner, repo, prNumber);
        res.json(pr);
    } catch (error) {
        console.error('GitHub PR details error:', error);
        res.status(500).json({
            error: 'Failed to fetch pull request details',
            message: error.message
        });
    }
});

/**
 * Get issues for a repository
 */
router.get('/repos/:owner/:repo/issues', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { state = 'all' } = req.query;

        const issues = await githubService.getIssues(owner, repo, state);
        res.json({
            repository: `${owner}/${repo}`,
            state: state,
            count: issues.length,
            issues: issues
        });
    } catch (error) {
        console.error('GitHub issues error:', error);
        res.status(500).json({
            error: 'Failed to fetch issues',
            message: error.message
        });
    }
});

/**
 * Search repositories
 */
router.get('/search/repos', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                error: 'Search query is required',
                parameter: 'q'
            });
        }

        const results = await githubService.searchRepositories(q);
        res.json(results);
    } catch (error) {
        console.error('GitHub search error:', error);
        res.status(500).json({
            error: 'Failed to search repositories',
            message: error.message
        });
    }
});

/**
 * Get rate limit information
 */
router.get('/rate-limit', async (req, res) => {
    try {
        const rateLimit = await githubService.getRateLimit();
        res.json(rateLimit);
    } catch (error) {
        console.error('GitHub rate limit error:', error);
        res.status(500).json({
            error: 'Failed to get rate limit information',
            message: error.message
        });
    }
});

/**
 * Health check for GitHub integration
 */
router.get('/health', async (req, res) => {
    try {
        const rateLimit = await githubService.getRateLimit();
        res.json({
            status: 'healthy',
            authenticated: !!process.env.GITHUB_TOKEN,
            rateLimit: rateLimit ? {
                remaining: rateLimit.rate.remaining,
                limit: rateLimit.rate.limit,
                reset: new Date(rateLimit.rate.reset * 1000).toISOString()
            } : null
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            authenticated: !!process.env.GITHUB_TOKEN
        });
    }
});

module.exports = router;
