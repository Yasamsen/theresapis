const axios = require("axios");

module.exports = function (app) {

  app.get("/tools/translate", async (req, res) => {
    const { text, to } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        creator: "yasamDev",
        error: "Parameter text wajib diisi"
      });
    }

    const target = to || "id"; // default ke Indonesia

    try {
      const url = "https://translate.googleapis.com/translate_a/single";

      const { data } = await axios.get(url, {
        params: {
          client: "gtx",
          sl: "auto",
          tl: target,
          dt: "t",
          q: text
        },
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const hasil = data[0].map(v => v[0]).join("");

      res.json({
        status: true,
        creator: "yasamDev",
        result: {
          original: text,
          translated: hasil,
          target: target
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