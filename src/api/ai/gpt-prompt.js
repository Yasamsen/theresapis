const axios = require("axios");

module.exports = function (app) {

  // 🔥 Base URL
  const BASE_URL = "https://api-faa.my.id/faa/gpt-promt";

  // 🔥 Function request ke API luar
  async function gptPromt(prompt, text) {
    try {
      const { data } = await axios.get(BASE_URL, {
        params: {
          prompt,
          text
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json"
        },
        timeout: 30000
      });

      return data;

    } catch (err) {
      throw err.response?.data || err.message;
    }
  }

  // 🔥 Endpoint API kamu
  app.get("/ai/gpt-promt", async (req, res) => {
    const { prompt, text } = req.query;

    // ❌ Validasi
    if (!prompt || !text) {
      return res.status(400).json({
        status: false,
        creator: "yasamDev",
        error: "Parameter prompt & text wajib diisi"
      });
    }

    try {
      const result = await gptPromt(prompt, text);

      // ❌ Jika API luar gagal
      if (!result?.status) {
        return res.status(500).json({
          status: false,
          creator: "yasamDev",
          error: result?.error || "Gagal mendapatkan respon AI"
        });
      }

      // ✅ Success
      res.json({
        status: true,
        creator: "yasamDev",
        result: result.result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: typeof err === "object" ? JSON.stringify(err) : err
      });
    }
  });

};