const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

module.exports = function (app) {

  app.get("/tools/catbox", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "url wajib diisi",
      });
    }

    try {
      // download dulu file dari url
      const tempPath = "./temp_file";

      const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
      });

      const ext = path.extname(url.split("?")[0]) || ".jpg";
      const filePath = tempPath + ext;

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // upload ke catbox
      const form = new FormData();
      form.append("fileToUpload", fs.createReadStream(filePath));
      form.append("reqtype", "fileupload");

      const upload = await axios.post(
        "https://catbox.moe/user/api.php",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      // hapus file sementara
      fs.unlinkSync(filePath);

      return res.json({
        status: true,
        result: {
          original: url,
          catbox: upload.data
        }
      });

    } catch (err) {
      console.log(err);

      res.status(500).json({
        status: false,
        error: err.message
      });
    }

  });

};