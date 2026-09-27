# web-terminal

Terminal web sederhana (mirip Termux) yang jalan di Vercel. Bisa dipakai untuk
menjalankan perintah `node`, `npm`, dan `git` (misalnya buat coba tools lalu
push ke GitHub) langsung dari browser HP/laptop.

## ⚠️ Batasan penting (baca dulu)

- **Vercel itu serverless**, bukan server yang selalu nyala. Selama instance
  function masih "hangat" (biasanya beberapa menit setelah dipakai), folder
  kerja di `/tmp/workspace` akan tetap ada antar-perintah. Tapi begitu Vercel
  mendaur ulang instance (cold start), **isi `/tmp` hilang total**. Anggap ini
  sesi sementara, bukan penyimpanan permanen — commit & push ke GitHub sesering
  mungkin.
- Durasi eksekusi per perintah dibatasi (di sini di-set 55 detik, maksimal
  Vercel Hobby adalah 10 detik kecuali kamu upgrade plan / set `maxDuration`
  lebih tinggi kalau plan mendukung).
- Ini pada dasarnya adalah **endpoint eksekusi command** — kalau tokennya
  bocor, orang lain bisa menjalankan command di akun Vercel kamu. Jangan share
  URL + token ke publik, dan ganti token secara berkala.
- Binary yang tersedia (misalnya `git`) tergantung image runtime Vercel saat
  ini. Kalau ternyata `git` tidak ada, kamu bisa memakai package npm seperti
  `isomorphic-git` sebagai gantinya — beri tahu saya kalau butuh versi itu.

Kalau nanti kamu butuh terminal yang benar-benar persisten (state tidak
hilang, proses bisa jalan lama di background), opsi yang lebih cocok daripada
Vercel adalah VPS kecil atau layanan seperti Railway/Render/Fly.io yang bisa
menjalankan proses terus-menerus.

## Struktur

```
web-terminal/
├── api/
│   └── exec.js        # serverless function: eksekusi command
├── public/
│   └── index.html      # UI terminal (xterm.js)
├── package.json
├── vercel.json
└── README.md
```

## Cara deploy

1. Push folder ini ke repo GitHub baru.
2. Buka https://vercel.com, "Add New Project", import repo tersebut.
3. Sebelum deploy, buka tab **Environment Variables**, tambahkan:
   - `TERMINAL_TOKEN` = (isi dengan password/token rahasia buatanmu sendiri,
     misalnya string acak panjang)
4. Deploy.
5. Buka URL yang diberikan Vercel, masukkan token yang sama di layar login.

## Contoh pemakaian setelah login

```
git clone https://github.com/username/repo.git
cd repo
npm install
node index.js
git add .
git commit -m "update"
git push
```

Untuk `git push` ke GitHub kamu tetap perlu autentikasi (Personal Access
Token) karena sesi ini tidak menyimpan kredensial secara permanen — paling
aman pakai URL remote berformat:

```
https://<username>:<PERSONAL_ACCESS_TOKEN>@github.com/username/repo.git
```

atau set origin sekali di awal sesi:

```
git remote set-url origin https://<username>:<TOKEN>@github.com/username/repo.git
```
