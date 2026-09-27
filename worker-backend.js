export default {
  async fetch(request) {
    const ALLOWED=['arshiyashams675-sudo.github.io','idvdjd8388.github.io','localhost','127.0.0.1'];
    const origin=request.headers.get('Origin')||request.headers.get('Referer')||'';
    const isAllowed=ALLOWED.some(o=>origin===o||origin===('https://'+o)||origin===('http://'+o));
    const corsHeaders={'Access-Control-Allow-Origin':isAllowed?origin:'','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-CF-Path,X-CF-Method,X-GitHub-Url','Access-Control-Expose-Headers':'Location,X-API-Deprecated'};
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders});
    const url=new URL(request.url);

    // Health stays unversioned
    if(url.pathname==='/health' || url.pathname==='/v1/health') return R({ok:true,ts:Date.now(),version:'v1'},200,corsHeaders);

    // Legacy redirect to /v1/* (preserve method with 308)
    const legacyMap={'/deploy':'/v1/deploy','/list-workers':'/v1/list-workers','/get-subdomain':'/v1/get-subdomain','/github':'/v1/github','/cf':'/v1/cf'};
    if(legacyMap[url.pathname]){
      const target=legacyMap[url.pathname];
      // For API clients that follow redirects, use 308. Also handle internally for POST without redirect follow
      // We return 308 redirect but also support handling if client re-requests
      if(request.method==='GET'){
        return Response.redirect(url.origin + target + url.search, 308);
      } else {
        // For POST/PUT/DELETE, we still redirect (307/308 preserves method). Return redirect.
        // Cloudflare will follow; fallback: also handle via internal rewrite in next block.
        return Response.redirect(url.origin + target + url.search, 308);
      }
    }

    // Security: origin check for all other endpoints
    if(!isAllowed) return R({error:'Unauthorized',code:'UNAUTHORIZED',category:'AUTH_ERROR'},403,corsHeaders);

    // Versioned routes
    if(url.pathname==='/v1/github'){
      const t=request.headers.get('X-GitHub-Url');
      if(!t) return R({error:'Missing X-GitHub-Url',code:'MISSING_HEADER',category:'VALIDATION_ERROR'},400,corsHeaders);
      try{
        const u=new URL(t);
        const allowedHosts=['github.com','raw.githubusercontent.com','cdn.jsdelivr.net','githack.com','objects.githubusercontent.com'];
        if(!allowedHosts.includes(u.hostname)) return R({error:'Host not allowed: '+u.hostname,code:'HOST_NOT_ALLOWED',category:'VALIDATION_ERROR'},403,corsHeaders);
        const r=await fetch(t);
        return new Response(await r.text(),{status:r.status,headers:{'Content-Type':'text/plain','Access-Control-Allow-Origin':origin}});
      }catch(e){ return R(classifyError(e,'NETWORK_ERROR'),502,corsHeaders)}
    }

    if(url.pathname==='/v1/cf'){
      const auth=request.headers.get('Authorization');
      if(!auth) return R({error:'Missing Authorization',code:'MISSING_AUTH',category:'AUTH_ERROR'},401,corsHeaders);
      const path=request.headers.get('X-CF-Path');
      if(!path) return R({error:'Missing X-CF-Path',code:'MISSING_PATH',category:'VALIDATION_ERROR'},400,corsHeaders);
      const allowedPaths=['/user/tokens/verify','/accounts','/user'];
      const pathAllowed=allowedPaths.some(p=>path===p||path.startsWith('/accounts/'));
      if(!pathAllowed) return R({error:'Path not allowed: '+path,code:'PATH_NOT_ALLOWED',category:'VALIDATION_ERROR'},403,corsHeaders);
      const method=request.headers.get('X-CF-Method')||'GET';
      try{
        const opts={method,headers:{Authorization:'Bearer '+auth.split(' ').pop()+''}};
        if(method!=='GET'&&method!=='HEAD'){
          const ct=request.headers.get('Content-Type')||'';
          if(ct.includes('multipart/form-data')){opts.body=await request.formData()}
          else{opts.body=await request.text();opts.headers['Content-Type']='application/json'}
        }
        const r=await fetch('https://api.cloudflare.com/client/v4'+path,opts);
        const text=await r.text();
        // Try to categorize CF errors
        try{ const j=JSON.parse(text); if(!j.success && j.errors) return new Response(JSON.stringify({...classifyCFError(j),raw:j}),{status:r.status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin}})}catch(_e){}
        return new Response(text,{status:r.status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin}});
      }catch(e){return R(classifyError(e,'NETWORK_ERROR'),502,corsHeaders)}
    }

    if((url.pathname==='/v1/deploy' || url.pathname==='/deploy') && request.method==='POST'){
      // Handle both versioned and legacy (if redirected not followed)
      try{
        const body=await request.json();
        const {token,accountId,panelType}=body;
        if(!token||!token.startsWith('cfut_')) return R({success:false,error:'فرمت توکن نامعتبر است. توکن باید با cfut_ شروع شود',code:'INVALID_TOKEN_FORMAT',category:'VALIDATION_ERROR'},400,corsHeaders);
        const rnd=Math.random().toString(36).slice(2,8)+Math.floor(Math.random()*1000);
        const workerName=`srv-${rnd}`;
        const logs=[];
        const log=(msg)=>logs.push(`<span style="color:#00d4aa">▸</span> ${msg}`);
        const err=(msg)=>logs.push(`<span style="color:#ff4757">✖</span> ${msg}`);

        log('شروع استقرار...');
        const h={'Authorization':'Bearer '+token};

        log('اعتبارسنجی توکن...');
        const vr=await cfDirect(h,'/user/tokens/verify');
        if(!vr.success){
          const cat=classifyCFError(vr);
          return R({success:false,logs,error:'توکن نامعتبر: '+(vr.errors?.[0]?.message||cat.message),code:cat.code,category:cat.category,details:cat},200,corsHeaders);
        }

        log('دریافت اطلاعات حساب...');
        const ar=await cfDirect(h,'/accounts');
        if(!ar.success||!ar.result.length){
          const cat=classifyCFError(ar);
          return R({success:false,logs,error:'حسابی یافت نشد',code:cat.code,category:cat.category,details:cat},200,corsHeaders);
        }
        const acc=accountId?ar.result.find(a=>a.id===accountId):ar.result[0];
        if(!acc) return R({success:false,logs,error:'حساب یافت نشد',code:'ACCOUNT_NOT_FOUND',category:'NOT_FOUND_ERROR'},200,corsHeaders);
        const aid=acc.id;
        log(`حساب: ${escH(acc.name||aid)}`);

        if(panelType==='validate'){
          return R({success:true,logs,accountName:acc.name,accountId:aid},200,corsHeaders);
        }

        let sub='';
        try{
          sub=await resolveSubdomain(h, aid);
          if(!sub){
            const scriptsPre=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
            if(scriptsPre && scriptsPre.success && scriptsPre.result){
              sub=await resolveSubdomain(h, aid, scriptsPre);
            }
          }
          if(!sub){
            await new Promise(r=>setTimeout(r,3000));
            const scriptsPost=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
            if(scriptsPost && scriptsPost.success && scriptsPost.result){
              sub=await resolveSubdomain(h, aid, scriptsPost);
            }
          }
        }catch(e){log(`خطا ساب‌دامین: ${escH(e.message)}`)}
        log(`ساب‌دامین نهایی: ${escH(sub||'یافت نشد')}`);

        log('دانلود کد منبع...');
        const panels={
          nahan:{repo:'itsyebekhe/nahan',file:'_worker.js',bindings:{d1:['IOT_DB'],kv:[]},vars:{PANEL_TYPE:'nahan'},path:'/sync/dash'},
          edge:{repo:'cmliu/edgetunnel',file:'_worker.js',bindings:{d1:[],kv:['KV']},vars:{ADMIN:'admin',PANEL_TYPE:'edge'},path:'/admin'},
          cfnew:{repo:'byjoey/cfnew',file:'\u660e\u6587\u6e90\u5417',bindings:{d1:[],kv:['C']},vars:{u:crypto.randomUUID(),PANEL_TYPE:'cfnew'},path:''},
          nova:{repo:'IRNova/Nova-Proxy',file:'worker.js',bindings:{d1:['DB'],kv:['KV']},vars:{ADMIN:'admin',PANEL_TYPE:'nova'},path:'/admin'},
          edgtun:{repo:'xizekpan/EDtunnel-Go-Workers',file:'index.js',bindings:{d1:[],kv:[]},vars:{UUID:crypto.randomUUID(),PANEL_TYPE:'edgtun'},path:''},
          fox:{repo:'code3-dev/foxcloud',file:'worker.js',release:'v1.0.0',bindings:{d1:[],kv:[]},vars:{UUID:crypto.randomUUID(),PROXY_IP:'172.66.45.9:443',PANEL_TYPE:'fox'},path:'/sub'},
          amcf:{repo:'amclubs/am-cf-tunnel',file:'_worker.js',bindings:{d1:[],kv:['amclubs']},vars:{UUID:crypto.randomUUID(),PANEL_TYPE:'amcf'},path:'/'},
          vtpanel:{repo:'bayueqi/ZQ-VTPanel',file:'_worker.js',bindings:{d1:[],kv:['VTPanel']},vars:{PANEL_TYPE:'vtpanel'},path:'/'},
          v2ray:{repo:'vfarid/v2ray-worker',file:'worker.js',release:'v2.4',bindings:{d1:[],kv:['settings']},vars:{PANEL_TYPE:'v2ray'},path:'/'},
        };
        const vtpanelUUID=crypto.randomUUID();
        const p=panels[panelType];
        if(!p) return R({success:false,logs,error:'پنل نامعتبر',code:'INVALID_PANEL',category:'VALIDATION_ERROR'},200,corsHeaders);
        if(panelType==='vtpanel'){p.vars={PANEL_TYPE:'vtpanel'};log(`UUID ساخته شد: ${vtpanelUUID}`)}

        const installMode=body.installMode||'normal';
        if(installMode==='obfuscated') log('🛡️ حالت نصب: Obfuscated (کلید ۱۶ رقمی + Web Crypto)');

        const code=await dlCode(p.repo,p.file,p.release);
        if(!code) return R({success:false,logs,error:'کد منبع یافت نشد',code:'SOURCE_NOT_FOUND',category:'NOT_FOUND_ERROR'},200,corsHeaders);
        log(`کد دانلود شد: ${(code.length/1024).toFixed(0)}KB`);

        let bpbSecurePath=''; let bpbTrPass=''; let bpbUUID='';
        let finalCode=code;
        if(panelType==='bpb'){
          log('ساخت تنظیمات BPB...');
          const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
          const genStr=(len)=>{let s='';for(let i=0;i<len;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s};
          bpbSecurePath=genStr(14); p.path=`/${bpbSecurePath}/panel`; bpbTrPass=genStr(16); bpbUUID=crypto.randomUUID();
          let accEmail=''; try{const ur=await cfDirect(h,'/user');if(ur.success)accEmail=ur.result?.email||''}catch(e){}
          const mainDomain=sub?`${workerName}.${sub}.workers.dev`:`${workerName}.${(accEmail.split('@')[0]||'user')}.workers.dev`;
          const embeddedSettings=`const EMBEDED_SETTINGS = ${JSON.stringify({accID:aid,accEmail,vlUUID:bpbUUID,trPass:bpbTrPass,securePath:bpbSecurePath,proxyIpMode:'proxyip',proxyIPs:[],prefixes:[],fallback:'',dohUrl:'',mainDomain})} ;\n`;
          let rc='';for(let i=0;i<200;i++)rc+=`var _${crypto.randomUUID().slice(0,8)}=${Math.floor(Math.random()*100)};\n`;
          finalCode='// @ts-nocheck\n'+rc+embeddedSettings+code;
          log(`securePath: ${bpbSecurePath}`); log('تنظیمات BPB ساخته شد ✅');
        }

        // Enhanced obfuscation: 16-digit key + Web Crypto AES-GCM + javascript-obfuscator fallback
        let obfuscationKey=null;
        if(installMode==='obfuscated' && ['nova','edge','nahan'].includes(panelType)){
          try{
            log('🔒 در حال رمزگذاری پیشرفته (Web Crypto + کلید ۱۶ رقمی)...');
            const res=await enhancedObfuscate(finalCode);
            finalCode=res.code;
            obfuscationKey=res.key;
            log(`🔒 رمزگذاری انجام شد ✅ کلید: ${obfuscationKey.slice(0,4)}****`);
          }catch(e){
            err(`رمزگذاری پیشرفته ناموفق: ${escH(e.message)}`);
            try{
              const {obfuscate}=await import('https://cdn.jsdelivr.net/npm/javascript-obfuscator@4.1.1/+esm');
              finalCode=await obfuscate(finalCode,{compact:true,controlFlowFlattening:true,controlFlowFlatteningThreshold:0.5,deadCodeInjection:true,deadCodeInjectionThreshold:0.2,stringArray:true,stringArrayEncoding:['base64'],stringArrayThreshold:0.75,renameGlobals:false});
              log('🔒 fallback obfuscator اعمال شد');
            }catch(e2){
              finalCode=finalCode.replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};,:=])\s*/g,'$1').trim();
              log('🔒 حالت فشرده‌سازی اضطراری اعمال شد');
            }
          }
        }

        const bindings=[];
        for(const name of(p.bindings.d1||[])){
          log(`ساخت D1: ${name}...`);
          const r=await cfDirect(h,`/accounts/${aid}/d1/database`,'POST',{name:`d1-${rnd}`});
          if(r.success){bindings.push({name,type:'d1',id:r.result.uuid});log(`D1 OK: ${r.result.uuid.slice(0,8)}...`)}
          else{const cat=classifyCFError(r);err(`D1 خطا [${escH(cat.code)}]: ${escH(cat.message)}`)}
        }
        for(const name of(p.bindings.kv||[])){
          log(`ساخت KV: ${name}...`);
          const lr=await cfDirect(h,`/accounts/${aid}/storage/kv/namespaces`);
          let id=lr.result?.find(x=>x.title===`kv-${rnd}`)?.id;
          if(!id){
            const r=await cfDirect(h,`/accounts/${aid}/storage/kv/namespaces`,'POST',{title:`kv-${rnd}`});
            id=r.result?.id;
          }
          if(id){bindings.push({name,type:'kv_namespace',namespace_id:id});log(`KV OK: ${id.slice(0,8)}...`)}
          else{const cat=classifyCFError(lr);err(`KV خطا [${escH(cat.code)}]: ${escH(cat.message)}`)}
        }

        const subname=body.subname;
        if(panelType==='nova' && subname){
          log(`تنظیم SUBNAME برای Nova: ${escH(subname)}`);
          p.vars.SUBNAME=subname;
        }

        log('استقرار Worker...');
        const vars=p.vars||{};
        const bindingsWithVars=[...bindings];
        if(Object.keys(vars).length){
          for(const [k,v] of Object.entries(vars)){
            log(`تنظیم متغیر: ${k}...`);
            bindingsWithVars.push({name:k,type:'plain_text',text:v});
          }
        }
        const md={main_module:'worker.js',compatibility_date:'2024-09-22',compatibility_flags:['nodejs_compat'],bindings:bindingsWithVars};
        const boundary='----CFBoundary'+Math.random().toString(36).slice(2);
        const CRLF='\r\n';
        const mdJson=JSON.stringify(md);
        const parts=[
          '--'+boundary+CRLF+'Content-Disposition: form-data; name="metadata"'+CRLF+'Content-Type: application/json'+CRLF+CRLF+mdJson,
          '--'+boundary+CRLF+'Content-Disposition: form-data; name="worker.js"; filename="worker.js"'+CRLF+'Content-Type: application/javascript+module'+CRLF+CRLF+finalCode,
          '--'+boundary+'--'
        ].join(CRLF);
        const dr=await fetch(`https://api.cloudflare.com/client/v4/accounts/${aid}/workers/scripts/${workerName}`,{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'multipart/form-data; boundary='+boundary},body:parts});
        const dd=await dr.json();
        if(!dd.success){
          const cat=classifyCFError(dd);
          return R({success:false,logs,error:'خطای استقرار: '+(dd.errors?.[0]?.message||cat.message),code:cat.code,category:cat.category,details:cat},200,corsHeaders);
        }
        log('Worker مستقر شد ✅');

        log('فعال‌سازی workers.dev...');
        const enableR=await fetch(`https://api.cloudflare.com/client/v4/accounts/${aid}/workers/services/${workerName}/environments/production/subdomain`,{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({enabled:true})});
        if(!enableR.ok) log('فعال‌سازی ناموفق');

        if(!sub){
          log('انتظار برای آماده شدن ساب‌دامین...');
          await new Promise(r=>setTimeout(r,3000));
          try{
            const scriptsPost=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
            if(scriptsPost && scriptsPost.success && scriptsPost.result){
              sub=await resolveSubdomain(h, aid, scriptsPost);
            }
            if(!sub) sub=await resolveSubdomain(h, aid);
          }catch(e){log(`subdomain fetch error: ${escH(e.message)}`)}
        }
        if(!sub){
          log('⚠️ ساب‌دامین شناسایی نشد — Worker مستقر شد ولی آدرس workers.dev قابل شناسایی نیست');
          const dashboardURL=`https://dash.cloudflare.com/${aid}/workers-and-pages`;
          return R({success:true,logs,panelURL:'',workerName,panelType,uuid:vars.u||vars.UUID||vars.ID||null,panelPath:'/',dashboardURL,obfuscationKey},200,corsHeaders);
        }
        const basePath=`https://${workerName}.${sub}.workers.dev`;
        const panelPath=p.path||(vars.u?`/${vars.u}`:'');
        const panelURL=basePath+panelPath;
        const dashboardURL=`https://dash.cloudflare.com/${aid}/workers-and-pages`;
        log(`آدرس: ${escH(panelURL)}`);

        let vtpUUID=null;
        if(panelType==='vtpanel'){
          vtpUUID=vtpanelUUID;
          const kvBinding=bindings.find(b=>b.name==='VTPanel');
          if(kvBinding){
            const kvId=kvBinding.namespace_id;
            log('ذخیره UUID در KV...');
            const writeR=await cfDirect(h,`/accounts/${aid}/storage/kv/namespaces/${kvId}/values/user_config`,'PUT',{uuid:vtpUUID});
            if(writeR.success) log(`UUID ذخیره شد: ${vtpUUID}`); else log('UUID ذخیره نشد - کاربر باید دستی وارد کند');
          }
        }

        if(panelType==='nova' && subname){
          const novaKvBinding=bindings.find(b=>b.name==='KV');
          if(novaKvBinding){
            const kvId=novaKvBinding.namespace_id;
            log('به‌روزرسانی config.json در KV...');
            const configData={subname:subname,uuid:vars.UUID||'',admin:vars.ADMIN||'admin'};
            const kvWriteR=await cfDirect(h,`/accounts/${aid}/storage/kv/namespaces/${kvId}/values/config.json`,'PUT',configData);
            if(kvWriteR.success) log('config.json در KV به‌روزرسانی شد ✅'); else log('config.json به‌روزرسانی نشد');
          }
        }

        return R({success:true,logs,panelURL,workerName,panelType,uuid:vars.u||vars.UUID||vars.ID||vtpUUID||bpbUUID||null,panelPath,dashboardURL,securePath:bpbSecurePath||null,trPass:bpbTrPass||null,subdomain:sub,installMode,obfuscationKey},200,corsHeaders);
      }catch(e){const cat=classifyError(e,'SERVER_ERROR'); return R({success:false,logs:[`خطا: ${e.message}`],error:e.message,code:cat.code,category:cat.category},200,corsHeaders)}
    }

    if(url.pathname==='/v1/get-subdomain' && request.method==='POST'){
      try{
        const body=await request.json();
        const {token,accountId}=body;
        if(!token||!token.startsWith('cfut_')) return R({success:false,error:'فرمت توکن نامعتبر',code:'INVALID_TOKEN_FORMAT',category:'VALIDATION_ERROR'},200,corsHeaders);
        const h={'Authorization':'Bearer '+token};
        let aid=accountId;
        if(!aid){ const ar=await cfDirect(h,'/accounts'); if(ar.success&&ar.result.length) aid=ar.result[0].id; }
        if(!aid) return R({success:false,error:'حساب یافت نشد',code:'ACCOUNT_NOT_FOUND',category:'NOT_FOUND_ERROR'},200,corsHeaders);
        const sub=await resolveSubdomain(h,aid);
        if(sub) return R({success:true,subdomain:sub},200,corsHeaders);
        return R({success:false,error:'ساب‌دامین یافت نشد',code:'SUBDOMAIN_NOT_FOUND',category:'NOT_FOUND_ERROR'},200,corsHeaders);
      }catch(e){return R({success:false,error:e.message,...classifyError(e,'SERVER_ERROR')},200,corsHeaders)}
    }

    if(url.pathname==='/v1/list-workers' && request.method==='POST'){
      try{
        const body=await request.json();
        const {token}=body;
        if(!token||!token.startsWith('cfut_')) return R({success:false,error:'توکن نامعتبر',code:'INVALID_TOKEN',category:'AUTH_ERROR'},200,corsHeaders);
        const h={'Authorization':'Bearer '+token};
        const ar=await cfDirect(h,'/accounts');
        if(!ar.success||!ar.result.length){ const cat=classifyCFError(ar); return R({success:false,error:'حسابی یافت نشد',code:cat.code,category:cat.category},200,corsHeaders)}
        const aid=ar.result[0].id;
        const sub=await resolveSubdomain(h, aid);
        const scriptsR=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
        if(!scriptsR.success){ const cat=classifyCFError(scriptsR); return R({success:false,error:'خطا در دریافت لیست Workerها',code:cat.code,category:cat.category},200,corsHeaders)}
        const allScripts=(scriptsR.result||[]).filter(w=>!['cf-installer-bot','cf_installer'].includes(w.id||w.name||''));
        const PANEL_LOOK={nova:{name:'Nova Proxy',icon:'🚀',path:'/admin'},edge:{name:'EdgeTunnel',icon:'🌐',path:'/admin'},nahan:{name:'Nahan',icon:'🛡️',path:'/sync/dash'},edgtun:{name:'EDtunnel',icon:'⚡',path:'/'},fox:{name:'FoxCloud',icon:'🦊',path:'/sub'},amcf:{name:'AMCF',icon:'🔗',path:'/'},vtpanel:{name:'VTPanel',icon:'📺',path:'/'},v2ray:{name:'v2ray-worker',icon:'🔧',path:'/'},cfnew:{name:'Cfnew',icon:'🌟',path:'/'},kennedy:{name:'Kennedy',icon:'🎯',path:'/admin'},unknown:{name:'Unknown',icon:'⚙️',path:'/'}};
        function detectPanelType(code,bindings){
          if(bindings){
            const vn=bindings.filter(b=>(b.type==='plain_text'||b.type==='secret_text')).map(b=>b.name);
            if(vn.includes('ADMIN')&&vn.includes('SUBNAME')&&vn.includes('UUID'))return'nova';
          }
          if(bindings){
            const kvN=bindings.filter(b=>b.type==='kv_namespace').map(b=>b.name);
            const d1N=bindings.filter(b=>b.type==='d1_database').map(b=>b.name);
            if(kvN.includes('Nova')||kvN.includes('KV'))return'nova';
            if(kvN.includes('EdgeTunnel'))return'edge';
            if(kvN.includes('EDtunnel'))return'edgtun';
            if(kvN.includes('VTPanel'))return'vtpanel';
            if(kvN.includes('settings'))return'v2ray';
            if(d1N.includes('IOT_DB'))return'nahan';
            if(d1N.includes('DB'))return'nahan';
            if(d1N.includes('D1_DB'))return'cfnew';
          }
          if(!code) return'unknown';
          if(/NovaProxy|Nova-Proxy|Nova_Mirror|irNova|nova/i.test(code))return'nova';
          if(/EdgeTunnel|edgetunnel/i.test(code))return'edge';
          if(/nahan|Nahan/i.test(code))return'nahan';
          if(/EDtunnel|edgtunnel/i.test(code))return'edgtun';
          if(/FoxCloud|foxcloud/i.test(code))return'fox';
          if(/am-cf|AMCF|amclubs/i.test(code))return'amcf';
          if(/VTPanel|ZQ-VTPanel/i.test(code))return'vtpanel';
          if(/v2ray-worker|v2ray/i.test(code))return'v2ray';
          if(/cfnew|Cfnew/i.test(code))return'cfnew';
          return'unknown';
        }
        const workerTasks= allScripts.map(async(w)=>{
          const name=w.id; let panelType='unknown'; let code=''; let bindings=[];
          try{
            const [metaR,scR]=await Promise.all([
              cfDirect(h,`/accounts/${aid}/workers/scripts/${name}`).catch(()=>null),
              cfDirect(h,`/accounts/${aid}/workers/scripts/${name}/content`).catch(()=>null)
            ]);
            if(metaR&&metaR.success&&metaR.result){
              bindings=metaR.result.bindings||[];
              const pt=bindings.find(b=>(b.type==='plain_text'||b.type==='secret_text')&&b.name==='PANEL_TYPE');
              if(pt&&pt.text) panelType=pt.text;
              else{
                if(scR&&scR.success) code=atob(scR.result||'');
                panelType=detectPanelType(code,bindings);
                if(panelType==='unknown'){
                  if(name.includes('nova'))panelType='nova';
                  else if(name.includes('edge')||name.includes('tunnel'))panelType='edge';
                  else if(name.includes('nahan'))panelType='nahan';
                  else if(name.includes('edgtun'))panelType='edgtun';
                  else if(name.includes('fox'))panelType='fox';
                  else if(name.includes('amcf'))panelType='amcf';
                  else if(name.includes('vtpanel'))panelType='vtpanel';
                  else if(name.includes('v2ray'))panelType='v2ray';
                  else if(name.includes('cfnew'))panelType='cfnew';
                }
              }
            }
          }catch(e){}
          const meta=PANEL_LOOK[panelType]||PANEL_LOOK.unknown;
          const workerURL=sub?`https://${name}.${sub}.workers.dev${meta.path}`:'';
          return{name,panelType,panelName:meta.name,panelIcon:meta.icon,url:workerURL,desc:meta.name};
        });
        const workers=await Promise.all(workerTasks);
        return R({success:true,workers,subdomain:sub},200,corsHeaders);
      }catch(e){const cat=classifyError(e,'SERVER_ERROR'); return R({success:false,error:e.message,code:cat.code,category:cat.category},200,corsHeaders)}
    }

    // NEW: Delete worker
    if(url.pathname==='/v1/delete-worker' && request.method==='POST'){
      try{
        const body=await request.json();
        const {token,workerName,accountId}=body;
        if(!token||!token.startsWith('cfut_')) return R({success:false,error:'توکن نامعتبر',code:'INVALID_TOKEN',category:'AUTH_ERROR'},400,corsHeaders);
        if(!workerName) return R({success:false,error:'نام Worker الزامی است',code:'MISSING_WORKER_NAME',category:'VALIDATION_ERROR'},400,corsHeaders);
        if(workerName==='cf-installer-bot' || workerName==='cf_installer') return R({success:false,error:'حذف این Worker مجاز نیست',code:'PROTECTED_WORKER',category:'VALIDATION_ERROR'},403,corsHeaders);
        const h={'Authorization':'Bearer '+token};
        let aid=accountId;
        if(!aid){ const ar=await cfDirect(h,'/accounts'); if(ar.success&&ar.result.length) aid=ar.result[0].id; }
        if(!aid) return R({success:false,error:'حساب یافت نشد',code:'ACCOUNT_NOT_FOUND',category:'NOT_FOUND_ERROR'},404,corsHeaders);
        const delR=await cfDirect(h,`/accounts/${aid}/workers/scripts/${workerName}`,'DELETE');
        if(!delR.success){
          const cat=classifyCFError(delR);
          return R({success:false,error:delR.errors?.[0]?.message||'حذف ناموفق',code:cat.code,category:cat.category,details:cat},200,corsHeaders);
        }
        return R({success:true,message:`Worker ${workerName} حذف شد`,workerName},200,corsHeaders);
      }catch(e){const cat=classifyError(e,'SERVER_ERROR'); return R({success:false,error:e.message,code:cat.code,category:cat.category},500,corsHeaders)}
    }

    return R({error:'Not found',path:url.pathname,code:'NOT_FOUND',category:'NOT_FOUND_ERROR'},404,corsHeaders);
  }
};

