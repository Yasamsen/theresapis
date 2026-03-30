const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  app.get("/tools/motivasi/random", async (req, res) => {
    try {
      const { data } = await axios.get("https://jagokata.com/kata-bijak.html", {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const $ = cheerio.load(data);
      let hasil = [];

      $("ul#citatenav li").each((i, el) => {
        const quote = $(el).find("q.fbquote").text().trim();
        const author = $(el).find("a").text().trim();

        if (quote) {
          hasil.push({
            kata: quote,
            author: author || "Anonim"
          });
        }
      });

      if (hasil.length === 0) {
        return res.status(404).json({
          status: false,
          error: "Tidak ada kata ditemukan"
        });
      }

      // 🔥 ambil random
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