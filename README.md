# 🚀 CF Panel Installer — نصب آسان پنل‌های V2Ray، VLESS، Trojan روی Cloudflare Workers

<p align="center">
  <img src="https://img.shields.io/badge/Version-v6.0.0-orange" alt="Version"/>
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
| دکمه‌ها ظاهر نمی‌شن | Ctrl+F5 یا Clear Cache را بزنید (سرویس ورکر v6 به‌روز شده) |
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

## 📄 لایسنس

این نرم‌افزار منبع‌باز است و تحت **MIT License** منتشر شده است. برای استفاده از آن از قوانین کشور خود رعایت کنید.

---

<p align="center">
  <sub>⚡️ ساخته شده با ❤️ توسط <a href="https://github.com/idvdjd8388">idvdjd8388</a></sub>
</p>