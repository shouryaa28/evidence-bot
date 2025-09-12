const express = require('express');
const router = express.Router();
const jiraService = require('../services/jiraService');

/**
 * Test JIRA connection
 */
router.get('/health', async (req, res) => {
    try {
        const connection = await jiraService.testConnection();
        res.json({
            status: 'healthy',
            ...connection
        });
    } catch (error) {
        console.error('JIRA health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            configured: !!process.env.JIRA_URL
        });
    }
});

/**
 * Search issues with JQL
 */
router.get('/search', async (req, res) => {
    try {
        const { jql = '', maxResults = 50 } = req.query;

        const results = await jiraService.searchIssues(jql, parseInt(maxResults));
        res.json(results);
    } catch (error) {
        console.error('JIRA search error:', error);
        res.status(500).json({
            error: 'Failed to search JIRA issues',
            message: error.message
        });
    }
});

/**
 * Get specific issue
 */
router.get('/issue/:key', async (req, res) => {
    try {
        const { key } = req.params;

        const issue = await jiraService.getIssue(key);
        res.json(issue);
    } catch (error) {
        console.error('JIRA issue error:', error);
        res.status(500).json({
            error: 'Failed to fetch JIRA issue',
            message: error.message
        });
    }
});

/**
 * Get all projects
 */
router.get('/projects', async (req, res) => {
    try {
        const projects = await jiraService.getProjects();
        res.json({
            count: projects.length,
            projects: projects
        });
    } catch (error) {
        console.error('JIRA projects error:', error);
        res.status(500).json({
            error: 'Failed to fetch JIRA projects',
            message: error.message
        });
    }
});

/**
 * Search for access-related issues
 */
router.get('/access/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const results = await jiraService.searchAccessIssues(username);
        res.json({
            username: username,
            ...results
        });
    } catch (error) {
        console.error('JIRA access search error:', error);
        res.status(500).json({
            error: 'Failed to search access issues',
            message: error.message
        });
    }
});

/**
 * Get issue transitions
 */
router.get('/issue/:key/transitions', async (req, res) => {
    try {
        const { key } = req.params;

        const transitions = await jiraService.getTransitions(key);
        res.json({
            issueKey: key,
            transitions: transitions
        });
    } catch (error) {
        console.error('JIRA transitions error:', error);
        res.status(500).json({
            error: 'Failed to fetch issue transitions',
            message: error.message
        });
    }
});

/**
 * Get issue comments
 */
router.get('/issue/:key/comments', async (req, res) => {
    try {
        const { key } = req.params;

        const comments = await jiraService.getComments(key);
        res.json({
            issueKey: key,
            count: comments.length,
            comments: comments
        });
    } catch (error) {
        console.error('JIRA comments error:', error);
        res.status(500).json({
            error: 'Failed to fetch issue comments',
            message: error.message
        });
    }
});

/**
 * Get recent issues (default search)
 */
router.get('/issues', async (req, res) => {
    try {
        const { 
            project, 
            status, 
            assignee, 
            maxResults = 20 
        } = req.query;

        const jql = jiraService.generateJQL({
            project,
            status,
            assignee
        });

        const results = await jiraService.searchIssues(jql, parseInt(maxResults));
        res.json(results);
    } catch (error) {
        console.error('JIRA issues error:', error);
        res.status(500).json({
            error: 'Failed to fetch JIRA issues',
            message: error.message
        });
    }
});

module.exports = router;
