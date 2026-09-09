# UMKM Kuliner — Sistem Digital Pemesanan Makanan

Aplikasi web mobile-first untuk UMKM kuliner: katalog menu, pemesanan, pembayaran QRIS/COD, realtime tracking, dan dashboard admin.

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript (App Router)
- **UI**: Tailwind CSS + shadcn/ui + Lucide Icons
- **Backend & DB**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime (WebSocket)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Deploy**: Vercel

## Setup

### 1. Clone & Install

```bash
npm install
```

### 2. Buat Proyek Supabase

1. Buat akun di [supabase.com](https://supabase.com)
2. Buat proyek baru
3. Jalankan migration SQL di **SQL Editor** Supabase:
   - `supabase/migrations/001_initial.sql` — schema utama
   - `supabase/migrations/002_seed.sql` — data awal (opsional)

### 3. Buat Storage Buckets di Supabase

Di **Storage** → **New Bucket**:
- `menu-images` — public bucket untuk foto menu
- `qris` — public bucket untuk gambar QRIS

### 4. Konfigurasi Environment

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi dengan kredensial Supabase kamu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Buat Admin User

Di Supabase **Authentication** → **Users** → **Invite user**:
- Masukkan email admin
- Setelah signup, record `profiles` akan otomatis dibuat dengan role `ADMIN`

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Halaman & Fitur

### Pelanggan (`/`)
- **Home** (`/`) — Menu, best seller, status toko
- **Keranjang** (`/cart`) — Manajemen item pesanan
- **Checkout** (`/checkout`) — Form pemesanan + QRIS/COD
- **Status Order** (`/order/[token]`) — Realtime order tracking
- **Toko** (`/store`) — Info toko, lokasi, jam buka
- **Pengaturan** (`/settings`) — Tema warna, kontak WhatsApp

### Admin (`/admin`)
- **Dashboard** — Statistik + chart penjualan 7 hari
- **Pesanan** (`/admin/orders`) — List + filter + realtime
- **Detail Pesanan** — Update status + verifikasi QRIS
- **Menu** (`/admin/menus`) — CRUD menu + foto + stok
- **Promo** (`/admin/promotions`) — CRUD promo nominal/persentase
- **Laporan** (`/admin/reports`) — Summary penjualan + top menu
- **Pengaturan** (`/admin/settings`) — Info toko + jam operasional + QRIS

### Login Admin
```
/auth/login
```

## Realtime Features

| Event | Publisher | Subscriber |
|-------|-----------|------------|
| Pesanan baru | Pelanggan checkout | Admin (dashboard + orders) |
| Status order berubah | Admin | Pelanggan (order page) |
| Pembayaran QRIS | Pelanggan "Sudah Bayar" | Admin (order detail) |
| Verifikasi pembayaran | Admin | Pelanggan (order page) |
| Stok menu berubah | Admin | Pelanggan (home page) |
| Pengaturan toko berubah | Admin | Pelanggan (store + home) |

## Build & Deploy

```bash
# Build
npm run build

# Deploy ke Vercel
vercel deploy
```

Jangan lupa set environment variables di Vercel dashboard.