function R(d,s=200,cors={}){
  return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':cors['Access-Control-Allow-Origin']||'',...cors}});
}
function escH(str){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}

function classifyCFError(cfRes){
  const err=cfRes?.errors?.[0];
  if(!err) return {code:'UNKNOWN_ERROR',category:'SERVER_ERROR',message:'خطای ناشناخته'};
  const code=err.code;
  const msg=err.message||'';
  if(code===10000 || msg.includes('Authentication')) return {code:'AUTH_FAILED',category:'AUTH_ERROR',message:msg||'احراز هویت ناموفق'};
  if(code===10001) return {code:'INVALID_TOKEN',category:'AUTH_ERROR',message:msg};
  if(code===11006) return {code:'RATE_LIMITED',category:'RATE_LIMIT_ERROR',message:'محدودیت نرخ — لطفاً کمی صبر کنید'};
  if(code===10007 || code===10005) return {code:'PERMISSION_DENIED',category:'AUTH_ERROR',message:'دسترسی کافی نیست — توکن را با دسترسی‌های لازم بسازید'};
  if(code===10002) return {code:'NOT_FOUND',category:'NOT_FOUND_ERROR',message:msg};
  if(code===10026) return {code:'WORKER_LIMIT',category:'QUOTA_ERROR',message:'سقف تعداد Worker پر شده'};
  if(code>=500 && code<600) return {code:'CF_SERVER_ERROR',category:'SERVER_ERROR',message:msg};
  if(code===429) return {code:'RATE_LIMITED',category:'RATE_LIMIT_ERROR',message:msg};
  return {code:`CF_${code}`,category:'SERVER_ERROR',message:msg};
}

