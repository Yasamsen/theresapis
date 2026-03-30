const axios = require("axios");
const xml2js = require("xml2js");

module.exports = function (app) {

  app.get("/tools/berita-lombok", async (req, res) => {
    try {
      const url = "https://news.google.com/rss/search?q=lombok+ntb&hl=id&gl=ID&ceid=ID:id";

      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(data);

      const items = result.rss.channel[0].item;

      const berita = items.map(v => ({
        title: v.title[0],
        link: v.link[0],
        pubDate: v.pubDate[0],
        source: v.source ? v.source[0]._ : "Unknown"
      }));

      res.json({
        status: true,
        creator: "yasamDev",
        total: berita.length,
        result: berita
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