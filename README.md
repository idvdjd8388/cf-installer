# 🚀 CF Panel Installer — نصب آسان پنل‌های V2Ray، VLESS، Trojan روی Cloudflare Workers

<p align="center">
  <img src="https://img.shields.io/badge/Version-v7.0.0-orange" alt="Version"/>
  <img src="https://img.shields.io/badge/Dashboard-Ready-green" alt="Status"/>
  <img src="https://img.shields.io/github/stars/idvdjd8388/cf-installer?style=social" alt="Stars"/>
  <img src="https://img.shields.io/github/license/idvdjd8388/cf-installer?label=License" alt="License"/>
</p>

---

## 📢 توضیح پروژه

یک ابزار تمام‌عیار برای استقرار خودکار انواع **پنل‌های وی‌پی‌اف** (V2Ray, VLESS, Trojan, VMESS) روی **Cloudflare Workers** از طریق مرورگر یا ترمینال — بدون نیاز به سرور، بدون پیچیدگی، بدون دردسر.

### ✨ امکانات

| ویژگی | توضیحات |
|-------|---------|
| 🌐 **وب‌اینترافیس حرفه‌ای** | مدرن، واکنش‌گرا، حالت تاریک/نور، سرویس ورکر هوشمند |
| 🛠️ **پشتیبانی از ۹ پنل** | نهان، ادگ‌تانل، سی‌اف‌نیو، ایدی‌تانل، فاکس‌کلاود، وی‌تی‌پنل، نواوا، آی‌ام‌سی‌اف، ورکر v2ray |
| 🔐 **دو حالت نصب** | عادی (Normal) یا مخفی (Obfuscated) با obfuscation ترکیبی |
| ⚡ **سرعت بالا** | درخواست‌های API همزمان با `Promise.all` |
| 🧠 **تشخیص هوشمند پنل** | ۵ لایه تشخیص: Binding → Env Vars → KV → Base64 Code → نام ورکر |
| 📦 **SUBNAME برای نواوا** | نوشتن خودکار config.json در KV بعد از استقرار |
| 🤖 **ربات تلگرام** | نصب از طریق ربات با منوی حالت نصب و SUBNAME |
| 🕵️ **فیلتر هوشمند** | صرف‌نظر از ورکرهای `cf-installer-bot` و `cf_installer` |

---

## 📋 لیست پنل‌های پشتیبانی شده

| # | نام پنل | شناسه | UUID؟ | SUBNAME؟ | حالت مخفی؟ |
|---:|---------|------|-------|----------|------------|
| 1 | **نهان (Nahan)** | `nahan` | ✅ | ❌ | ✅ |
| 2 | **ادگ‌تانل (EdgeTunnel)** | `edge` | ✅ | ❌ | ✅ |
| 3 | **سی‌اف‌نیو (CF-NEW)** | `cfnew` | ✅ | ❌ | ✅ |
| 4 | **ایدی‌تانل (EDtunnel)** | `edgtun` | ✅ | ❌ | ✅ |
| 5 | **فاکس‌کلاود (FoxCloud)** | `fox` | ✅ | ❌ | ✅ |
| 6 | **وی‌تی‌پنل (VTPanel)** | `vtpanel` | ✅ | ❌ | ❌ |
| 7 | **نواوا (Nova)** | `nova` | ✅ | ✅ | ✅ |
| 8 | **آی‌ام‌سی‌اف (AMCF)** | `amcf` | ✅ | ❌ | ✅ |
| 9 | **ورکر v2ray** | `v2ray` | ❌ | ❌ | ❌ |

---

## 🚀 شروع استفاده

### حالت وب (پیشنهادی)

