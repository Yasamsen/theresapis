const axios = require("axios");
const qs = require("qs");

class FBDown {
  constructor() {
    this.baseURL = "https://y2date.com";
    this.headers = {
      accept: "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      origin: "https://y2date.com",
      referer: "https://y2date.com/facebook-video-downloader/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      "content-type": "application/x-www-form-urlencoded",
    };
  }

  async getVideo(url) {
    try {
      const token =
        "3ecace38ab99d0aa20f9560f0c9703787d4957d34d2a2d42bfe5b447f397e03c";

      const payload = qs.stringify({ url, token });

      const { data } = await axios.post(
        `${this.baseURL}/wp-json/aio-dl/video-data/`,
        payload,
        { headers: this.headers }
      );

      if (!data) throw new Error("No data from scraper");

      return data;
    } catch (err) {
      throw new Error(err.message || "Gagal scrape Facebook");
    }
  }
}

module.exports = function (app) {
  app.get("/download/facebook", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Url is required",
      });
    }

    try {
      const scraper = new FBDown();
      const result = await scraper.getVideo(url);

      res.status(200).json({
        status: true,
        result: {
          title: result.title || null,
          thumbnail: result.thumbnail || null,
          video_sd: result.links?.sd || null,
          video_hd: result.links?.hd || null,
          source: "y2date",
        },
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message,
      });
    }
  });
};