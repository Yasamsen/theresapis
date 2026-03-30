const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://www.google.com/",
    "Origin": "https://jagokata.com",

    // 🔥 biar kayak browser asli
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",

    // 🔥 cookie dummy (kadang bantu lolos)
    "Cookie": "_ga=GA1.1.123456789.1234567890; _gid=GA1.1.123456789.1234567890;"
  };

  app.get("/tools/motivasi/random", async (req, res) => {
    try {
      const { data } = await axios.get("https://jagokata.com/kata-bijak.html", {
        headers,
        timeout: 20000
      });

      const cheerioLoad = cheerio.load(data);
      let hasil = [];

      cheerioLoad("ul#citatenav li").each((i, el) => {
        const quote = cheerioLoad(el).find("q.fbquote").text().trim();
        const author = cheerioLoad(el).find("a").text().trim();

        if (quote) {
          hasil.push({
            kata: quote,
            author: author || "Anonim"
          });
        }
      });

      if (!hasil.length) {
        throw new Error("Data kosong / selector berubah");
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