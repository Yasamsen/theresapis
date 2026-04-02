const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  app.get("/search/emas-antam", async (req, res) => {

    try {
      const { data } = await axios.get("https://www.logammulia.com/id/harga-emas-hari-ini", {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const $ = cheerio.load(data);

      let harga = null;

      // ambil harga 1 gram
      $("table tbody tr").each((i, el) => {
        const berat = $(el).find("td").eq(0).text().trim();
        const price = $(el).find("td").eq(1).text().trim();

        if (berat === "1 gr") {
          harga = price.replace(/[^\d]/g, "");
        }
      });

      if (!harga) {
        return res.status(500).json({
          status: false,
          creator: "yasamDev",
          error: "Gagal mengambil harga"
        });
      }

      res.json({
        status: true,
        creator: "yasamDev",
        result: {
          emas: "Antam",
          berat: "1 gram",
          harga: parseInt(harga),
          mata_uang: "IDR",
          sumber: "https://www.logammulia.com",
          update: new Date().toISOString()
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