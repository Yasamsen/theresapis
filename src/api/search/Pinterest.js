const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
// Function scrape Pinterest (tanpa cookie, pakai header browser)
async function Pinterest(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get(
        "https://id.pinterest.com/search/pins/?q=" + encodeURIComponent(query),
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
          }
        }
      );

      const $ = cheerio.load(data);
      let result = [];

      // 🔥 Cara 1: Ambil dari img langsung
      $("img").each((i, el) => {
        const src = $(el).attr("src");
        if (src && src.includes("i.pinimg.com")) {
          result.push(src.replace(/236x|474x/g, "736x"));
        }
      });

      // 🔥 Cara 2: Ambil dari script JSON (lebih akurat)
      $("script").each((i, el) => {
        const json = $(el).html();
        if (json && json.includes("i.pinimg.com")) {
          const matches = json.match(/https:\/\/i\.pinimg\.com\/[^"]+/g);
          if (matches) {
            result.push(
              ...matches.map(x => x.replace(/236x|474x/g, "736x"))
            );
          }
        }
      });

      result = [...new Set(result)];

      if (!result.length)
        return resolve({ developer: "@xorizn", mess: "no result found" });

      resolve(result);

    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

// Endpoint
  app.get("/search/Pinterest", async (req, res) => {
    const { q } = req.query;

    if (!q)
      return res.status(400).json({
        status: false,
        error: "Parameter q wajib diisi"
      });

    try {
      const data = await Pinterest(q);
      res.json({ status: true, result: data });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};