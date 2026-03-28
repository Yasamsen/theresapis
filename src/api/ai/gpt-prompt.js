const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://api-faa.my.id/faa/gpt-promt";

  async function gptPromt(prompt, text) {
    const { data } = await axios.get(
      API_URL +
        "?prompt=" + encodeURIComponent(prompt) +
        "&text=" + encodeURIComponent(text),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://api-faa.my.id/",
          "Origin": "https://api-faa.my.id"
        },
        timeout: 30000
      }
    );
    return data;
  }

  app.get("/ai/gpt-promt", async (req, res) => {
    const { prompt, text } = req.query;

    if (!prompt || !text) {
      return res.status(400).json({
        status: false,
        error: "Parameter prompt dan text wajib diisi"
      });
    }

    try {
      const result = await gptPromt(prompt, text);

      if (!result?.status) {
        return res.json({
          status: false,
          error: "Gagal mendapatkan respon AI"
        });
      }

      res.json({
        status: true,
        result: result.result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};