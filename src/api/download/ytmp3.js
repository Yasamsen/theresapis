function extractVideoId(input) {
  if (!input) throw new Error("No input");

  for (const re of [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/(shorts|embed|live)\/([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ]) {
    const m = input.match(re);
    if (m) return m[1] || m[2];
  }

  throw new Error("Invalid YouTube URL");
}

function validateFormat(fmt) {
  const allowed = ["mp3", "mp4", "m4a", "webm"];
  if (!allowed.includes(fmt)) {
    throw new Error("Format tidak valid");
  }
  return fmt;
}

const core = require("./your-ytdl-core-file"); 
// isi dengan scraper kamu tadi

module.exports = function (app) {

  app.get("/download/youtube", async (req, res) => {
    const { url, format = "mp3" } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Url is required",
      });
    }

    try {
      const videoId = extractVideoId(url);
      const fmt = validateFormat(format);

      const result = await core.youtubeDownloader(url, fmt, {
        poll: true
      });

      res.status(200).json({
        status: true,
        result: {
          title: result.video.title || null,
          videoId: videoId,
          format: fmt,
          download: result.download.url || null,
          progress_url: result.download.progressURL || null,
          source: "ytmp3.gs",
        },
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message,
      });
    }
  });

};