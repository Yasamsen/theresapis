const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://www.neoapis.xyz/api/ai-image/nanoedit?url=";

  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json"
  };

  async function nanoedit(url, prompt) {
    const { data } = await axios.get(
      API_URL + encodeURIComponent(url) + "&prompt=" + encodeURIComponent(prompt),
      {
        headers,
        timeout: 60000 // atau 120000
      }
    );
    return data;
  }

  app.get("/ai-image/nanoedit", async (req, res) => {
    const { url, prompt } = req.query;

    if (!url || !prompt) {
      return res.status(400).json({
        status: false,
        error: "Parameter url dan prompt wajib diisi"
      });
    }

    try {
      const result = await nanoedit(url, prompt);

      if (!result?.status || !result?.data?.image) {
        return res.status(500).json({
          status: false,
          error: "Gagal mengedit gambar"
        });
      }

      res.json({
        status: true,
        task_id: result.data.task_id,
        result: result.data.image
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};