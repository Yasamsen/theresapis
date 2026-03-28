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

    // 🔥 ambil dari JSON di halaman
    const json = data.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/);

    if (!json) return [];

    const parsed = JSON.parse(json[1]);

    const items =
      parsed?.__DEFAULT_SCOPE__?.["webapp.search-item"]?.itemList || [];

    for (let item of items) {
      const video = item.item;

      result.push({
        description: video.desc,
        videoId: video.id,
        url: "https://www.tiktok.com/@"+ video.author.uniqueId +"/video/"+ video.id,
        thumbnail: video.video.cover,
        author: video.author.nickname,
        username: video.author.uniqueId,
        duration: video.video.duration,
        likes: video.stats.diggCount,
        views: video.stats.playCount
      });
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