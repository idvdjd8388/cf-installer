# 🚀 CF Panel Installer — نصب آسان پنل‌های V2Ray، VLESS، Trojan روی Cloudflare Workers

<p align="center">
  <img src="https://img.shields.io/badge/Version-v7.0.0-3b82f6?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/API-v1-22c55e?style=for-the-badge" alt="API v1"/>
  <img src="https://img.shields.io/badge/Dashboard-Ready-00d4aa?style=for-the-badge" alt="Dashboard"/>
  <br/>
  <img src="https://img.shields.io/github/stars/idvdjd8388/cf-installer?style=social" alt="Stars"/>
  <img src="https://img.shields.io/github/license/idvdjd8388/cf-installer?label=License" alt="License"/>
  <img src="https://img.shields.io/badge/Tests-11%20passed-brightgreen" alt="Tests"/>
</p>

<p align="center">
  <a href="https://idvdjd8388.github.io/cf-installer/"><strong>🌐 ورود به نصب‌کننده</strong></a> •
  <a href="https://idvdjd8388.github.io/cf-installer/dashboard.html">📊 داشبورد مدیریت</a> •
  <a href="https://t.me/Cf_Arshia_Bot">🤖 ربات تلگرام</a>
</p>

---

## 📑 فهرست

- [درباره پروژه](#-درباره-پروژه)
- [ویژگی‌ها](#-ویژگیها)
- [پنل‌های پشتیبانی‌شده](#-پنلهای-پشتیبانیشده)
- [شروع سریع](#-شروع-سریع)
- [ساخت توکن Cloudflare](#-ساخت-توکن-cloudflare)
- [ساختار فایل‌ها](#-ساختار-فایلها)
- [API v1](#-api-v1)
- [داشبورد مدیریت](#-داشبورد-مدیریت)
- [Obfuscation پیشرفته](#-obfuscation-پیشرفته)
- [اجرای محلی](#-اجرای-محلی)
- [استقرار خودکار](#-استقرار-خودکار)
- [تست‌ها](#-تستها)
- [مشارکت](#-مشارکت)
- [عیب‌یابی](#-عیب-یابی)
- [تغییرات v7.0.0](#-تغییرات-v700)
- [لایسنس](#-لایسنس)

---

## 📢 درباره پروژه

ابزاری تمام‌عیار برای **استقرار خودکار ۹ پنل VPN** (V2Ray, VLESS, Trojan, VMESS) روی **Cloudflare Workers** — بدون سرور، بدون پیچیدگی، مستقیم از مرورگر، ترمینال یا تلگرام.

> **v7.0.0** — بازنویسی کامل با `API v1`، رمزنگاری `Web Crypto`، داشبورد مدیریت، تست و Docker.

---

## ✨ ویژگی‌ها

| ویژگی | توضیح |
|-------|-------|
| 🌐 **وب‌اینترفیس حرفه‌ای** | واکنش‌گرا، تم تیره/روشن، PWA با `manifest.json` و `sw.js` هوشمند |
| 🛠️ **۹ پنل** | نهان، ادج‌تانل، سی‌اف‌نیو، ایدی‌تانل، فاکس‌کلاود، وی‌تی‌پنل، نواوا، آی‌ام‌سی‌اف، v2ray |
| 🔐 **دو حالت نصب** | ⚡ عادی یا 🔒 Obfuscated با کلید ۱۶ رقمی + AES-GCM |
| ⚡ **سرعت بالا** | درخواست‌های موازی با `Promise.all` |
| 🧠 **تشخیص هوشمند** | ۵ لایه: `PANEL_TYPE` → Env Vars → KV/D1 → محتوای کد → نام ورکر |
| 📦 **SUBNAME نواوا** | نوشتن خودکار `config.json` در KV |
| 🤖 **ربات تلگرام** | منوی تعاملی نصب + نمایش کلید Obfuscation |
| 🕵️ **فیلتر هوشمند** | حذف `cf-installer-bot` از لیست ورکرها |
| 📊 **داشبورد** | مدیریت ورکرها + حذف با `/v1/delete-worker` |
| 🧪 **تست** | `vitest` با ۱۱ تست |
| 🐳 **Docker** | `docker-compose.yml` + `nginx` برای لوکال |

---

## 📋 پنل‌های پشتیبانی‌شده

| # | نام پنل | شناسه | UUID | SUBNAME | Obfuscated |
|---:|---------|-------|------|:-------:|:----------:|
| 1 | **نهان (Nahan)** | `nahan` | ✅ | ❌ | ✅ |
| 2 | **ادج‌تانل (EdgeTunnel)** | `edge` | ✅ | ❌ | ✅ |
| 3 | **سی‌اف‌نیو (CF-NEW)** | `cfnew` | ✅ | ❌ | ✅ |
| 4 | **ایدی‌تانل (EDtunnel)** | `edgtun` | ✅ | ❌ | ✅ |
| 5 | **فاکس‌کلاود (FoxCloud)** | `fox` | ✅ | ❌ | ✅ |
| 6 | **وی‌تی‌پنل (VTPanel)** | `vtpanel` | ✅ | ❌ | ❌ |
| 7 | **نواوا (Nova)** | `nova` | ✅ | ✅ | ✅ |
| 8 | **آی‌ام‌سی‌اف (AMCF)** | `amcf` | ✅ | ❌ | ✅ |
| 9 | **ورکر v2ray** | `v2ray` | ❌ | ❌ | ❌ |

---

## 🚀 شروع سریع

### ۱) حالت وب (پیشنهادی)

۱. به [صفحه نصب](https://idvdjd8388.github.io/cf-installer/) بروید
۲. توکن `cfut_...` را وارد و **بررسی توکن** را بزنید
۳. پنل + حالت نصب (عادی/Obfuscated) را انتخاب کنید
۴. برای Nova فیلد `SUBNAME` را پر کنید (پیش‌فرض `NovaProxy`)
۵. **نصب و فعال‌سازی** → لینک پنل و داشبورد نمایش داده می‌شود

### ۲) حالت CLI

```bash
curl -fsSL https://raw.githubusercontent.com/idvdjd8388/cf-installer/main/install.sh | bash
# → انتخاب پنل ۱-۹ → حالت نصب → SUBNAME (برای Nova) → دیپلوی
```

### ۳) ربات تلگرام

[@cf-installer-bot](https://t.me/Cf_Arshia_Bot)

```
/token  → تنظیم توکن
/deploy → نصب پنل جدید
/workers → لیست ورکرها
/delete → حذف ورکر
/help   → راهنما
```

---

## 🔑 ساخت توکن Cloudflare

توکن را با دسترسی‌های زیر بسازید:

| دسترسی | سطح |
|--------|-----|
| **Account → Cloudflare Workers** | `Edit` |
| **Zone → Workers** | `Edit` |
| **Account → D1** | `Edit` |
| **Account → Workers KV Storage** | `Edit` |
| **User → User Details** | `Read` |

🔗 **لینک مستقیم ساخت:** https://dash.cloudflare.com/profile/api-tokens

> توکن با `cfut_` شروع می‌شود. آن را هرگز در گیت کامیت نکنید — از `wrangler secret` یا GitHub Secrets استفاده کنید.

---

## 📦 ساختار فایل‌ها

| فایل | توضیح |
|------|-------|
| `index.html` | فرانت‌اند اصلی (v7.0.0, API v1, Obfuscation) |
| `dashboard.html` | داشبورد مدیریت ورکرها (`/v1/list-workers` + حذف) |
| `worker-backend.js` | بک‌اند Worker — تمام APIهای `/v1/*` + Obfuscation + دسته‌بندی خطا |
| `bot.js` | ربات تلگرام (D1, حالت نصب تعاملی) |
| `install.sh` | اسکریپت CLI (v7, API v1, نمایش کد خطا) |
| `sw.js` | Service Worker `v9` — کش هوشمند + PWA |
| `manifest.json` | مانیفست PWA |
| `wrangler.toml` | تنظیمات Wrangler (`cf-installer-bot`) |
| `docker-compose.yml` + `nginx.conf` | محیط لوکال |
| `package.json` + `vitest.config.js` | تست و اسکریپت‌ها |
| `tests/worker-backend.test.js` | ۱۱ تست واحد |

---

## 🔌 API v1

> **نسخه‌بندی:** همه مسیرها به جز `/health` زیر `/v1` هستند. مسیرهای قدیمی (`/deploy`, `/list-workers`...) با **308 Redirect** به `/v1` هدایت می‌شوند و تا اطلاع بعدی سازگار باقی می‌مانند.

| مسیر | روش | توضیح |
|------|-----|-------|
| `/health` | GET | سلامت (بدون نسخه) |
| `/v1/health` | GET | سلامت v1 |
| `/v1/cf` | POST | پراکسی Cloudflare API (هدر `X-CF-Path`) |
| `/v1/github` | POST | دانلود سورس (هدر `X-GitHub-Url`, هاست‌های مجاز) |
| `/v1/deploy` | POST | استقرار پنل `{token, panelType, installMode, subname?}` |
| `/v1/get-subdomain` | POST | دریافت subdomain `{token, accountId?}` |
| `/v1/list-workers` | POST | لیست ورکرها `{token}` — فیلتر شده + تشخیص ۵ لایه |
| `/v1/delete-worker` | POST | حذف ورکر `{token, workerName, accountId?}` — محافظت از `cf-installer-bot` |

### دسته‌بندی خطاها

هر پاسخ خطا شامل `code` و `category` است:

```json
{
  "error": "توکن نامعتبر: Authentication error",
  "code": "AUTH_FAILED",
  "category": "AUTH_ERROR"
}
```

| Category | معنی | نمونه |
|----------|------|-------|
| `AUTH_ERROR` | احراز هویت/دسترسی | توکن اشتباه، دسترسی ناکافی |
| `RATE_LIMIT_ERROR` | محدودیت نرخ | 429, 11006 |
| `QUOTA_ERROR` | سهمیه | سقف Worker پر شد (10026) |
| `VALIDATION_ERROR` | ورودی | فرمت توکن، پنل نامعتبر |
| `NOT_FOUND_ERROR` | یافت نشد | حساب/سورس/ساب‌دامین |
| `SERVER_ERROR` | سرور CF | 5xx |
| `NETWORK_ERROR` | شبکه | timeout, fetch failed |

این دسته‌بندی در `index.html`, `install.sh` و `bot.js` به صورت فارسی نمایش داده می‌شود.

---

## 📊 داشبورد مدیریت

- **آدرس:** [idvdjd8388.github.io/cf-installer/dashboard.html](https://idvdjd8388.github.io/cf-installer/dashboard.html) — لینک از هدر صفحه اصلی
- **کارکرد:** ورودی `cfut_...` → `POST /v1/list-workers` → کارت‌های ورکر (آیکون، نام، نوع، لینک) → دکمه‌های **باز کردن / کپی / حذف**
- **حذف:** `POST /v1/delete-worker` — با تایید کاربر و محافظت از ورکر سیستمی
- **طراحی:** ریسپانسیو، تم تیره/روشن هماهنگ، بدون نیاز به لاگین

---

## 🔒 Obfuscation پیشرفته

جایگزین `javascript-obfuscator` ساده:

1. تولید کلید **۱۶ رقمی تصادفی** (`generateObfuscationKey()`)
2. مشتق کلید AES-256 با `PBKDF2` (salt=`cf-installer-obfuscation-salt`, 1000 iteration, SHA-256)
3. رمزنگاری `AES-GCM` با IV ۱۲ بایت + بسته‌بندی `base64`
4. تزریق wrapper خودرمزگشا در ابتدای کد مستقرشده
5. fallback به `javascript-obfuscator` در صورت عدم دسترسی به `Web Crypto`

> در هر سه لایه پیاده‌سازی شده: `worker-backend.js` (سرور)، `index.html` و `bot.js` (کلاینت). کلید در پاسخ `obfuscationKey` برگردانده می‌شود (`XXXX****` برای نمایش).

---

## 🐳 اجرای محلی

### با Docker Compose (پیشنهادی)

```bash
docker compose up --build
# Frontend + Dashboard: http://localhost:8080
# Backend API:        http://localhost:8787/v1/health
# Bot:                http://localhost:8789/health
```

`nginx` درخواست‌های `/v1/*` را به `wrangler-backend:8787` پراکسی و مسیرهای قدیمی را `308` به `/v1` ریدایرکت می‌کند.

### بدون Docker

```bash
npm install
npm run dev          # wrangler dev --local
npm test             # vitest --run
npm run test:coverage
```

---

## 🚀 استقرار خودکار

فایل `.github/workflows/deploy.yml` روی `push` به `main`:

```yaml
- checkout + setup-node 20
- npm ci && npm test
- wrangler deploy worker-backend.js
- wrangler deploy bot.js
```

### تنظیم Secrets

`GitHub → Settings → Secrets and variables → Actions → New repository secret`

| Secret | کجا پیدا کنم |
|--------|--------------|
| `CF_API_TOKEN` | https://dash.cloudflare.com/profile/api-tokens → Create Token → Workers Edit |
| `CF_ACCOUNT_ID` | Dashboard → Workers & Pages → Overview → Account ID (نوار آدرس) |

`wrangler.toml`:

```toml
name = "cf-installer-bot"
main = "bot.js"
compatibility_date = "2024-09-22"
```

> **نکته:** اگر PAT شما `workflow` scope ندارد، فایل workflow را دستی از GitHub UI بسازید (`.github/workflows/deploy.yml`).

---

## 🧪 تست‌ها

```bash
npm install
npm test              # اجرای ۱۱ تست
npm run test:coverage # گزارش پوشش
```

| فایل | پوشش |
|------|------|
| `tests/worker-backend.test.js` | سلامت, اعتبارسنجی توکن, دسته‌بندی خطا, ریدایرکت legacy, محافظت `cf-installer-bot`, CORS |

---

## 🤝 مشارکت

به [CONTRIBUTING.md](./CONTRIBUTING.md) مراجعه کنید.

- برای باگ: از قالب `.github/ISSUE_TEMPLATE/bug_report.yml` استفاده کنید
- برای امنیت: طبق [SECURITY.md](./SECURITY.md) **خصوصی** گزارش دهید، نه در Issue عمومی
- کامیت‌ها: `feat:`, `fix:`, `docs:`, `chore:`, `test:` (Conventional Commits)

---

## 🐛 عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| دکمه‌ها نمایش داده نمی‌شوند | `Ctrl+F5` یا Clear Cache — SW نسخه `v9` است |
| توکن نامعتبر (`AUTH_ERROR`) | توکن را با دسترسی‌های جدول بالا دوباره بسازید |
| پنل ایجاد نشد (`QUOTA_ERROR`) | سقف Worker پر است — یکی را از داشبورد حذف کنید |
| ساب‌دامین یافت نشد (`NOT_FOUND_ERROR`) | یک Worker دستی در داشبورد CF بسازید، سپس دوباره تست کنید |
| محدودیت نرخ (`RATE_LIMIT_ERROR`) | ۱–۲ دقیقه صبر کنید |

---

## 📜 منابع

- 🌟 پروژه: https://github.com/idvdjd8388/cf-installer
- 📖 مستندات Workers: https://developers.cloudflare.com/workers/
- 💬 گفتگو: https://github.com/idvdjd8388/cf-installer/discussions
- 🐛 باگ‌ها: https://github.com/idvdjd8388/cf-installer/issues

---

## 🆕 تغییرات

### v7.0.0 (فعلی)

- ✅ **API v1** با `308 Redirect` سازگار
- 🛡️ **Obfuscation** کلید ۱۶ رقمی + AES-GCM
- 📊 **داشبورد** `dashboard.html` + `/v1/delete-worker`
- 🧪 **تست** vitest ۱۱ تست
- 🐳 **Docker** + nginx
- 🚀 **CI** wrangler deploy
- 📚 **مستندات** CONTRIBUTING/SECURITY/bug_report
- ⚠️ **خطای دسته‌بندی‌شده** با `code/category`
- 🎨 **PWA** manifest + SW v9

### v6.0.2

- Force SW cache refresh, دکمه‌های نصب

[تاریخچه کامل کامیت‌ها](../../commits/main)

---

## 📄 لایسنس

MIT License — استفاده آزاد با رعایت قوانین کشور خود.

---

<p align="center">
  <sub>⚡️ ساخته شده با ❤️ توسط <a href="https://github.com/idvdjd8388">idvdjd8388</a> — PRها خوش‌آمدند!</sub>
</p>
