const axios = require("axios")

module.exports = (app) => {

  app.get("/tools/pastebin", async (req, res) => {
    try {

      let { url } = req.query
      if (!url) throw new Error("Masukkan URL pastebin")

      // ambil ID dari link
      let id = url.split("/").pop().trim()
      let raw = `https://pastebin.com/raw/${id}`

      const { data } = await axios.get(raw, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      })

      res.json({
        status: true,
        creator: "yasamDev",
        result: {
          id,
          raw,
          content: data
        }
      })

    } catch (err) {

      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.message
      })

    }
  })

}