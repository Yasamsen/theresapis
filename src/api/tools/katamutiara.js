const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  app.get("/tools/motivasi/random", async (req, res) => {
    try {
      const { data } = await axios.get("http://quotes.toscrape.com/", {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const $ = cheerio.load(data);
      let hasil = [];

      $(".quote").each((i, el) => {
        const kata = $(el).find(".text").text().trim();
        const author = $(el).find(".author").text().trim();

        if (kata) {
          hasil.push({
            kata: kata.replace(/(^“|”$)/g, ""),
            author
          });
        }
      });

      if (!hasil.length) {
        throw new Error("Quote tidak ditemukan");
      }

      const random = hasil[Math.floor(Math.random() * hasil.length)];

      res.json({
        status: true,
        creator: "yasamDev",
        result: random
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