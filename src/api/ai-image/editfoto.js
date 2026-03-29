const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://api-faa.my.id/faa/editfoto";

  async function editfoto(url, prompt) {
    const response = await axios.get(
      API_URL + "?url=" + encodeURIComponent(url) + "&prompt=" + encodeURIComponent(prompt),
      {
        responseType: "arraybuffer", // 🔥 wajib
        timeout: 60000
      }
    );
    return response;
  }

  app.get("/ai-image/editfoto", async (req, res) => {
    const { url, prompt } = req.query;

    if (!url || !prompt) {
      return res.status(400).json({
        status: false,
        error: "Parameter url dan prompt wajib diisi"
      });
    }

    try {
      const result = await editfoto(url, prompt);

      res.set("Content-Type", "image/png"); // atau image/jpeg tergantung API
      res.send(result.data);

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};