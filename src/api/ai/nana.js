const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const FormData = require('form-data');

module.exports = function(app) {

    async function nananaOpenApi(imagePath, prompt) {
        class Nanana {
            constructor() {
                this.baseUrl = 'https://nanana.app';
                this.tempMail = new TempMailScraper();
                this.sessionToken = '';
                this.cookieString = '';
                this.defaultHeaders = {
                    'accept': '*/*',
                    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'origin': this.baseUrl,
                    'referer': `${this.baseUrl}/en`,
                    'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
                };
            }

            async initialize() {
                const email = await this.tempMail.getEmail();
                await this.sendOtp(email);
                const code = await this.tempMail.waitForCode();
                await this.verifyOtp(email, code);
            }

            async sendOtp(email) {
                const res = await axios.post(
                    `${this.baseUrl}/api/auth/email-otp/send-verification-otp`,
                    { email, type: 'sign-in' },
                    { headers: this.defaultHeaders }
                );
                return res.data;
            }

            async verifyOtp(email, otp) {
                const res = await axios.post(
                    `${this.baseUrl}/api/auth/sign-in/email-otp`,
                    { email, otp },
                    { headers: this.defaultHeaders, withCredentials: true }
                );
                const setCookie = res.headers['set-cookie'];
                if (setCookie && setCookie.length > 0) {
                    const sessionCookie = setCookie.find(c => c.includes('__Secure-better-auth.session_token'));
                    if (sessionCookie) this.cookieString = sessionCookie.split(';')[0];
                }
                return res.data;
            }

            async uploadImage(imagePath) {
                const form = new FormData();
                form.append('image', fs.createReadStream(imagePath));

                const res = await axios.post(
                    `${this.baseUrl}/api/upload-img`,
                    form,
                    { headers: { ...this.defaultHeaders, ...form.getHeaders(), 'Cookie': this.cookieString, 'x-fp-id': this.generateFpId() } }
                );
                return res.data;
            }

            generateFpId() {
                const random = crypto.randomBytes(32).toString('hex');
                const timestamp = Date.now().toString();
                return Buffer.from(random + timestamp).toString('base64').slice(0, 128);
            }

            async generateImage(imageUrl, prompt) {
                const res = await axios.post(
                    `${this.baseUrl}/api/image-to-image`,
                    { prompt, image_urls: [imageUrl] },
                    { headers: { ...this.defaultHeaders, 'content-type': 'application/json', 'Cookie': this.cookieString, 'x-fp-id': this.generateFpId() } }
                );
                return res.data;
            }

            async getResult(requestId) {
                const res = await axios.post(
                    `${this.baseUrl}/api/get-result`,
                    { requestId, type: 'image-to-image' },
                    { headers: { ...this.defaultHeaders, 'content-type': 'application/json', 'Cookie': this.cookieString, 'x-fp-id': this.generateFpId() } }
                );
                return res.data;
            }

            async processImage(imagePath, prompt) {
                const upload = await this.uploadImage(imagePath);
                const generate = await this.generateImage(upload.url, prompt);

                while (true) {
                    const result = await this.getResult(generate.request_id);
                    if (result.completed) return result;
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }

        class TempMailScraper {
            constructor() {
                this.baseUrl = 'https://akunlama.com';
                this.headers = {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'referer': 'https://akunlama.com/',
                    'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
                };
                this.recipient = crypto.randomBytes(8).toString('hex').substring(0, 10);
                this.lastCount = 0;
            }

            async getEmail() {}
            async waitForCode() {
                return new Promise((resolve) => {
                    const interval = setInterval(async () => {
                        const inbox = await this.checkInbox();
                        if (inbox.length > this.lastCount) {
                            for (const msg of inbox.slice(this.lastCount)) {
                                const html = await this.getMessageContent(msg);
                                const code = this.extractCode(html);
                                if (code) {
                                    clearInterval(interval);
                                    resolve(code);
                                }
                            }
                            this.lastCount = inbox.length;
                        }
                    }, 5000);
                });
            }
            async checkInbox() {
                const res = await axios.get(`${this.baseUrl}/api/list`, {
                    params: { recipient: this.recipient },
                    headers: { ...this.headers, referer: `https://akunlama.com/inbox/${this.recipient}/list` }
                });
                return res.data;
            }
            async getMessageContent(msg) {
                const res = await axios.get(`${this.baseUrl}/api/getHtml`, {
                    params: { region: msg.storage.region, key: msg.storage.key },
                    headers: { ...this.headers, referer: `https://akunlama.com/inbox/${this.recipient}/message/${msg.storage.region}/${msg.storage.key}` }
                });
                return res.data;
            }
            extractCode(html) {
                const match = html.match(/(\d{6})/);
                return match ? match[1] : null;
            }
        }

        const scraper = new Nanana();
        await scraper.initialize();
        return await scraper.processImage(imagePath, prompt);
    }

    // Endpoint Express
    app.get('/ai/nana', async (req, res) => {
        const { imagePath, prompt } = req.query;
        if (!imagePath || !prompt) return res.status(400).json({ status: false, error: "imagePath dan prompt wajib diisi" });
        try {
            const result = await nananaOpenApi(imagePath, prompt);
            res.json({ status: true, result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

};