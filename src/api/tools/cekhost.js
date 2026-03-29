const axios = require("axios");

module.exports = function (app) {

  async function cekhost(host) {
    try {
      // 🔥 STEP 1: Ambil request ID
      const { data: init } = await axios.get(
        "https://check-host.net/check-http",
        {
          params: { host },
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      const requestId = init.request_id;
      if (!requestId) throw "Gagal mendapatkan request ID";

      // 🔥 STEP 2: Tunggu hasil (penting!)
      await new Promise(r => setTimeout(r, 3000));

      // 🔥 STEP 3: Ambil result
      const { data: result } = await axios.get(
        `https://check-host.net/check-result/${requestId}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      let final = [];

      // 🔥 STEP 4: Parsing
      for (const node in result) {
        const data = result[node];

        if (!data || !data[0]) continue;

        const res = data[0][0];

        final.push({
          node,
          status: res[2] || "UNKNOWN",
          response_time: res[1] ? res[1] + " ms" : null,
          ip: res[0] || null
        });
      }

      if (!final.length) throw "Data kosong / belum siap";

      return final;

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