export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health' || url.pathname === '/v1/health') return new Response(JSON.stringify({ ok: true, version:'v1' }), { headers: { 'Content-Type': 'application/json' } });
    if (url.pathname === '/set-webhook') {
      const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${url.origin}/webhook`, allowed_updates: ['message', 'callback_query'] })
      });
      const d = await r.json();
      return new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/webhook' && request.method === 'POST') {
      if(env.BOT_SECRET && request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.BOT_SECRET) return new Response('forbidden',{status:403});
      const update = await request.json();
      try { await handleUpdate(update, env); } catch (e) { console.error('Update error:', e); }
      return new Response('ok');
    }
    return new Response('Not found', { status: 404 });
  }
};

const BACKEND = 'https://cf-installer-backend.cf-installer.workers.dev';
const PANELS = [
  { key: 'nahan', name: 'Nahan', icon: '🌙' },
  { key: 'edge', name: 'EdgeTunnel', icon: '⚡' },
  { key: 'nova', name: 'Nova', icon: '🚀' },
  { key: 'cfnew', name: 'Cfnew', icon: '🌟' },
  { key: 'edgtun', name: 'EDtunnel', icon: '🌍' },
  { key: 'fox', name: 'FoxCloud', icon: '🦊' },
  { key: 'amcf', name: 'AMCF', icon: '🇨🇳' },
  { key: 'vtpanel', name: 'VTPanel', icon: '🛡️' },
  { key: 'v2ray', name: 'v2ray-worker', icon: '🐸' }
];

function formatCFError(d){
  if(!d) return 'خطای ناشناخته';
  if(d.code || d.category) return `${d.error||d.message||'خطا'} [${d.code||''} / ${d.category||''}]`;
  return d.error||d.message||'خطا';
}

async function handleUpdate(update, env) {
  if (update.callback_query) return handleCallback(update.callback_query, env);
  const msg = update.message;
  if (!msg || !msg.from) return;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const user = msg.from;

  if (user.is_bot) return;
  await ensureUser(chatId, user, env);
  const state = await getUserState(chatId, env);
  if (state === 'waiting_token') return handleTokenInput(chatId, text, env);
  if (state && state.startsWith('waiting_subname:')) {
    const mode = state.split(':')[1];
    return deployPanel(chatId, 'nova', mode, text, env);
  }

  if (text === '/start') return sendMsg(chatId, `🔥 *CF Installer Bot v7*\n\nیه ابزار ساده برای نصب پنل‌های VPN روی Cloudflare Worker.\n\n📋 *دستورات:*\n/token — تنظیم توکن CF\n/deploy — نصب پنل جدید\n/workers — لیست ورکرها\n/delete — حذف ورکر\n/help — راهنما\n\nAPI v1 • Obfuscation با کلید ۱۶ رقمی`, env);
  if (text === '/help') return sendMsg(chatId, `📋 *راهنمای استفاده*\n\n۱. اول با /token توکن Cloudflare رو تنظیم کنید\n۲. با /deploy یکی از ۹ پنل رو نصب کنید\n۳. با /workers لیست ورکرهای نصب شده رو ببینید\n۴. با /delete ورکر را حذف کنید\n\n⚠️ توکن باید با cfut_ شروع بشه\n🔑 توکن رو از dashboard.cloudflare.com بگیرید\n🔒 حالت Obfuscated با کلید ۱۶ رقمی و Web Crypto AES-GCM`, env);
  if (text === '/token') return sendTokenFlow(chatId, env);
  if (text === '/deploy') return sendDeployFlow(chatId, env);
  if (text === '/workers') return sendWorkersFlow(chatId, env);
  if (text === '/delete') return sendDeleteFlow(chatId, env);
  await sendMsg(chatId, '❓ دستور نامعتبر. از /help استفاده کنید.', env);
}

async function handleCallback(cb, env) {
  const chatId = cb.message.chat.id;
  const data = cb.data;
  await answerCb(cb.id, env);

  if (data === 'cancel') return sendMsg(chatId, '❌ لغو شد.', env);

  const state = await getUserState(chatId, env);

  if (data === 'create_token') {
    await sendMsg(chatId, '🔑 لینک ساخت توکن باز شد. توکن رو کپی کنید و بفرستید.', env);
    return;
  }

  // delete flow
  if (state === 'waiting_delete' && data.startsWith('del:')) {
    const workerName = data.slice(4);
    return doDeleteWorker(chatId, workerName, env);
  }

  if (state === 'waiting_panel') {
    const panel = PANELS.find(p => p.key === data);
    if (!panel) return;
    await env.DB.prepare('UPDATE users SET state = ? WHERE chat_id = ?').bind(`waiting_mode:${data}`, chatId).run();
    const keyboard = {
      inline_keyboard: [
        [{ text: '⚡ نصب عادی', callback_data: 'mode:normal' }, { text: '🔒 Obfuscated (کلید ۱۶ رقمی)', callback_data: 'mode:obfuscated' }],
        [{ text: '❌ لغو', callback_data: 'cancel' }]
      ]
    };
    return sendMsg(chatId, `📦 حالت نصب رو انتخاب کنید:`, env, keyboard);
  }

  if (state && state.startsWith('waiting_mode:')) {
    const panelType = state.split(':')[1];
    if (data.startsWith('mode:')) {
      const mode = data.split(':')[1];
      if (mode==='obfuscated') {
        await sendMsg(chatId, `🔒 حالت Obfuscated انتخاب شد\n(رمزنگاری با Web Crypto AES-GCM در سرور انجام می‌شود)\nکلید ۱۶ رقمی پس از نصب نمایش داده می‌شود`, env);
      }
      if (panelType === 'nova') {
        await updateUserState(chatId, `waiting_subname:${mode}`, env);
        return sendMsg(chatId, '🏷️ نام سرویس (SUBNAME) رو وارد کنید:\n(پیش‌فرض: NovaProxy)', env, {
          inline_keyboard: [[{ text: '⏭️ استفاده از پیش‌فرض', callback_data: 'skip' }], [{ text: '❌ لغو', callback_data: 'cancel' }]]
        });
      }
      return deployPanel(chatId, panelType, mode, null, env);
    }
  }

  if (state && state.startsWith('waiting_subname:')) {
    const mode = state.split(':')[1];
    const subName = data === 'skip' ? 'NovaProxy' : data;
    return deployPanel(chatId, 'nova', mode, subName, env);
  }
}

async function sendTokenFlow(chatId, env) {
  const keyboard = {
    inline_keyboard: [[{ text: '🔑 ساخت توکن CF', url: 'https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=%5B%7B%22key%22%3A%22workers_scripts%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22workers_kv_storage%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22workers_d1_storage%22%2C%22type%22%3A%22edit%22%7D%5D&accountId=%2A&zoneId=all&name=CF-Installer-Bot' }]]
  };
  await sendMsg(chatId, '🔑 *تنظیم توکن Cloudflare*\n\nتوکن رو بفرستید (فرمت: cfut_...)', env, keyboard);
  await updateUserState(chatId, 'waiting_token', env);
}

async function handleTokenInput(chatId, text, env) {
  if (!text.startsWith('cfut_')) return sendMsg(chatId, '❌ فرمت توکن نامعتبر. باید با cfut_ شروع بشه.', env);
  try {
    const r = await fetch(`${BACKEND}/v1/deploy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: text, panelType: 'validate' }) });
    const d = await r.json();
    if (!d.success) return sendMsg(chatId, `❌ توکن نامعتبر: ${formatCFError(d)}`, env);
    const sr = await fetch(`${BACKEND}/v1/get-subdomain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: text }) });
    const sd = await sr.json();
    const subdomain = sd.subdomain || '';
    await env.DB.prepare('UPDATE users SET cf_token = ?, cf_account_id = ?, cf_subdomain = ?, state = NULL WHERE chat_id = ?').bind(text, d.accountId || '', subdomain, chatId).run();
    await sendMsg(chatId, `✅ توکن ذخیره شد!\n📋 حساب: ${d.accountName || 'N/A'}\n${d.code?`Code: ${d.code} / ${d.category}`:''}`, env);
  } catch (e) { await sendMsg(chatId, `❌ خطا در بررسی توکن: ${e.message}`, env); }
}

async function sendDeployFlow(chatId, env) {
  const user = await getUser(chatId, env);
  if (!user || !user.cf_token) return sendMsg(chatId, '⚠️ ابتدا با /token توکن رو تنظیم کنید.', env);
  const rows = [];
  for (let i = 0; i < PANELS.length; i += 3) {
    rows.push(PANELS.slice(i, i + 3).map(p => ({ text: `${p.icon} ${p.name}`, callback_data: p.key })));
  }
  rows.push([{ text: '❌ لغو', callback_data: 'cancel' }]);
  await updateUserState(chatId, 'waiting_panel', env);
  await sendMsg(chatId, '🎯 پنل مورد نظر رو انتخاب کنید:', env, { inline_keyboard: rows });
}

async function deployPanel(chatId, panelType, mode, subName, env) {
  const user = await getUser(chatId, env);
  if (!user || !user.cf_token) return sendMsg(chatId, '⚠️ توکن یافت نشد. با /token دوباره تنظیم کنید.', env);
  await sendMsg(chatId, `⏳ در حال نصب ${panelType} (${mode})...`, env);
  await updateUserState(chatId, null, env);
  try {
    const payload = { token: user.cf_token, panelType, installMode: mode };
    if (subName) payload.subname = subName;
    const r = await fetch(`${BACKEND}/v1/deploy`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    if (d.success || d.workerName) {
      await env.DB.prepare('INSERT INTO deployments (chat_id, worker_name, panel_type, panel_url, uuid, install_mode) VALUES (?, ?, ?, ?, ?, ?)').bind(chatId, d.workerName, panelType, d.panelURL, d.uuid || '', mode).run();
      let result = `✅ *دیپلوی موفق!*\n\n🔗 لینک: ${d.panelURL}\n📋 لینک اشتراک: ${d.panelURL}/sub?token=${d.uuid || 'N/A'}`;
      if (['nahan', 'edge', 'nova'].includes(panelType)) result += '\n🔑 پسورد: admin';
      result += `\n📦 حالت: ${mode === 'obfuscated' ? '🔒 Obfuscated (کلید ۱۶ رقمی)' : '⚡ نصب عادی'}`;
      if(d.obfuscationKey) result+=`\n🔒 Key: \`${d.obfuscationKey.slice(0,4)}****\``;
      if(d.code) result+=`\nCode: ${d.code}`;
      await sendMsg(chatId, result, env);
    } else {
      await sendMsg(chatId, `❌ خطا: ${formatCFError(d)}`, env);
    }
  } catch (e) { await sendMsg(chatId, `❌ خطا: ${e.message}`, env); }
}

