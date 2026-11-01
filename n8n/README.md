# n8n — Automation Gentle Wear

Tiga workflow otomatis (file JSON di `workflows/`):

| Workflow | Pemicu | Aksi |
|---|---|---|
| **Order paid** | Laravel → webhook `POST /webhook/gentle-wear/order-paid` saat pembayaran berhasil | Telegram ke admin + email terima kasih ke pelanggan |
| **Low stock alert** | Laravel → webhook `POST /webhook/gentle-wear/stock-low` saat stok varian ≤ minimum | Telegram + email ke bagian gudang |
| **Daily sales recap** | Jadwal setiap hari 21:00 WIB | n8n memanggil `GET /api/n8n/daily-summary` (header `X-N8N-Token`) → Telegram + email ke owner |

Setiap notifikasi dikirim lewat **Telegram dan email**. Kalau salah satu belum diatur, yang lain tetap jalan.

## Menjalankan

```bash
cd n8n
npm install          # sekali saja (n8n 2.8.4, cocok dengan Node 22)
cp .env.example .env # lalu isi (lihat di bawah)
npm run import       # memasukkan 3 workflow ke n8n (sekali, saat n8n mati)
npm run activate     # menyalakan ketiganya (impor membuatnya nonaktif)
npm start            # buka http://localhost:5678
```

Saat pertama dibuka, n8n meminta membuat akun owner lokal (email + password, hanya tersimpan di laptopmu).

## Isi `.env`

Semua kunci ada di `n8n/.env` — **tidak perlu membuat credential di n8n**. Telegram dikirim lewat Telegram Bot API, email lewat **Brevo** API.

| Variabel | Isi |
|---|---|
| `GW_API_URL` | `http://localhost:8000/api` |
| `GW_N8N_TOKEN` | Sama persis dengan `N8N_API_TOKEN` di `backend/.env` |
| `TELEGRAM_BOT_TOKEN` | Token dari @BotFather |
| `TELEGRAM_CHAT_ID` | Chat id admin (cara dapatnya di bawah) |
| `BREVO_API_KEY` | API key Brevo (`xkeysib-...`) |
| `SHOP_NAME` | Nama pengirim email, mis. `Gentle Wear` |
| `SHOP_EMAIL` | Alamat pengirim — harus sudah **verified sender** di Brevo |
| `NOTIFY_EMAIL` | Email owner/gudang untuk alert & rekap |

Setelah mengubah `.env`, **restart n8n** (stop lalu `npm start`) supaya nilainya terbaca.

## Telegram (±2 menit)

1. Di Telegram, chat **@BotFather** → kirim `/newbot` → beri nama → salin **token** → isi `TELEGRAM_BOT_TOKEN`.
2. Chat bot barumu sekali (kirim "halo").
3. Buka `https://api.telegram.org/bot<TOKEN>/getUpdates` → cari `"chat":{"id": 12345678` → isi `TELEGRAM_CHAT_ID`.

## Email (Brevo)

1. app.brevo.com → profil (kanan atas) → **SMTP & API** → tab **API keys** → *Generate a new API key* → isi `BREVO_API_KEY`.
2. **Senders, domains & dedicated IPs** → *Senders* → tambahkan alamat pengirim dan verifikasi lewat email → isi `SHOP_EMAIL` dengan alamat itu.
3. Isi `NOTIFY_EMAIL` dengan email yang menerima alert stok & rekap harian.

> Hanya mau salah satu? Biarkan variabelnya kosong — node itu gagal sendiri tanpa menghentikan node lainnya.

## Mengaktifkan

Workflow sudah aktif setelah `npm run import` + `npm run activate`.
Webhook "production" (`/webhook/...`) hanya menerima data saat workflow **Active**.

Tes cepat tanpa belanja:

```bash
curl -X POST http://localhost:5678/webhook/gentle-wear/stock-low -H "Content-Type: application/json" -d "{\"product\":\"Everyday crew tee\",\"color\":\"Black\",\"size\":\"M\",\"stock\":1,\"min_stock\":2,\"sku\":\"gw-101-black-m\"}"
```

## Mengubah isi pesan

Edit teksnya di `build-workflows.py`, jalankan `python build-workflows.py`, lalu `npm run import` lagi
(atau ubah langsung di editor n8n lalu *Download* workflow ke folder `workflows/`).
