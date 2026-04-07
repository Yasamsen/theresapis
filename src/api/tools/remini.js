const axios = require("axios")
const FormData = require("form-data")

module.exports = (app) => {

  app.post("/tools/remini", async (req, res) => {
    try {

      const { image } = req.body
      if (!image) throw new Error("Masukkan URL gambar")

      // ambil image dari URL
      const img = await axios.get(image, { responseType: "arraybuffer" })

      const form = new FormData()
      form.append("method", "1")
      form.append("is_pro_version", "false")
      form.append("is_enhancing_more", "false")
      form.append("max_image_size", "high")
      form.append("file", img.data, `remini_${Date.now()}.jpg`)

      const { data } = await axios.post(
        "https://ihancer.com/api/enhance",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "accept-encoding": "gzip",
            "user-agent": "Dart/3.5 (dart:io)"
          },
          responseType: "arraybuffer"
        }
      )

      res.setHeader("Content-Type", "image/png")
      res.send(data)

    } catch (err) {

      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.message
      })

    }
  })

}