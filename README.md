# 🚀 CF Panel Installer

<p align="center">
  <img src="https://img.shields.io/badge/Version-v7.0.0-3b82f6?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/API-v1-22c55e?style=for-the-badge" alt="API"/>
  <img src="https://img.shields.io/badge/Tests-11%20passed-brightgreen?style=flat" alt="Tests"/>
  <br/>
  <a href="https://idvdjd8388.github.io/cf-installer/"><strong>🌐 نصب‌کننده</strong></a> •
  <a href="https://idvdjd8388.github.io/cf-installer/dashboard.html">📊 داشبورد</a> •
  <a href="https://t.me/Cf_Arshia_Bot">🤖 ربات</a>
</p>

> استقرار خودکار ۹ پنل VPN روی **Cloudflare Workers** — بدون سرور، از مرورگر، ترمینال یا تلگرام.

---

## ✨ ویژگی‌ها

- 🌐 وب‌اپ واکنش‌گرا + PWA + تم تیره/روشن
- 🛠️ ۹ پنل — ۵ لایه تشخیص هوشمند
- 🔐 دو حالت نصب: عادی / Obfuscated (کلید ۱۶ رقمی + AES-GCM)
- 📦 SUBNAME خودکار برای Nova
- 🤖 ربات تلگرام + 📊 داشبورد مدیریت
- ⚡ API موازی + 🧪 ۱۱ تست + 🐳 Docker

## 📋 پنل‌ها

| # | پنل | شناسه | UUID | SUBNAME | Obfuscated |
|---:|------|-------|------|---------|:---:|
| 1 | نهان | `nahan` | ✅ | ❌ | ✅ |
| 2 | ادج‌تانل | `edge` | ✅ | ❌ | ✅ |
| 3 | سی‌اف‌نیو | `cfnew` | ✅ | ❌ | ✅ |
| 4 | ایدی‌تانل | `edgtun` | ✅ | ❌ | ✅ |
| 5 | فاکس‌کلاود | `fox` | ✅ | ❌ | ✅ |
| 6 | وی‌تی‌پنل | `vtpanel` | ✅ | ❌ | ❌ |
| 7 | نواوا | `nova` | ✅ | ✅ | ✅ |
| 8 | آی‌ام‌سی‌اف | `amcf` | ✅ | ❌ | ✅ |
| 9 | v2ray | `v2ray` | ❌ | ❌ | ❌ |

---

## 🚀 شروع سریع

**۱. وب (پیشنهادی)**

