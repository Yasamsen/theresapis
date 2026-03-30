const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://api.lyrics.ovh/v1/";

  app.get("/tools/lirik", async (req, res) => {
    const { artist, title } = req.query;

    if (!artist || !title) {
      return res.status(400).json({
        status: false,
        error: "Parameter artist & title wajib diisi"
      });
    }

    try {
      const { data } = await axios.get(
        API_URL + encodeURIComponent(artist) + "/" + encodeURIComponent(title)
      );

      if (!data || !data.lyrics) {
        return res.status(404).json({
          status: false,
          error: "Lirik tidak ditemukan"
        });
      }

      res.json({
        status: true,
        creator: "yasamDev",
        result: {
          artist,
          title,
          lirik: data.lyrics
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