async function sendWorkersFlow(chatId, env) {
  const user = await getUser(chatId, env);
  if (!user || !user.cf_token) return sendMsg(chatId, '⚠️ ابتدا با /token توکن رو تنظیم کنید.', env);
  try {
    const r = await fetch(`${BACKEND}/v1/list-workers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: user.cf_token }) });
    const d = await r.json();
    if (!d.success || !d.workers || !d.workers.length) return sendMsg(chatId, '📋 ورکری یافت نشد.', env);
    let text = `📋 *ورکرهای شما (${d.workers.length})*\n\n`;
    for (const w of d.workers) {
      text += `${w.panelIcon || '⚙️'} *${w.name}* — ${w.panelName || w.panelType}\n`;
      if (w.url) text += `🔗 ${w.url}\n`;
      text += '\n';
    }
    await sendMsg(chatId, text, env);
  } catch (e) { await sendMsg(chatId, `❌ خطا در دریافت لیست ورکرها: ${e.message}`, env); }
}

async function sendDeleteFlow(chatId, env){
  const user = await getUser(chatId, env);
  if (!user || !user.cf_token) return sendMsg(chatId, '⚠️ ابتدا با /token توکن رو تنظیم کنید.', env);
  try{
    const r = await fetch(`${BACKEND}/v1/list-workers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: user.cf_token }) });
    const d = await r.json();
    if (!d.success || !d.workers || !d.workers.length) return sendMsg(chatId, '📋 ورکری برای حذف یافت نشد.', env);
    const rows=d.workers.slice(0,8).map(w=>[{text:`🗑️ ${w.name}`,callback_data:`del:${w.name}`}]);
    rows.push([{text:'❌ لغو',callback_data:'cancel'}]);
    await updateUserState(chatId,'waiting_delete',env);
    await sendMsg(chatId,'🗑️ کدام ورکر حذف شود؟',env,{inline_keyboard:rows});
  }catch(e){ await sendMsg(chatId,`❌ خطا: ${e.message}`,env)}
}

