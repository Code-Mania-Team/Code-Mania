import Search from "../../models/search.js";

class SearchController {

    constructor() {
        this.search = new Search();
    }

    async searchAll(req, res) {

        try {

            const { query } = req.query;

            if (!query || query.trim() === "") {
                return res.send({
                    success: false,
                    message: "Search query is required"
                });
            }

            let postsResult = [];
            let usersResult = [];

            const hashtagRegex = /^#(\w+)/;

            // HASHTAG SEARCH
            if (hashtagRegex.test(query)) {

                const searchTerm = query.match(hashtagRegex)[1];

                postsResult = await this.search.searchPostsWithHashtags(searchTerm);

            } 
            // NORMAL SEARCH
            else {

                usersResult = await this.search.searchUsers(query);

                postsResult = await this.search.searchPosts(query);

            }

            res.send({
                success: true,
                data: {
                    users: usersResult || [],
                    posts: postsResult || []
                }
            });

        } catch (err) {

            console.error("<error> SearchController.searchAll", err);

            res.status(500).send({
                success: false,
                message: err.message
            });

        }
    }
}

export default SearchController;