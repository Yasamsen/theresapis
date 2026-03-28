const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://api-faa.my.id/faa/gpt-promt";

async function gptPromt(prompt, text) {
  try {
    const { data } = await axios.get(
      "https://api-faa.my.id/faa/gpt-promt",
      {
        params: {
          prompt,
          text
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://api-faa.my.id/",
          "Origin": "https://api-faa.my.id",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache"
        },
        timeout: 30000,
        validateStatus: () => true // 🔥 penting
      }
    );

    // 🔥 kalau 403, kasih info asli
    if (data?.status === false) return data;

    return data;

  } catch (err) {
    console.log("ERROR:", err.response?.status);
    throw err;
  }
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