function classifyError(e,fallbackCategory){
  const msg=e?.message||String(e);
  if(msg.includes('fetch')||msg.includes('network')||msg.includes('Failed to fetch')) return {code:'NETWORK_ERROR',category:'NETWORK_ERROR',message:msg};
  if(msg.includes('timeout')) return {code:'TIMEOUT',category:'NETWORK_ERROR',message:msg};
  return {code:'INTERNAL_ERROR',category:fallbackCategory||'SERVER_ERROR',message:msg};
}

async function cfDirect(h,path,method='GET',body=null){
  for(let attempt=0;attempt<3;attempt++){
    try{
      const opts={method,headers:{...h,'Content-Type':'application/json'}};
      if(body) opts.body=JSON.stringify(body);
      const r=await fetch('https://api.cloudflare.com/client/v4'+path,opts);
      const j=await r.json();
      if(j.success||j.errors){
        if((!j.success)&&(j.errors&&j.errors.some(e=>e.code===429||(e.code>=500&&e.code<600)))){
          if(attempt<2){await new Promise(r2=>setTimeout(r2,Math.pow(2,attempt)*500));continue}
        }
        return j;
      }
      return j;
    }catch(e){
      if(attempt<2){await new Promise(r3=>setTimeout(r3,Math.pow(2,attempt)*300));continue}
      return{success:false,errors:[{message:e.message,code:0}]};
    }
  }
  return{success:false,errors:[{message:'max retries exceeded',code:0}]};
}