[صفحه نصب](https://idvdjd8388.github.io/cf-installer/) → توکن `cfut_...` → انتخاب پنل → حالت نصب → نصب

**۲. ترمینال**

```bash
curl -fsSL https://raw.githubusercontent.com/idvdjd8388/cf-installer/main/install.sh | bash
```

<details>
<summary>📖 راهنمای کامل CLI — کلیک کنید</summary>

**روش ۱: یک‌خطی**

```bash
curl -fsSL https://raw.githubusercontent.com/idvdjd8388/cf-installer/main/install.sh | bash
```

**روش ۲: دانلود**

```bash
wget https://raw.githubusercontent.com/idvdjd8388/cf-installer/main/install.sh
chmod +x install.sh
./install.sh
```

جریان: توکن → انتخاب پنل ۱-۹ → حالت (۱ عادی / ۲ Obfuscated) → SUBNAME برای Nova → دیپلوی

| حالت | توضیح |
|------|-------|
| `1` عادی | بدون رمزنگاری |
| `2` Obfuscated | کلید ۱۶ رقمی + AES-GCM — کلید در پاسخ نمایش داده می‌شود |

خطاها با `Code / Category` نمایش داده می‌شوند (`AUTH_ERROR` → توکن را دوباره بسازید، `RATE_LIMIT_ERROR` → صبر کنید، `QUOTA_ERROR` → Worker حذف کنید).

</details>

**۳. تلگرام**

[@cf-installer-bot](https://t.me/Cf_Arshia_Bot) → `/token` → `/deploy` → `/workers` → `/delete`

---

## 🔑 توکن Cloudflare

| دسترسی | سطح |
|--------|-----|
| Account → Workers | Edit |
| Zone → Workers | Edit |
| Account → D1 / KV | Edit |
| User → User Details | Read |

https://dash.cloudflare.com/profile/api-tokens

---

## 📦 ساختار فایل‌ها

| فایل | نقش |
|------|-----|
| `index.html` | فرانت‌اند |
| `dashboard.html` | داشبورد مدیریت |
| `worker-backend.js` | بک‌اند `/v1/*` |
| `bot.js` | ربات تلگرام |
| `install.sh` | CLI |
| `sw.js` + `manifest.json` | PWA |
| `docker-compose.yml` | لوکال |

---

## 🔌 API

| مسیر | توضیح |
|------|-------|
| `GET /health` | سلامت |
| `POST /v1/deploy` | استقرار |
| `POST /v1/list-workers` | لیست ورکرها |
| `POST /v1/delete-worker` | حذف |
| `POST /v1/get-subdomain` | ساب‌دامین |
| `POST /v1/cf` / `POST /v1/github` | پراکسی |

> مسیرهای قدیمی با `308` به `/v1` ریدایرکت می‌شوند.

<details>
<summary>📖 جزئیات API و خطاها</summary>

هر خطا: `{ error, code, category }`

| Category | معنی |
|----------|------|
| `AUTH_ERROR` | توکن/دسترسی |
| `RATE_LIMIT_ERROR` | محدودیت نرخ |
| `QUOTA_ERROR` | سقف Worker |
| `VALIDATION_ERROR` | ورودی |
| `NOT_FOUND_ERROR` | یافت نشد |
| `SERVER_ERROR` / `NETWORK_ERROR` | سرور/شبکه |

</details>

<details>
<summary>🔒 Obfuscation پیشرفته</summary>

کلید ۱۶ رقمی → مشتق AES-256 با `PBKDF2` → رمزنگاری `AES-GCM` → wrapper خودرمزگشا. در `worker-backend.js`, `index.html`, `bot.js` پیاده‌سازی شده، fallback به `javascript-obfuscator`.

</details>

<details>
<summary>🐳 اجرای محلی & تست</summary>

```bash
# Docker
docker compose up --build  # :8080 frontend, :8787 API, :8789 bot

# بدون Docker
npm install
npm run dev     # wrangler dev --local
npm test        # 11 tests
```

</details>

<details>
<summary>🚀 استقرار خودکار (CI)</summary>

`.github/workflows/deploy.yml` روی `push` به `main` → `npm test` → `wrangler deploy`.

Secrets: `CF_API_TOKEN` / `CF_ACCOUNT_ID` در `Settings → Secrets → Actions`.

</details>

---

## 🐛 عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| دکمه‌ها نیست | `Ctrl+F5` — SW v9 |
| `AUTH_ERROR` | توکن را دوباره بسازید |
| `QUOTA_ERROR` | از داشبورد Worker حذف کنید |

## 🤝 مشارکت

- [CONTRIBUTING.md](./CONTRIBUTING.md) — راهنمای PR
- [SECURITY.md](./SECURITY.md) — گزارش خصوصی باگ امنیتی
- قالب باگ: `.github/ISSUE_TEMPLATE/bug_report.yml`

---

## 🆕 تغییرات

**v7.0.0** — API v1, Obfuscation ۱۶ رقمی, داشبورد, تست, Docker, CI, خطای دسته‌بندی‌شده, PWA

**v6.0.2** — SW refresh

[تاریخچه کامل](../../commits/main)

---

## 📄 لایسنس

MIT — [idvdjd8388](https://github.com/idvdjd8388)

<p align="center"><sub>⚡️ PRها خوش‌آمدند!</sub></p>
