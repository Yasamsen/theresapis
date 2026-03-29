const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  async function cekhost(host) {
    try {
      const { data } = await axios.get(
        "https://check-host.net/check-http?host=" + encodeURIComponent(host),
        {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      const $ = cheerio.load(data);

      let result = [];

      // 🔥 Ambil semua node hasil
      $(".table tbody tr").each((i, el) => {
        const cols = $(el).find("td");

        const node = $(cols[0]).text().trim();
        const country = $(cols[1]).text().trim();
        const status = $(cols[2]).text().trim();
        const time = $(cols[3]).text().trim();

        result.push({
          node,
          country,
          status,
          response_time: time
        });
      });

      // 🔥 fallback kalau kosong
      if (!result.length) {
        result.push({
          info: "Kemungkinan website berubah atau kena proteksi",
          raw: host
        });
      }

      return result;

    } catch (err) {
      throw err;
    }
  }

  // 🔥 Endpoint API
  app.get("/tools/cekhost", async (req, res) => {
    const { host } = req.query;

    if (!host) {
      return res.status(400).json({
        status: false,
        creator: "yasamDev",
        error: "Parameter host wajib diisi"
      });
    }

    try {
      const data = await cekhost(host);

      res.json({
        status: true,
        creator: "yasamDev",
        result: data
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.toString()
      });
    }
  });

};