async function dlCode(repo,file,release){
  const f=encodeURIComponent(file);
  if(release){
    const rUrl=`https://github.com/${repo}/releases/download/${release}/${f}`;
    try{const r=await fetch(rUrl);if(r.ok){const t=await r.text();if(t.length>200)return t}}catch(e){}
  }
  const urls=[
    `https://cdn.jsdelivr.net/gh/${repo}@main/${f}`,
    `https://cdn.jsdelivr.net/gh/${repo}@master/${f}`,
    `https://githack.com/${repo}/raw/refs/heads/main/${f}`,
    `https://githack.com/${repo}/raw/refs/heads/master/${f}`,
    `https://raw.githubusercontent.com/${repo}/refs/heads/main/${f}`,
    `https://raw.githubusercontent.com/${repo}/refs/heads/master/${f}`
  ];
  for(const u of urls){
    try{const r=await fetch(u);if(r.ok){const t=await r.text();if(t.length>200)return t}}catch(e){}
  }
  return null;
}

async function resolveSubdomain(h,aid,preFetchedScripts=null){
  try{
    const subR=await cfDirect(h,`/accounts/${aid}/workers/subdomain`);
    if(subR&&subR.success&&subR.result&&subR.result.subdomain){
      let s=subR.result.subdomain; if(s.includes('.'))s=s.split('.')[0]; if(s)return s;
    }
    if(subR&&subR.success&&typeof subR.result==='string'&&subR.result.length){
      let s=subR.result.replace(/['\"]+/g,'').trim(); if(s.includes('.'))s=s.split('.')[0]; if(s)return s;
    }
  }catch(e){}
  try{
    const uR=await cfDirect(h,'/user');
    if(uR&&uR.success&&uR.result&&uR.result.username){
      let s=uR.result.username; if(s.includes('.'))s=s.split('.')[0]; if(s)return s;
    }
  }catch(e){}
  try{
    let scripts=preFetchedScripts;
    if(!scripts||!scripts.success||!scripts.result) scripts=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
    if(scripts&&scripts.success&&scripts.result&&scripts.result.length){
      const first=scripts.result[0];
      if(first&&first.id){
        try{
          const detail=await cfDirect(h,`/accounts/${aid}/workers/scripts/${first.id}`);
          if(detail&&detail.success&&detail.result){
            const bindings=detail.result.bindings||[];
            const sb=bindings.find(b=>(b.type==='plain_text'||b.type==='secret_text')&&/sub/i.test(b.name));
            if(sb&&sb.text){ let s=sb.text; if(s.includes('.'))s=s.split('.')[0]; if(s)return s;}
          }
        }catch(e){}
      }
    }
  }catch(e){}
  return null;
}

// Enhanced obfuscation with 16-digit key + Web Crypto AES-GCM
function generateObfuscationKey(){
  const arr=new Uint8Array(16);crypto.getRandomValues(arr);
  return Array.from(arr,b=>b%10).join('');
}

async function enhancedObfuscate(code){
  const key16=generateObfuscationKey();
  // Derive AES-GCM key from 16-digit string via SHA-256
  const enc=new TextEncoder();
  const keyMaterial=await crypto.subtle.importKey('raw', enc.encode(key16), {name:'PBKDF2'}, false, ['deriveKey']);
  // Use a fixed salt for deterministic derivation (not for high security, but for obfuscation)
  const salt=enc.encode('cf-installer-obfuscation-salt');
  const aesKey=await crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:1000, hash:'SHA-256'}, keyMaterial, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:'AES-GCM', iv}, aesKey, enc.encode(code));
  const b64= btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  const ivB64= btoa(String.fromCharCode(...iv));
  // Build self-decrypting wrapper
  const wrapper=`(async()=>{const k="${key16}";const ivB64="${ivB64}";const dataB64="${b64}";const enc=new TextEncoder(),dec=new TextDecoder();const salt=enc.encode('cf-installer-obfuscation-salt');const km=await crypto.subtle.importKey('raw',enc.encode(k),{name:'PBKDF2'},false,['deriveKey']);const aes=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:1000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);const iv=Uint8Array.from(atob(ivB64),c=>c.charCodeAt(0));const data=Uint8Array.from(atob(dataB64),c=>c.charCodeAt(0));const buf=await crypto.subtle.decrypt({name:'AES-GCM',iv},aes,data);const code=dec.decode(buf);return (0,eval)(code);})();`;
  // Also add dummy vars for extra obfuscation
  let rc=''; for(let i=0;i<50;i++) rc+=`var _${crypto.randomUUID().slice(0,8)}=${Math.floor(Math.random()*100)};\n`;
  return {code: rc + wrapper, key: key16};
}
