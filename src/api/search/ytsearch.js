const axios = require("axios");

module.exports = function (app) {

  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "en-US,en;q=0.9"
  };

  async function ytSearch(query) {
    const { data } = await axios.get(
      "https://www.youtube.com/results?search_query=" + encodeURIComponent(query),
      { headers }
    );

    let result = [];

    // 🔥 ambil JSON dari ytInitialData
    const json = data.match(/var ytInitialData = (.*?);<\/script>/);

    if (!json) return [];

    const parsed = JSON.parse(json[1]);

    const contents =
      parsed.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;

    for (let section of contents) {
      const items = section.itemSectionRenderer?.contents || [];

      for (let item of items) {
        const video = item.videoRenderer;
        if (!video) continue;

        result.push({
          title: video.title.runs[0].text,
          videoId: video.videoId,
          url: "https://www.youtube.com/watch?v=" + video.videoId,
          thumbnail: video.thumbnail.thumbnails.pop().url,
          duration: video.lengthText?.simpleText || "LIVE",
          channel: video.ownerText?.runs[0]?.text,
          views: video.viewCountText?.simpleText || "0 views"
        });
      }
    }

    return result;
  }

  app.get("/search/youtube", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        error: "Parameter q wajib diisi"
      });
    }

    try {
      const data = await ytSearch(q);

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