const axios = require("axios");
const cheerio = require("cheerio");

async function translate(text) {
  try {
    const { data } = await axios.get(
      "https://translate.googleapis.com/translate_a/single",
      {
        params: {
          client: "gtx",
          sl: "en",
          tl: "id",
          dt: "t",
          q: text
        }
      }
    );

    return data[0].map(v => v[0]).join("");
  } catch {
    return text; // fallback kalau gagal
  }
}

module.exports = function (app) {

  app.get("/search/motivasi/random", async (req, res) => {
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

      // 🔥 translate ke Indo
      const indo = await translate(random.kata);

      res.json({
        status: true,
        creator: "yasamDev",
        result: {
          kata: indo,
          author: random.author
        }
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