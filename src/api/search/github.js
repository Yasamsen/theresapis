const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  async function searchRepo(query) {
    const { data } = await axios.get(
      "https://github.com/search?q=" + encodeURIComponent(query) + "&type=repositories",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const $ = cheerio.load(data);
    let hasil = [];

    $("li.repo-list-item").each((i, el) => {
      const name = $(el).find("a.v-align-middle").text().trim();
      const link = "https://github.com" + $(el).find("a.v-align-middle").attr("href");
      const desc = $(el).find("p.mb-1").text().trim();
      const lang = $(el).find("[itemprop=programmingLanguage]").text().trim();

      if (name) {
        hasil.push({
          name,
          description: desc || null,
          language: lang || null,
          url: link
        });
      }
    });

    return hasil;
  }

  async function searchUser(query) {
    const { data } = await axios.get(
      "https://github.com/search?q=" + encodeURIComponent(query) + "&type=users",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const $ = cheerio.load(data);
    let hasil = [];

    $("div.user-list-item").each((i, el) => {
      const username = $(el).find("a.mr-1").text().trim();
      const link = "https://github.com" + $(el).find("a.mr-1").attr("href");
      const bio = $(el).find("p.mb-1").text().trim();

      if (username) {
        hasil.push({
          username,
          bio: bio || null,
          url: link
        });
      }
    });

    return hasil;
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
        error: err.message
      });
    }
  });

};