const axios = require("axios");

module.exports = function (app) {

  app.get("/cloudflare/dns", async (req, res) => {
    const { type = "A", name, content, proxy = "off" } = req.query;

    if (!name || !content) {
      return res.status(400).json({
        status: false,
        error: "name dan content wajib diisi",
      });
    }

    const proxied = proxy === "on";

    // 🔥 FIX anti double domain
    const cleanName = name.replace(".yasamdev.web.id", "");
    const domain = `${cleanName}.yasamdev.web.id`;

    const zone = "45c900cd8ce4bf53b319e268d241d856";
    const apiToken = "ISI_API_TOKEN_KAMU";

    try {
      const check = await axios.get(
        `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?name=${domain}`,
        {
          headers: { Authorization: `Bearer ${apiToken}` }
        }
      );

      if (check.data.result.length > 0) {
        const record = check.data.result[0];

        const update = await axios.put(
          `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${record.id}`,
          {
            type,
            name: domain, // 🔥 FIX
            content,
            ttl: 1,
            proxied
          },
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json"
            }
          }
        );

        return res.json({
          status: true,
          result: {
            domain,
            type,
            content,
            proxied,
            action: "updated",
            cloudflareResponse: update.data
          }
        });

      } else {

        const create = await axios.post(
          `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
          {
            type,
            name: domain, // 🔥 FIX
            content,
            ttl: 1,
            proxied
          },
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json"
            }
          }
        );

        return res.json({
          status: true,
          result: {
            domain,
            type,
            content,
            proxied,
            action: "created",
            cloudflareResponse: create.data
          }
        });

      }

    } catch (err) {
      console.error(err.response?.data || err.message);

      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.response?.data?.errors?.[0]?.message || err.message,
        details: err.response?.data || null
      });
    }

  });

};