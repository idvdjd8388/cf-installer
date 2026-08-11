# 🚀 CF Installer

### نصب یک‌کلیکی پنل‌های VPN روی Cloudflare Worker

[![v5.4.1](https://img.shields.io/badge/version-v5.4.1-00e5a0?style=flat-square)](https://idvdjd8388.github.io/cf-installer/)
[![Panels](https://img.shields.io/badge/پنل‌ها-9_عدد-blue?style=flat-square)](#-پنل‌های-پشتیبانی-شده)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](#)

<p align="center">
  <a href="https://idvdjd8388.github.io/cf-installer/">
    <img src="https://img.shields.io/badge/🔥_اکنون_استفاده_کن-آبی?style=for-the-badge" alt="CF Installer">
  </a>
</p>

---

## 🎯 این چیه؟

یه ابزار ساده و رایگان که باهاش **پنل‌های VPN** رو فقط با **یک API Token** روی **Cloudflare Worker** نصب کنی.

**بدون نیاز به سرور، بدون هزینه، فقط Cloudflare!** 🎉

---

## ✨ چرا CF Installer؟

- ⚡ **سریع** — نصب پنل در کمتر از یک دقیقه
- 🎲 **امن** — اسامی Worker رندوم هستن (جلوگیری از فیلتر)
- 🔒 **امنیت بالا** — Origin Check + Whitelist هاست‌ها و مسیرها
- 🔗 **ساده** — لینک‌های مستقیم با دکمه کپی
- 🎨 **زیبا** — رابط کاربری مدرن و موبایل‌فرندلی
- 💰 **رایگان** — فقط API Token Cloudflare لازمه
- 🌍 **فارسی** — کاملاً فارسی و راست‌چین
- 📊 **نوار پیشرفت** — نمایش مراحل نصب به صورت زنده
- 🏷️ **برچسب پروتکل** — VLESS و Trojan روی هر پنل
- ❓ **راهنمای سریع** — توضیح مختصر با لمس/هاور
- 📱 **PWA** — قابل نصب روی صفحه اصلی گوشی
- 🗑️ **حذف Worker** — دکمه حذف بعد از نصب با تأیید امنیتی
- 🔄 **بروزرسانی** — آپدیت کد Worker با حفظ تنظیمات
- 🌙/☀️ **حالت تاریک/روشن** — تم قابل سوئیچ با ذخیره انتخاب
- 🟢 **تست اتصال** — بررسی فعال بودن Worker
- ⚡ **تست سرعت** — ۵ نمونه با نمایش min/max/avg
- 📋 **لیست ورکرها** — نمایش خودکار ورکرهای نصب شده با تشخیص نوع پنل

---

## 📦 پنل‌های پشتیبانی شده

| پنل | ⭐ ستاره | Storage | مسیر پنل |
|:---:|:---:|:---:|:---:|
| 🌙 **Nahan** | 3k+ | D1 | `/sync/dash` |
| ⚡ **EdgeTunnel** | 41.7k+ | KV | `/admin` |
| 🆕 **Cfnew** | 14.6k+ | KV | `/{UUID}` |
| 🚀 **Nova** | 3.2k+ | D1 + KV | `/admin` |
| 🌐 **EDtunnel** | 2.9k+ | — | `/{UUID}` |
| 🦊 FoxCloud | 151+ | — | /sub |
| 🇨🇳 amcf ⚠️ | 3.1k+ | KV | / |
| 🛡️ ZQ-VTPanel | 62+ | KV | / |
| 🔧 v2ray-worker | 195+ | KV | / |

> 💡 همه چیز **خودکار** ساخته میشه — D1، KV، UUID، رمز عبور!
>
> ⚠️ **amcf** نیاز به دامنه اختصاصی دارد

---

## 🤖 ربات تلگرام

برای نصب سریع‌تر از ربات تلگرام استفاده کنید:

آدرس ربات: [@Cf_Arshia_Bot](https://t.me/Cf_Arshia_Bot)

قابلیت‌ها:
- ✅ نصب خودکار پنل‌ها
- ✅ تست اتصال Worker
- ✅ حذف Worker
- ✅ بروزرسانی

آموزش:
۱. ربات رو باز کنید: [@Cf_Arshia_Bot](https://t.me/Cf_Arshia_Bot)
۲. `/start` بزنید
۳. توکن Cloudflare خود رو ارسال کنید
۴. پنل مورد نظر رو انتخاب کنید
۵. نصب خودکار انجام میشه!

---

## 🚀 چطوری استفاده کنم؟

### مرحله ۱: ساخت API Token
1. برید به [CF Installer](https://idvdjd8388.github.io/cf-installer/)
2. روی **🔑 ساخت توکن** بزنید (مجوزها خودکار انتخاب شده)
3. توکن رو کپی کنید

### مرحله ۲: نصب پنل
1. توکن رو وارد کنید (فرمت: `cfut_...`)
۲. یکی از ۹ پنل رو انتخاب کنید
3. روی **🚀 نصب و فعال‌سازی** بزنید — تمام! 🎉

### مرحله ۳: اتصال
- لینک VLESS/Trojan رو از نتیجه کپی کنید
- توی **V2rayNG** یا **Hiddify** وارد کنید
- **لذت ببرید!** 🚀

---

## 🏗️ معماری

```
┌─────────────────────┐
│   Installer (HTML)   │  ← GitHub Pages
│   رابط کاربری فارسی   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Backend Worker (CF) │  ← Cloudflare Worker
│  امنیت + پروکسی + نصب │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌────────┐ ┌────────┐
│ GitHub  │ │Cloudflare│
│  API    │ │   API   │
│دانلود کد│ │ساخت Worker│
└────────┘ └────────┘
```

---

## 🔒 امنیت

- ✅ **Origin Check** — فقط دامنه‌های مجاز اجازه دسترسی دارن
- ✅ **CORS محدود** — فقط دامنه‌های اینستالر
- ✅ **GitHub Proxy** — فقط هاست‌های مجاز GitHub
- ✅ **CF Proxy** — فقط مسیرهای مجاز Cloudflare API
- ✅ **فرمت توکن** — اعتبارسنجی فرمت `cfut_`
- ✅ **پاک کردن توکن** — بعد از نصب موفق، توکن از فرم پاک میشه

---

## 📋 جدول Storage و Variable

| پنل | D1 | KV | Variable |
|:---:|:---:|:---:|:---:|
| Nahan | `IOT_DB` | — | — |
| EdgeTunnel | — | `KV` | `ADMIN=admin` |
| Cfnew | — | `C` | `u=UUID` |
| Nova | `DB` | `KV` | `ADMIN=admin` |
| EDtunnel | — | — | `UUID` |
| FoxCloud | — | — | `UUID`, `PROXY_IP` |
| amcf | — | `amclubs` | `UUID` |
| VTPanel | — | `VTPanel` | — |
| v2ray-worker | — | `settings` | — |

---

## 📝 تغییرات

<details>
<summary><b>v5.1.3</b></summary>

- ✅ فیکس تشخیص نوع پنل (اولویت با PANEL_TYPE binding)
- ✅ جدا شدن دکمه‌های تست اتصال 🟢 و تست سرعت ⚡
- ✅ نمایش برچسب پروتکل و توضیح در لیست ورکرها
- ✅ آپدیت آیکون و استایل لیست ورکرها

</details>

<details>
<summary><b>v5.1.0</b></summary>

- ✅ اضافه شدن تشخیص خودکار نوع پنل از PANEL_TYPE binding
- ✅ جدا شدن تست اتصال و تست سرعت
- ✅ آپدیت UI لیست ورکرها

</details>

<details>
<summary><b>v5.0.0</b></summary>

- ✅ اضافه شدن لیست ورکرهای نصب شده
- ✅ تشخیص خودکار نوع پنل
- ✅ دکمه بروزرسانی و حذف برای هر ورکر
- ✅ تست سرعت و اتصال

</details>

<details>
<summary><b>v4.7.0</b></summary>

- ✅ اضافه شدن پنل **BPB Panel** (VLESS + Trojan + Warp + DoH — 12k ⭐)
- ✅ فیکس ساب‌دامین (API /workers/subdomain)
- ✅ فیکس propagation (حذف انتظار اضافی)
- ✅ فیکس BPB Error 1101 (@ts-nocheck + random vars)
- ✅ فیکس رمز admin (فقط nahan/edge/nova)
- ✅ فیکس speed test و testConnection (no-cors حذف شد)
- ✅ فیکس dashLink تکراری
- ✅ اضافه شدن CSS BPB panel card
- ✅ فیکس VTPanel PANEL_TYPE
- ✅ فیکس token validation
- ✅ اضافه شدن BPB apiToken

</details>

## ⚡ نصب سریع (CLI)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/arshiyashams675-sudo/cf-installer/main/install.sh)
```

| پلتفرم | روش اجرا |
|---------|----------|
| 🐧 Linux | دستور بالا |
| 📱 Android | [Termux](https://f-droid.org/packages/com.termux/) نصب کن → pkg install curl → دستور بالا |
| 🍎 macOS | دستور بالا (curl پیش‌فرض هست) |
| 🪟 Windows | [Git Bash](https://git-scm.com/download/win) یا [WSL](https://aka.ms/wsl) → دستور بالا |

**مراحل:**
1. لینک ساخت توکن نمایش داده میشه → مرورگر باز کن
2. Continue to summary → Create Token بزن
3. توکن رو کپی کن و برگرد
4. پنل رو انتخاب کن
5. تمام!

---

## ⚠️ نکات مهم

- 💡 API Token باید با `cfut_` شروع بشه
- 💡 اسامی Worker **رندوم** هستن (مثلاً `srv-qr0gpz838`)
- 💡 **چند دقیقه صبر کنید** تا Worker فعال بشه
- 💡 کد هر پنل **مستقیم از GitHub** دانلود میشه (آخرین نسخه)
- 💡 توکن بعد از نصب موفق **خودکار پاک** میشه
- 💡 اپ روی **صفحه اصلی گوشی** نصب میشه (PWA)

---

## 🔗 لینک‌ها

| لینک | آدرس |
|:---:|:---:|
| 🌐 **Installer** | [idvdjd8388.github.io/cf-installer](https://idvdjd8388.github.io/cf-installer/) |
| 📦 **GitHub Repo** | [idvdjd8388/cf-installer](https://github.com/idvdjd8388/cf-installer) |
| ⚙️ **Backend Worker** | [cf-installer-backend.cf-installer.workers.dev](https://cf-installer-backend.cf-installer.workers.dev) |
| 🔑 **ساخت API Token** | [dash.cloudflare.com](https://dash.cloudflare.com/profile/api-tokens) |

---

## 🛠️ مشارکت

اگه میخوای کمک کنی:

1. Fork کن 🔱
2. Branch بساز 🌿
3. Commit کن 📝
4. Pull Request بزن 🚀

---

## 📄 لایسنس

MIT License — آزاد و رایگان برای همه! 🎉

---

<p align="center">
  ساخته شده با ❤️ توسط <a href="https://github.com/arshiyashams675-sudo">Arshia</a>
</p>
