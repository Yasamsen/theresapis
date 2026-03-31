const axios = require("axios");

class Videy {
  constructor() {
    this.base = "https://cdn.";
  }

  async getVideo(url) {
    try {
      if (!url) throw new Error("No URL");

      // logic kamu
      let anu = url.replace("v?id=", "");
      let cdn = anu.replace("https://", this.base);

      return {
        original: url,
        cdn: cdn + ".mp4"
      };

    } catch (err) {
      throw new Error(err.message || "Gagal proses videy");
    }
  }
}

module.exports = function (app) {

  app.get("/download/videy", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Url is required"
      });
    }

    try {
      const scraper = new Videy();
      const result = await scraper.getVideo(url);

      res.status(200).json({
        status: true,
        result: {
          original: result.original,
          video: result.cdn,
          source: "videy-cdn"
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};