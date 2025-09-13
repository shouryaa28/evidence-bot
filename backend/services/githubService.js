const axios = require('axios');
require('dotenv').config();

class GitHubService {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.token = process.env.GITHUB_TOKEN;
        
        if (!this.token) {
            console.warn('⚠️  GITHUB_TOKEN not found. GitHub features will be limited.');
        }
        
        this.headers = this.token ? {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Evidence-Bot/1.0'
        } : {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Evidence-Bot/1.0'
        };
    }

    /**
     * Get user's repositories - Fixed to return array format
     */
    async getRepositories() {
        try {
            // Get specific repo since you're working with sprinto-bot
            const response = await axios.get(`${this.baseURL}/repos/shambhavi-123/sprinto-bot`, {
                headers: this.headers
            });
            
            const repo = response.data;
            
            // Return as array to match expected format
            return [{
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                private: repo.private,
                updated_at: repo.updated_at,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count
            }];
        } catch (error) {
            console.error('GitHub API Error (repos):', error.message);
            throw new Error(`Failed to fetch repositories: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get pull requests for a repository - Fixed format
     */
    // async getPullRequests(owner = "shambhavi-123", repo = "sprinto-bot", state = "all") {
    //     try {
    //         const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/pulls`, {
    //             headers: this.headers,
    //             params: {
    //                 state: state,
    //                 sort: "updated",
    //                 direction: "desc",
    //                 per_page: 50
    //             }
    //         });

    //         const prs = response.data;
    //         console.log("Fetched PRs:", prs.length);

    //         // Get reviews for each PR
    //         const prsWithReviews = await Promise.all(
    //             prs.map(async (pr) => {
    //                 try {
    //                     const reviewsResponse = await axios.get(
    //                         `${this.baseURL}/repos/${owner}/${repo}/pulls/${pr.number}/reviews`,
    //                         { headers: this.headers }
    //                     );
    //                     const reviews = reviewsResponse.data;

    //                     return {
    //                         number: pr.number,
    //                         title: pr.title,
    //                         state: pr.state,
    //                         user: pr.user?.login || "unknown",
    //                         created_at: pr.created_at,
    //                         updated_at: pr.updated_at,
    //                         merged_at: pr.merged_at,
    //                         url: pr.html_url,
    //                         base: pr.base?.ref,
    //                         head: pr.head?.ref,
    //                         draft: pr.draft,
    //                         merged: pr.merged || false,
    //                         reviews: reviews.map(review => ({
    //                             id: review.id,
    //                             user: review.user.login,
    //                             state: review.state,
    //                             submitted_at: review.submitted_at,
    //                             body: review.body
    //                         })),
    //                         approvals: reviews.filter(r => r.state === "APPROVED").length,
    //                         request_changes: reviews.filter(r => r.state === "CHANGES_REQUESTED").length
    //                     };
    //                 } catch (reviewError) {
    //                     console.warn(`Could not fetch reviews for PR ${pr.number}:`, reviewError.message);
    //                     return {
    //                         number: pr.number,
    //                         title: pr.title,
    //                         state: pr.state,
    //                         user: pr.user?.login || "unknown",
    //                         created_at: pr.created_at,
    //                         updated_at: pr.updated_at,
    //                         merged_at: pr.merged_at,
    //                         url: pr.html_url,
    //                         base: pr.base?.ref,
    //                         head: pr.head?.ref,
    //                         draft: pr.draft,
    //                         merged: pr.merged || false,
    //                         reviews: [],
    //                         approvals: 0,
    //                         request_changes: 0
    //                     };
    //                 }
    //             })
    //         );

    //         return prsWithReviews;
    //     } catch (error) {
    //         console.error("GitHub API Error (PRs):", error.message);
    //         throw new Error(`Failed to fetch pull requests: ${error.response?.data?.message || error.message}`);
    //     }
    // }
    /**
 * Get pull requests for a repository - Fixed format with limit support
 */
async getPullRequests(owner = "shambhavi-123", repo = "sprinto-bot", state = "all", limit = 50) {
    try {
        const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/pulls`, {
            headers: this.headers,
            params: {
                state: state,
                sort: "updated",
                direction: "desc",
                per_page: Math.min(limit, 100) // GitHub API max is 100
            }
        });

        const prs = response.data;
        console.log(`Fetched ${prs.length} PRs (requested: ${limit})`);

        // Get reviews for each PR
        const prsWithReviews = await Promise.all(
            prs.slice(0, limit).map(async (pr) => { // Ensure we don't exceed the requested limit
                try {
                    const reviewsResponse = await axios.get(
                        `${this.baseURL}/repos/${owner}/${repo}/pulls/${pr.number}/reviews`,
                        { headers: this.headers }
                    );
                    const reviews = reviewsResponse.data;

                    return {
                        number: pr.number,
                        title: pr.title,
                        state: pr.state,
                        user: pr.user?.login || "unknown",
                        created_at: pr.created_at,
                        updated_at: pr.updated_at,
                        merged_at: pr.merged_at,
                        url: pr.html_url,
                        base: pr.base?.ref,
                        head: pr.head?.ref,
                        draft: pr.draft,
                        merged: pr.merged || false,
                        reviews: reviews.map(review => ({
                            id: review.id,
                            user: review.user.login,
                            state: review.state,
                            submitted_at: review.submitted_at,
                            body: review.body
                        })),
                        approvals: reviews.filter(r => r.state === "APPROVED").length,
                        request_changes: reviews.filter(r => r.state === "CHANGES_REQUESTED").length
                    };
                } catch (reviewError) {
                    console.warn(`Could not fetch reviews for PR ${pr.number}:`, reviewError.message);
                    return {
                        number: pr.number,
                        title: pr.title,
                        state: pr.state,
                        user: pr.user?.login || "unknown",
                        created_at: pr.created_at,
                        updated_at: pr.updated_at,
                        merged_at: pr.merged_at,
                        url: pr.html_url,
                        base: pr.base?.ref,
                        head: pr.head?.ref,
                        draft: pr.draft,
                        merged: pr.merged || false,
                        reviews: [],
                        approvals: 0,
                        request_changes: 0
                    };
                }
            })
        );

        return prsWithReviews;
    } catch (error) {
        console.error("GitHub API Error (PRs):", error.message);
        throw new Error(`Failed to fetch pull requests: ${error.response?.data?.message || error.message}`);
    }
}

    /**
     * Use Case 1: Get PRs merged without approval
     */
    async getPRsMergedWithoutApproval(owner = "shambhavi-123", repo = "sprinto-bot") {
        try {
            const prs = await this.getPullRequests(owner, repo, "closed");
            const mergedPRsWithoutApproval = prs.filter(pr => 
                pr.merged && pr.approvals === 0
            );

            return {
                count: mergedPRsWithoutApproval.length,
                prs: mergedPRsWithoutApproval.map(pr => ({
                    pr_id: pr.number,
                    title: pr.title,
                    merged_by: pr.user,
                    reviews: pr.reviews,
                    merged_at: pr.merged_at,
                    url: pr.url
                }))
            };
        } catch (error) {
            throw new Error(`Failed to get PRs merged without approval: ${error.message}`);
        }
    }

    /**
     * Use Case 2: Get PRs reviewed by specific user
     */
    async getPRsReviewedByUser(reviewer, owner = "shambhavi-123", repo = "sprinto-bot") {
        try {
            const prs = await this.getPullRequests(owner, repo, "all");
            const reviewedPRs = prs.filter(pr => 
                pr.reviews.some(review => review.user.toLowerCase() === reviewer.toLowerCase())
            ).map(pr => {
                const userReviews = pr.reviews.filter(review => 
                    review.user.toLowerCase() === reviewer.toLowerCase()
                );
                const latestReview = userReviews[userReviews.length - 1];

                return {
                    pr_id: pr.number,
                    title: pr.title,
                    reviewer: reviewer,
                    decision: latestReview.state,
                    date: latestReview.submitted_at,
                    url: pr.url
                };
            });

            return reviewedPRs;
        } catch (error) {
            throw new Error(`Failed to get PRs reviewed by ${reviewer}: ${error.message}`);
        }
    }

    /**
     * Use Case 3: Get PRs waiting for review > 24 hours
     */
    async getPRsWaitingForReview(owner = "shambhavi-123", repo = "sprinto-bot") {
        try {
            const prs = await this.getPullRequests(owner, repo, "open");
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const waitingPRs = prs.filter(pr => {
                const createdAt = new Date(pr.created_at);
                return createdAt < twentyFourHoursAgo && pr.reviews.length === 0;
            }).map(pr => {
                const createdAt = new Date(pr.created_at);
                const waitingTime = Math.floor((now - createdAt) / (1000 * 60 * 60)); // hours

                return {
                    pr_id: pr.number,
                    title: pr.title,
                    created_at: pr.created_at,
                    review_requested: pr.reviews.length === 0 ? "No" : "Yes",
                    waiting_time: `${waitingTime} hours`,
                    url: pr.url
                };
            });

            return waitingPRs;
        } catch (error) {
            throw new Error(`Failed to get PRs waiting for review: ${error.message}`);
        }
    }

    /**
     * Use Case 4: Get PRs merged in last 7 days with approvers
     */
    async getPRsMergedLastWeek(owner = "shambhavi-123", repo = "sprinto-bot") {
        try {
            const prs = await this.getPullRequests(owner, repo, "closed");
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const recentMergedPRs = prs.filter(pr => {
                if (!pr.merged || !pr.merged_at) return false;
                const mergedAt = new Date(pr.merged_at);
                return mergedAt >= weekAgo;
            }).map(pr => {
                const approvers = pr.reviews
                    .filter(review => review.state === "APPROVED")
                    .map(review => review.user);

                return {
                    pr_id: pr.number,
                    title: pr.title,
                    merged_at: pr.merged_at,
                    approvers: approvers.length > 0 ? approvers : ["No approvers"],
                    url: pr.url
                };
            });

            return recentMergedPRs;
        } catch (error) {
            throw new Error(`Failed to get PRs merged in last week: ${error.message}`);
        }
    }

    // Keep your existing getPullRequest method but ensure it returns proper format
    async getPullRequest(owner = "shambhavi-123", repo = "sprinto-bot", prNumber) {
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
                approvals: reviews.filter(r => r.state === "APPROVED").length,
                request_changes: reviews.filter(r => r.state === "CHANGES_REQUESTED").length
            };
        } catch (error) {
            console.error("GitHub API Error (PR details):", error.message);
            throw new Error(`Failed to fetch pull request: ${error.response?.data?.message || error.message}`);
        }
    }

    // Keep existing methods
    async getIssues(owner, repo, state = 'all') {
        // Your existing implementation
    }

    async searchRepositories(query) {
        // Your existing implementation  
    }

    async getRateLimit() {
        // Your existing implementation
    }
}

module.exports = new GitHubService();