۱. به [صفحه نصب](https://idvdjd8388.github.io/cf-installer/) مراجعه کنید.
۲. توکن API Cloudflare خود را وارد کنید (قالب `cfut_...`).
۳. یکی از ۹ پنل را انتخاب کنید.
۴. حالت نصب را انتخاب کنید: ⚡ **نصب عادی** یا 🔒 **Obfuscated**
۵. روی **نصب و فعالسازی** کلیک کنید.

> ✅ برای نواوا، فیلد نام سرویس (SUBNAME) نمایش داده می‌شود. خالی بگذارید برای مقدار پیش‌فرض (`NovaProxy`).

### حالت CLI

```bash
curl -fsSL https://raw.githubusercontent.com/idvdjd8388/cf-installer/main/install.sh | bash
```

### حالت ربات تلگرام

از طریق [@cf-installer-bot](https://t.me/cf-installer-bot) — انتخاب کنید:

```
ورکرهای من → + جدید → انتخاب پنل → حالت نصب → (در صورت نیاز: SUBNAME) → استقرار
```

---

## 🔑 ساخت توکن Cloudflare

توکن با دسترسی‌های زیر بسازید:

| دسترسی | نوع |
|--------|-----|
| **Account Cloudflare Workers** | `Edit` |
| **Zone Workers** | `Edit` |

لینک مستقیم: https://dash.cloudflare.com/profile/api-tokens

---

## 📦 ساختار فایل‌ها

| فایل | توضیح |
|------|-------|
| `index.html` | رابط کاربری وب |
| `sw.js` | سرویس ورکر (شبکه‌ی اولویت اول برای HTML، کش برای استاتیک) |
| `worker-backend.js` | Backend Worker — همه‌ی APIها (`/cf`, `/deploy`, `/list-workers`, `/get-subdomain`) |
| `bot.js` | ربات تلگرام با حالت نصب تعامتی |
| `install.sh` | اسکریپت CLI |
| `wrangler.toml` | تنظیمات استقرار Worker |

---

## 🔌 APIهای بک‌اند

| مسیر | روش | توضیح |
|------|-----|-------|
| `/health` | GET | بررسی وضعیت سرور |
| `/cf` | POST | پروکسی درخواست‌های Cloudflare API |
| `/deploy` | POST | استقرار پنل روی Worker |
| `/list-workers` | POST | لیست ورکرهای کاربر (فیلتر شده) |
| `/get-subdomain` | POST | رزولوشن subdomain اکانت |

---

## 🐛 عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| دکمه‌ها ظاهر نمی‌شن | Ctrl+F5 یا Clear Cache را بزنید (سرویس ورکر v7.0.0 به‌روز شده) |
| توکن نامعتبر | توکن را از https://dash.cloudflare.com/profile/api-tokens دوباره بسازید |
| پنل ایجاد نشد | مطمئن شوید حداقل ۱ Worker در حساب شما فعال است |
| ساب دامنه نشناخته شد | از حالت v2ray-worker یا EdgeTunnel استفاده کنید، سپس دوباره امتحان کنید |

---

## 📜 منابع و لینک‌های مفید

- 🌟 پروژه اصلی: https://github.com/idvdjd8388/cf-installer
- 📖 اسناد Cloudflare Workers: https://developers.cloudflare.com/workers/
- 💬 گفتگو درباره پنل‌ها: https://github.com/idvdjd8388/cf-installer/discussions
- 🐛 گزارش باگ‌ها: https://github.com/idvdjd8388/cf-installer/issues

---


---

## 🆕 نسخه v7.0.0 — تغییرات اصلی

- ✅ **API v1**: همه مسیرها به `/v1/...` منتقل شد (`/v1/deploy`, `/v1/list-workers`, `/v1/get-subdomain`, `/v1/delete-worker`, `/v1/cf`, `/v1/github`, `/v1/health`). مسیرهای قدیمی با `308 Redirect` به v1 هدایت می‌شوند.
- 🛡️ **Obfuscation پیشرفته**: کلید ۱۶ رقمی + رمزنگاری AES-GCM با Web Crypto API (جایگزین obfuscator ساده)
- 📊 **داشبورد مدیریت**: `dashboard.html` — لیست ورکرها از `/v1/list-workers` + حذف با `/v1/delete-worker`، ریسپانسیو و تم تیره/روشن
- 🧪 **تست واحد**: `vitest` + `miniflare` برای `worker-backend.js` — اجرای `npm test`
- 🐳 **محیط لوکال**: `docker-compose.yml` با `wrangler` و `nginx` + کانفیگ `nginx.conf`
- 🚀 **استقرار خودکار**: GitHub Action `.github/workflows/deploy.yml` روی push به `main` (wrangler deploy)
- 📚 **مستندات**: `CONTRIBUTING.md`, `SECURITY.md`, `.github/ISSUE_TEMPLATE/bug_report.yml`
- ⚠️ **مدیریت خطای دسته‌بندی‌شده**: کد `code` و `category` (`AUTH_ERROR`, `RATE_LIMIT_ERROR`, `QUOTA_ERROR`, `VALIDATION_ERROR`, `NOT_FOUND_ERROR`, `SERVER_ERROR`, `NETWORK_ERROR`) در همه پاسخ‌ها + نمایش در `index.html`/`install.sh`/`bot.js`

---

## 📦 نصب و اجرا (لوکال)

### با Docker Compose (پیشنهادی)

```bash
docker compose up --build
# Frontend: http://localhost:8080
# Backend API: http://localhost:8787/v1/health
# Bot: http://localhost:8789/health
```

`nginx` درخواست‌های `/v1/*` را به `wrangler-backend:8787` پراکسی می‌کند و مسیرهای قدیمی را 308 به `/v1` ریدایرکت می‌کند.

### بدون Docker

```bash
npm install
npm run dev        # wrangler dev --local
npm test           # vitest --run
```

---

## 🔌 API v1

| مسیر | روش | توضیح |
|------|-----|-------|
| `/health` | GET | سلامت (بدون نسخه‌بندی) |
| `/v1/health` | GET | سلامت v1 |
| `/v1/cf` | POST | پراکسی Cloudflare API |
| `/v1/github` | POST | دانلود سورس (هاست‌های مجاز) |
| `/v1/deploy` | POST | استقرار پنل |
| `/v1/get-subdomain` | POST | دریافت subdomain |
| `/v1/list-workers` | POST | لیست ورکرها (فیلتر شده) |
| `/v1/delete-worker` | POST | حذف ورکر `{token, workerName, accountId?}` |

> مسیرهای قدیمی (`/deploy`, `/list-workers`, ...) با **308 Redirect** به `/v1/...` هدایت می‌شوند.

### دسته‌بندی خطاها

هر پاسخ خطا شامل:

```json
{
  "error": "توکن نامعتبر ...",
  "code": "AUTH_FAILED",
  "category": "AUTH_ERROR",
  "details": { "...": "..." }
}
```

`category`: `AUTH_ERROR` | `RATE_LIMIT_ERROR` | `QUOTA_ERROR` | `VALIDATION_ERROR` | `NOT_FOUND_ERROR` | `SERVER_ERROR` | `NETWORK_ERROR`

---

## 📊 داشبورد مدیریت

فایل `dashboard.html` (لینک از `index.html`):

- ورودی توکن `cfut_*` → فراخوانی `/v1/list-workers`
- نمایش کارت‌های ورکر (نام، نوع پنل، آیکون، لینک)
- دکمه **حذف** → فراخوانی `/v1/delete-worker`
- ریسپانسیو، تم تیره/روشن هماهنگ با `index.html`

---

## 🔒 Obfuscation پیشرفته

- کلید ۱۶ رقمی تصادفی (`generateObfuscationKey()`)
- رمزنگاری AES-GCM با `crypto.subtle` + `PBKDF2` (salt ثابت `cf-installer-obfuscation-salt`, 1000 iteration)
- wrapper خودرمزگشا در کد مستقرشده
- fallback به `javascript-obfuscator` در صورت عدم دسترسی به Web Crypto
- در `worker-backend.js` (سرور)، `index.html` و `bot.js` پیاده‌سازی شده

---

## 🚀 استقرار خودکار (GitHub Actions)

فایل `.github/workflows/deploy.yml` روی `push` به `main`:

```yaml
- npm ci && npm test
- wrangler deploy worker-backend.js
- wrangler deploy bot.js
```

### تنظیم Secrets

در `GitHub → Settings → Secrets and variables → Actions`:

| Secret | توضیح |
|--------|-------|
| `CF_API_TOKEN` | توکن Cloudflare با دسترسی Workers Edit (ساخت از https://dash.cloudflare.com/profile/api-tokens) |
| `CF_ACCOUNT_ID` | شناسه حساب Cloudflare (از داشبورد → Workers → Overview) |

همچنین در `wrangler.toml`:

```toml
name = "cf-installer-bot"
main = "bot.js"
```

برای Backend جداگانه از `wrangler deploy worker-backend.js` استفاده می‌شود.

---

## 🧪 تست‌ها

```bash
npm install
npm test              # اجرای vitest
npm run test:coverage # پوشش
```

تست‌ها در `tests/worker-backend.test.js` شامل: سلامت، اعتبارسنجی توکن، دسته‌بندی خطا، ریدایرکت legacy، محافظت از `cf-installer-bot`، و CORS.

---

## 🤝 مشارکت

به [CONTRIBUTING.md](./CONTRIBUTING.md) مراجعه کنید. برای باگ از قالب `.github/ISSUE_TEMPLATE/bug_report.yml` استفاده کنید. باگ امنیتی را طبق [SECURITY.md](./SECURITY.md) خصوصی گزارش دهید.

---

## 📄 فایل‌های جدید v7

| فایل | توضیح |
|------|-------|
| `dashboard.html` | داشبورد مدیریت ورکرها |
| `CONTRIBUTING.md` | راهنمای مشارکت |
| `SECURITY.md` | سیاست امنیتی |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | قالب گزارش باگ |
| `.github/workflows/deploy.yml` | استقرار خودکار wrangler |
| `vitest.config.js` | پیکربندی تست |
| `tests/worker-backend.test.js` | تست‌های واحد |
| `package.json` | اسکریپت‌های npm + وابستگی‌ها |
| `docker-compose.yml` + `nginx.conf` | محیط لوکال |

## 📄 لایسنس

این نرم‌افزار منبع‌باز است و تحت **MIT License** منتشر شده است. برای استفاده از آن از قوانین کشور خود رعایت کنید.

---

<p align="center">
  <sub>⚡️ ساخته شده با ❤️ توسط <a href="https://github.com/idvdjd8388">idvdjd8388</a></sub>
</p>