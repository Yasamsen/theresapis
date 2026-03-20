const axios = require("axios");

module.exports = function (app) {

  app.get("/cloudflare/addsub", async (req, res) => {
    const { ip, sub, proxy = "off" } = req.query;

    if (!ip || !sub) {
      return res.status(400).json({
        status: false,
        error: "ip dan sub wajib diisi",
      });
    }

    const proxied = proxy === "on";
    const domain = `${sub}.yasamdev.web.id`;
    const zone = '45c900cd8ce4bf53b319e268d241d856';
    const apiToken = 'e8sq4CK7Sf3LTnn8xDlm4i0mfLNxTN-vok4nJTMe';

    try {
      // cek DNS record dulu
      const check = await axios.get(
        `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?name=${domain}`,
        {
          headers: { Authorization: `Bearer ${apiToken}` }
        }
      );

      if (check.data.result.length > 0) {
        // update proxy
        const record = check.data.result[0];

        const update = await axios.patch(
          `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${record.id}`,
          { proxied: proxied },
          { headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" } }
        );

        return res.status(200).json({
          status: true,
          result: {
            domain,
            proxied,
            action: "updated",
            cloudflareResponse: update.data // debug lengkap
          }
        });

      } else {
        // create baru
        const create = await axios.post(
          `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
          {
            type: "A",
            name: sub,
            content: ip,
            ttl: 1,
            proxied: proxied
          },
          { headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" } }
        );

        return res.status(200).json({
          status: true,
          result: {
            domain,
            ip,
            proxied,
            action: "created",
            cloudflareResponse: create.data // debug lengkap
          }
        });
      }

    } catch (err) {
      // debug lebih lengkap
      console.error("Cloudflare API error:", err.response?.data || err.message);

      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.response?.data?.errors?.[0]?.message || err.message || "Cloudflare API error",
        details: err.response?.data || null // debug detail
      });
    }

  });

};