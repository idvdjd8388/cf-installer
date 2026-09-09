# راهنمای مشارکت — Contributing Guide

از علاقه شما به مشارکت در **CF Installer** سپاسگزاریم! این سند مراحل استاندارد مشارکت را توضیح می‌دهد.

## 🚀 شروع سریع

1. ریپو را Fork کنید و clone کنید:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cf-installer.git
   cd cf-installer
   ```

2. یک branch جدید بسازید:
   ```bash
   git checkout -b feat/your-feature
   # یا fix/bug-name
   ```

3. تغییرات را اعمال و تست کنید:
   ```bash
   npm install
   npm test
   ```

4. کامیت با Conventional Commits:
   ```bash
   git commit -m "feat: add nova SUBNAME validation"
   git push origin feat/your-feature
   ```

5. Pull Request باز کنید — قالب PR را پر کنید.

## 📋 استانداردها

| حوزه | قانون |
|------|-------|
| کد | ESLint + Prettier، بدون `console.log` در production |
| کامیت | `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:` |
| تست | هر feature جدید حداقل 1 تست vitest |
| مستندات | README و CHANGELOG را به‌روز کنید |
| امنیت | توکن `cfut_*` را هرگز commit نکنید — از `wrangler secret` استفاده کنید |

## 🧪 تست محلی

```bash
# اجرای Worker محلی
npx wrangler dev --local

# تست واحد
npm test
npm run test:coverage
```

## 🐛 گزارش باگ

از قالب `.github/ISSUE_TEMPLATE/bug_report.yml` استفاده کنید. لاگ کامل + نسخه مرورگر/Node را ذکر کنید.

## 🔒 امنیت

باگ امنیتی؟ مستقیم به بخش [SECURITY.md](./SECURITY.md) مراجعه کنید — در Issue عمومی منتشر نکنید.

## 📜 مجوز

با مشارکت، موافقت می‌کنید کد شما تحت **MIT License** منتشر شود.

---

**زبان:** فارسی یا انگلیسی — هر دو پذیرفته است. پاسخ‌ها معمولاً در 48 ساعت.
