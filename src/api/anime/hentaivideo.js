const axios = require("axios");

module.exports = function(app) {

    async function alya() {
        const { data } = await axios.get(
            "https://raw.githubusercontent.com/Yasamsen/WaifuVideo/refs/heads/main/WaifuRandom.json"
        );

        const list = data.videos || data.images;

        if (!list || !Array.isArray(list) || list.length === 0) {
            throw new Error("No videos found");
        }

        return list[Math.floor(Math.random() * list.length)];
    }

    app.get("/anime/waifuhen", async (req, res) => {
        try {
            const videoUrl = await alya();

            // ambil video sebagai stream
            const response = await axios.get(videoUrl, {
                responseType: "stream"
            });

            // ❗ INI YANG PENTING
            res.setHeader("Content-Type", "video/mp4");

            // kirim langsung ke client
            response.data.pipe(res);

        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    });

};