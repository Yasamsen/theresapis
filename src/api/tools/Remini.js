const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {

  // Async function mirip Venicechat tapi buat Remini AI
  async function reminiChat(imageUrl, method = "enhance") {
    try {
      if (!imageUrl) throw new Error("Image URL wajib diisi");

      const allowedMethods = ["enhance", "recolor", "dehaze"];
      if (!allowedMethods.includes(method)) method = "enhance";

      // Ambil gambar dari URL
      const { data: imageBuffer } = await axios.get(imageUrl, { responseType: "arraybuffer" });

      const form = new FormData();
      const endpoint = `https://inferenceengine.vyro.ai/${method}`;

      form.append("model_version", "1");
      form.append("image", imageBuffer, {
        filename: "image.jpg",
        contentType: "image/jpeg",
      });

      // Submit form ke Remini API
      return await new Promise((resolve, reject) => {
        form.submit(
          {
            url: endpoint,
            headers: {
              ...form.getHeaders(),
              "User-Agent": "okhttp/4.9.3",
              Connection: "Keep-Alive",
            },
          },
          (err, res) => {
            if (err) return reject(err);

            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
            res.on("error", reject);
          }
        );
      });

    } catch (err) {
      throw new Error(err.message || "Gagal memproses gambar");
    }
  }

  // Route API
  app.get("/tools/remini", async (req, res) => {
    const { url, method } = req.query;

    if (!url)
      return res.status(400).json({
        status: false,
        error: "URL gambar wajib diisi",
      });

    try {
      const resultBuffer = await reminiChat(url, method);

      // Kirim response sebagai image
      res.set("Content-Type", "image/jpeg");
      res.status(200).send(resultBuffer);

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message,
      });
    }
  });
};