const axios = require("axios");

module.exports = function (app) {

  const headers = {
    "User-Agent": "yasamDev",
    "Accept": "application/vnd.github+json"
  };

  async function searchRepo(q) {
    const { data } = await axios.get("https://api.github.com/search/repositories", {
      params: {
        q,
        per_page: 10
      },
      headers
    });

    return data.items.map(v => ({
      name: v.full_name,
      description: v.description,
      language: v.language,
      stars: v.stargazers_count,
      forks: v.forks_count,
      url: v.html_url
    }));
  }

  async function searchUser(q) {
    const { data } = await axios.get("https://api.github.com/search/users", {
      params: {
        q,
        per_page: 10
      },
      headers
    });

    return data.items.map(v => ({
      username: v.login,
      avatar: v.avatar_url,
      url: v.html_url,
      type: v.type
    }));
  }

  app.get("/tools/github-search", async (req, res) => {
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        creator: "yasamDev",
        error: "Parameter q wajib diisi"
      });
    }

    try {
      let result;

      if (type === "user") {
        result = await searchUser(q);
      } else {
        result = await searchRepo(q);
      }

      res.json({
        status: true,
        creator: "yasamDev",
        total: result.length,
        result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.response?.data?.message || err.message
      });
    }
  });

};