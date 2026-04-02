const axios = require("axios");

module.exports = function (app) {

  app.get("/search/npmd", async (req, res) => {
    const { package: pkg, version } = req.query;

    if (!pkg) {
      return res.status(400).json({
        status: false,
        creator: "yasamDev",
        error: "Parameter package wajib diisi"
      });
    }

    try {
      // ambil data dari registry npm
      const { data } = await axios.get(`https://registry.npmjs.org/${pkg}`);

      const ver = version || data["dist-tags"].latest;
      const pkgData = data.versions[ver];

      if (!pkgData) {
        return res.status(404).json({
          status: false,
          creator: "yasamDev",
          error: "Versi tidak ditemukan"
        });
      }

      res.json({
        status: true,
        creator: "yasamDev",
        result: {
          name: pkgData.name,
          version: pkgData.version,
          description: pkgData.description,
          author: pkgData.author?.name || null,
          license: pkgData.license,
          repository: pkgData.repository?.url || null,
          keywords: pkgData.keywords || [],
          download: pkgData.dist.tarball
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: "Package tidak ditemukan"
      });
    }
  });

};