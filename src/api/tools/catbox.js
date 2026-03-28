const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {

  app.post("/tools/catbox", async (req, res) => {
    const file = req.files?.file; // express-fileupload

    if (!file) return res.status(400).json({
      status: false,
      error: "File wajib diupload (field: file)"
    });

    try {
      const form = new FormData();
      form.append("reqtype", "fileupload");
      // pakai file.data langsung
      form.append("fileToUpload", file.data, file.name);

      const upload = await axios.post(
        "https://catbox.moe/user/api.php",
        form,
        { headers: { ...form.getHeaders() }, maxBodyLength: Infinity }
      );

      return res.json({
        status: true,
        result: {
          filename: file.name,
          size: file.size,
          url: upload.data,
          source: "catbox.moe"
        }
      });

    } catch (err) {
      console.error(err.response?.data || err.message);
      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.response?.data || err.message
      });
    }
  });

};