async function doDeleteWorker(chatId, workerName, env){
  const user=await getUser(chatId,env);
  if(!user||!user.cf_token) return sendMsg(chatId,'⚠️ توکن یافت نشد',env);
  await sendMsg(chatId,`⏳ در حال حذف ${workerName}...`,env);
  await updateUserState(chatId,null,env);
  try{
    const r=await fetch(`${BACKEND}/v1/delete-worker`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:user.cf_token,workerName})});
    const d=await r.json();
    if(d.success) await sendMsg(chatId,`✅ حذف شد: ${workerName}`,env);
    else await sendMsg(chatId,`❌ خطا: ${formatCFError(d)}`,env);
  }catch(e){ await sendMsg(chatId,`❌ خطا: ${e.message}`,env)}
}

// === Helpers ===
async function ensureUser(chatId, user, env) {
  await env.DB.prepare('INSERT OR IGNORE INTO users (chat_id, username, first_name) VALUES (?, ?, ?)').bind(chatId, user.username || '', user.first_name || '').run();
}
async function getUser(chatId, env) {
  const r = await env.DB.prepare('SELECT * FROM users WHERE chat_id = ?').bind(chatId).first();
  return r;
}
async function getUserState(chatId, env) {
  const r = await env.DB.prepare('SELECT state FROM users WHERE chat_id = ?').bind(chatId).first();
  return r ? r.state : null;
}
async function updateUserState(chatId, state, env) {
  await env.DB.prepare('UPDATE users SET state = ? WHERE chat_id = ?').bind(state, chatId).run();
}
async function sendMsg(chatId, text, env, extra = {}) {
  const MAX=4000;
  if (text.length <= MAX) {
    const body = { chat_id: chatId, text, parse_mode: 'Markdown', ...extra };
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
  } else {
    let remaining = text;
    while (remaining.length > 0) {
      let chunk = remaining.substring(0, MAX);
      if (remaining.length > MAX) {
        const lastNewline = chunk.lastIndexOf('\n');
        if (lastNewline > MAX / 2) chunk = remaining.substring(0, lastNewline);
      }
      remaining = remaining.substring(chunk.length).replace(/^\n/, '');
      const body = { chat_id: chatId, text: chunk, parse_mode: 'Markdown', ...extra };
      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
    }
  }
}
async function answerCb(cbId, env) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: cbId })
  });
}
