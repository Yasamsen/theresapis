const axios = require("axios");

module.exports = function(app) {

    async function alya() {
        try {
            const { data } = await axios.get(
                "https://raw.githubusercontent.com/Yasamsen/WaifuVideo/refs/heads/main/WaifuRandom.json"
            );

            // support key videos / images
            const list = data.videos || data.images;

            if (!list || !Array.isArray(list) || list.length === 0) {
                throw new Error("No videos found");
            }

            // ambil 1 random video
            const random = list[Math.floor(Math.random() * list.length)];

            return random;

        } catch (error) {
            throw error;
        }
    }

    app.get("/anime/hentaivideo", async (req, res) => {
        try {
            const video = await alya();

            res.status(200).json({
                status: true,
                videos: [video]
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    });

};