const axios = require("axios");

module.exports = function (app) {

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.tiktok.com/",
    "Accept": "text/html"
  };

  async function tiktokSearch(query) {
    const { data } = await axios.get(
      "https://www.tiktok.com/search?q=" + encodeURIComponent(query),
      { headers }
    );

    let result = [];

    // =========================
    // 🥇 METHOD 1 (JSON utama)
    // =========================
    try {
      const json = data.match(/__UNIVERSAL_DATA_FOR_REHYDRATION__.*?>(.*?)<\/script>/);
      if (json) {
        const parsed = JSON.parse(json[1]);
        const items =
          parsed?.__DEFAULT_SCOPE__?.["webapp.search-item"]?.itemList || [];

        for (let item of items) {
          const v = item.item;
          result.push({
            description: v.desc,
            url: `https://www.tiktok.com/@${v.author.uniqueId}/video/${v.id}`,
            thumbnail: v.video.cover,
            author: v.author.nickname,
            username: v.author.uniqueId,
            views: v.stats.playCount
          });
        }
      }
    } catch (e) {}

    // =========================
    // 🥈 METHOD 2 (regex itemList)
    // =========================
    if (!result.length) {
      try {
        const json = data.match(/"itemList":(\[.*?\])/);
        if (json) {
          const items = JSON.parse(json[1]);

          for (let v of items) {
            result.push({
              description: v.desc || "-",
              url: `https://www.tiktok.com/@${v.author?.uniqueId}/video/${v.id}`,
              thumbnail: v.video?.cover,
              author: v.author?.nickname,
              username: v.author?.uniqueId,
              views: v.stats?.playCount
            });
          }
        }
      } catch (e) {}
    }

    // =========================
    // 🥉 METHOD 3 (ambil link langsung)
    // =========================
    if (!result.length) {
      const links = data.match(/https:\/\/www\.tiktok\.com\/@[^"]+/g) || [];

      result = [...new Set(links)].slice(0, 10).map(url => ({
        url,
        description: "Video TikTok",
      }));
    }

    return result;
  }

  app.get("/search/tiktok", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        error: "Parameter q wajib diisi"
      });
    }

    try {
      const data = await tiktokSearch(q);

      res.json({
        status: true,
        result: data
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};