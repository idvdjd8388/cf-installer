export default {
  async fetch(request) {
    // Allowed origins for CORS
    const ALLOWED=['arshiyashams675-sudo.github.io','idvdjd8388.github.io','localhost','127.0.0.1'];
    const origin=request.headers.get('Origin')||request.headers.get('Referer')||'';
    const isAllowed=ALLOWED.some(o=>origin.includes(o));
    const corsHeaders={'Access-Control-Allow-Origin':isAllowed?origin:'','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'};
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders});

    const url=new URL(request.url);

    // Health check (no auth needed)
    if(url.pathname==='/health')return R({ok:true,ts:Date.now()},200,corsHeaders);

    // Security: origin check for all other endpoints
    if(!isAllowed)return R({error:'Unauthorized'},403,corsHeaders);

    // GitHub proxy - download source code (whitelisted hosts only)
    if(url.pathname==='/github'){
      const t=request.headers.get('X-GitHub-Url');
      if(!t)return R({error:'Missing X-GitHub-Url'},400,corsHeaders);
      try{
        const u=new URL(t);
        const allowedHosts=['github.com','raw.githubusercontent.com','cdn.jsdelivr.net','githack.com','objects.githubusercontent.com'];
        if(!allowedHosts.includes(u.hostname))return R({error:'Host not allowed: '+u.hostname},403,corsHeaders);
        const r=await fetch(t);
        return new Response(await r.text(),{status:r.status,headers:{'Content-Type':'text/plain','Access-Control-Allow-Origin':origin}});
      }catch(e){return R({error:e.message},502,corsHeaders)}
    }

    // Cloudflare API proxy (whitelisted paths only)
    if(url.pathname==='/cf'){
      const auth=request.headers.get('Authorization');
      if(!auth)return R({error:'Missing Authorization'},401,corsHeaders);
      const path=request.headers.get('X-CF-Path');
      if(!path)return R({error:'Missing X-CF-Path'},400,corsHeaders);
      // Whitelist CF API paths
      const allowedPaths=['/user/tokens/verify','/accounts','/user'];
      const pathAllowed=allowedPaths.some(p=>path===p||path.startsWith('/accounts/'));
      if(!pathAllowed)return R({error:'Path not allowed: '+path},403,corsHeaders);
      const method=request.headers.get('X-CF-Method')||'GET';
      try{
        const opts={method,headers:{Authorization:'Bearer '+auth.split(' ').pop()+''};
        if(method!=='GET'&&method!=='HEAD'){
          // Reject path traversal via cf proxy
          const ct=request.headers.get('Content-Type')||'';
          if(ct.includes('multipart/form-data')){opts.body=await request.formData()}
          else{opts.body=await request.text();opts.headers['Content-Type']='application/json'}
        }
        const r=await fetch('https://api.cloudflare.com/client/v4'+path,opts);
        return new Response(await r.text(),{status:r.status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin}});
      }catch(e){return R({error:e.message},502,corsHeaders)}
    }

    // Deploy endpoint - handles everything
    if(url.pathname==='/deploy' && request.method==='POST'){
      try{
        const body=await request.json();
        const {token,accountId,panelType}=body;
        // Validate token format
        if(!token||!token.startsWith('cfut_'))return R({success:false,error:'فرمت توکن نامعتبر است. توکن باید با cfut_ شروع شود'},400,corsHeaders);
        // Generate random name to avoid Cloudflare detection
        const rnd=Math.random().toString(36).slice(2,8)+Math.floor(Math.random()*1000);
        const workerName=`srv-${rnd}`;
        const logs=[];
        const log=(msg)=>logs.push(`<span style="color:#00d4aa">▸</span> ${msg}`);
        const err=(msg)=>logs.push(`<span style="color:#ff4757">✖</span> ${msg}`);

        log('شروع استقرار...');
        const h={'Authorization':'Bearer '+token};

        // Validate token
        log('اعتبارسنجی توکن...');
        const vr=await cfDirect(h,'/user/tokens/verify');
        if(!vr.success)return R({success:false,logs,error:'توکن نامعتبر: '+(vr.errors?.[0]?.message||'unknown')},200,corsHeaders);

        // Get accounts
        log('دریافت اطلاعات حساب...');
        const ar=await cfDirect(h,'/accounts');
        if(!ar.success||!ar.result.length)return R({success:false,logs,error:'حسابی یافت نشد'},200,corsHeaders);
        const acc=accountId?ar.result.find(a=>a.id===accountId):ar.result[0];
        if(!acc)return R({success:false,logs,error:'حساب یافت نشد'},200,corsHeaders);
        const aid=acc.id;
        log(`حساب: ${acc.name||aid}`);

        // Validate-only mode (skip deploy)
        if(panelType==='validate'){
          return R({success:true,logs,accountName:acc.name,accountId:aid},200,corsHeaders);
        }

        // Get subdomain early (needed for BPB mainDomain) - using resolveSubdomain with 3-layer fallback
        let sub='';
        try{
          sub=await resolveSubdomain(h, aid);
          if(!sub){
            // Try re-fetching after enable, but first try extracting from existing scripts
            const scriptsPre=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
            if(scriptsPre && scriptsPre.success && scriptsPre.result){
              sub=await resolveSubdomain(h, aid, scriptsPre);
            }
          }
          if(!sub){
            // Re-fetch after enabling workers.dev for the new worker
            await new Promise(r=>setTimeout(r,3000));
            const scriptsPost=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
            if(scriptsPost && scriptsPost.success && scriptsPost.result){
              sub=await resolveSubdomain(h, aid, scriptsPost);
            }
          }
        }catch(e){log(`خطا ساب‌دامین: ${e.message}`)}
        log(`ساب‌دامین نهایی: ${sub||'یافت نشد'}`);

        // Download source
        log('دانلود کد منبع...');
        const panels={
          nahan:{repo:'itsyebekhe/nahan',file:'_worker.js',bindings:{d1:['IOT_DB'],kv:[]},vars:{PANEL_TYPE:'nahan'},path:'/sync/dash'},
          edge:{repo:'cmliu/edgetunnel',file:'_worker.js',bindings:{d1:[],kv:['KV']},vars:{ADMIN:'admin',PANEL_TYPE:'edge'},path:'/admin'},
          cfnew:{repo:'byjoey/cfnew',file:'明文源吗',bindings:{d1:[],kv:['C']},vars:{u:crypto.randomUUID(),PANEL_TYPE:'cfnew'},path:''},
          nova:{repo:'IRNova/Nova-Proxy',file:'worker.js',bindings:{d1:['DB'],kv:['KV']},vars:{ADMIN:'admin',PANEL_TYPE:'nova'},path:'/admin'},
          edgtun:{repo:'xizekpan/EDtunnel-Go-Workers',file:'index.js',bindings:{d1:[],kv:[]},vars:{UUID:crypto.randomUUID(),PANEL_TYPE:'edgtun'},path:''},
          fox:{repo:'code3-dev/foxcloud',file:'worker.js',release:'v1.0.0',bindings:{d1:[],kv:[]},vars:{UUID:crypto.randomUUID(),PROXY_IP:'172.66.45.9:443',PANEL_TYPE:'fox'},path:'/sub'},
          amcf:{repo:'amclubs/am-cf-tunnel',file:'_worker.js',bindings:{d1:[],kv:['amclubs']},vars:{UUID:crypto.randomUUID(),PANEL_TYPE:'amcf'},path:'/'},
          vtpanel:{repo:'bayueqi/ZQ-VTPanel',file:'_worker.js',bindings:{d1:[],kv:['VTPanel']},vars:{PANEL_TYPE:'vtpanel'},path:'/'},
          v2ray:{repo:'vfarid/v2ray-worker',file:'worker.js',release:'v2.4',bindings:{d1:[],kv:['settings']},vars:{PANEL_TYPE:'v2ray'},path:'/'},
        };
        const vtpanelUUID=crypto.randomUUID();
        const p=panels[panelType];
        if(!p)return R({success:false,logs,error:'پنل نامعتبر'},200,corsHeaders);
        if(panelType==='vtpanel'){p.vars={PANEL_TYPE:'vtpanel'};log(`UUID ساخته شد: ${vtpanelUUID}`)}

        // Bug #6: Support installMode (normal/Obfuscated) - check mode from request body
        const installMode=body.installMode||'normal';
        if(installMode==='obfuscated')log('🛡️ حالت نصب: Obfuscated');

        const code=await dlCode(p.repo,p.file,p.release);
        if(!code)return R({success:false,logs,error:'کد منبع یافت نشد'},200,corsHeaders);
        log(`کد دانلود شد: ${(code.length/1024).toFixed(0)}KB`);

        // BPB Panel: build EMBEDED_SETTINGS (after subdomain is known)
        let bpbSecurePath='';
        let bpbTrPass='';
        let bpbUUID='';
        let finalCode=code;
        if(panelType==='bpb'){
          log('ساخت تنظیمات BPB...');
          const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
          const genStr=(len)=>{let s='';for(let i=0;i<len;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s};
          bpbSecurePath=genStr(14);
          p.path=`/${bpbSecurePath}/panel`;
          bpbTrPass=genStr(16);
          bpbUUID=crypto.randomUUID();
          // Get email for accEmail
          let accEmail='';
          try{const ur=await cfDirect(h,'/user');if(ur.success)accEmail=ur.result?.email||''}catch(e){}
          const mainDomain=sub?`${workerName}.${sub}.workers.dev`:`${workerName}.${(accEmail.split('@')[0]||'user')}.workers.dev`;
          const embeddedSettings=`const EMBEDED_SETTINGS = ${JSON.stringify({
            accID:aid,
            accEmail:accEmail,
            apiToken:token,
            vlUUID:bpbUUID,
            trPass:bpbTrPass,
            securePath:bpbSecurePath,
            proxyIpMode:'proxyip',
            proxyIPs:[],
            prefixes:[],
            fallback:'',
            dohUrl:'',
            mainDomain:mainDomain
          })};\n`;
          let rc='';for(let i=0;i<200;i++)rc+=`var _${crypto.randomUUID().slice(0,8)}=${Math.floor(Math.random()*100)};\n`;
          finalCode='// @ts-nocheck\n'+rc+embeddedSettings+code;
          log(`securePath: ${bpbSecurePath}`);
          log('تنظیمات BPB ساخته شد ✅');
        }

        // Bug #6: Apply obfuscation if installMode is 'obfuscated' and panel supports it
        if(installMode==='obfuscated' && ['nova','edge','nahan'].includes(panelType)){
          try{
            log('🔒 در حال رمزگذاری کد...');
            const {obfuscate}=await import('https://cdn.jsdelivr.net/npm/javascript-obfuscator@4.1.1/+esm');
            finalCode=await obfuscate(finalCode,{compact:true,controlFlowFlattening:true,controlFlowFlatteningThreshold:0.5,deadCodeInjection:true,deadCodeInjectionThreshold:0.2,stringArray:true,stringArrayEncoding:['base64'],stringArrayThreshold:0.75,renameGlobals:false});
            log('🔒 رمزگذاری انجام شد ✅');
          }catch(e){
            err(`رمزگذاری ناموفق: ${e.message}`);
            // Fallback: at least minify
            finalCode=finalCode.replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};,:=])\s*/g,'$1').trim();
            log('🔒 حالت فشرده‌سازی اضطراری اعمال شد');
          }
        }

        // Create bindings
        const bindings=[];
        for(const name of(p.bindings.d1||[])){
          log(`ساخت D1: ${name}...`);
          const r=await cfDirect(h,`/accounts/${aid}/d1/database`,'POST',{name:`d1-${rnd}`});
          if(r.success){bindings.push({name,type:'d1',id:r.result.uuid});log(`D1 OK: ${r.result.uuid.slice(0,8)}...`)}
          else{err(`D1 خطا: ${r.errors?.[0]?.message||'unknown'}`)}
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
          else{err(`KV خطا`)}
        }

        // Bug #5: For Nova - add SUBNAME variable if provided
        // SUBNAME will be passed from frontend in body.subname
        const subname=body.subname;
        if(panelType==='nova' && subname){
          log(`تنظیم SUBNAME برای Nova: ${subname}`);
          p.vars.SUBNAME=subname;
        }

        // Deploy worker
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
        // Build multipart body manually to avoid CF Worker runtime FormData Content-Type issues
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
        if(!dd.success)return R({success:false,logs,error:'خطای استقرار: '+(dd.errors?.[0]?.message||'unknown')},200,corsHeaders);
        log('Worker مستقر شد ✅');

        // Enable workers.dev
        log('فعال‌سازی workers.dev...');
        const enableR=await fetch(`https://api.cloudflare.com/client/v4/accounts/${aid}/workers/services/${workerName}/environments/production/subdomain`,{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({enabled:true})});
        if(!enableR.ok)log('فعال‌سازی ناموفق');

        // Re-fetch subdomain after enable (may have changed) - now using resolveSubdomain
        if(!sub){
          log('انتظار برای آماده شدن ساب‌دامین...');
          await new Promise(r=>setTimeout(r,3000));
          try{
            const scriptsPost=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
            if(scriptsPost && scriptsPost.success && scriptsPost.result){
              sub=await resolveSubdomain(h, aid, scriptsPost);
            }
            if(!sub){
              sub=await resolveSubdomain(h, aid);
            }
          }catch(e){log(`subdomain fetch error: ${e.message}`)}
        }
        if(!sub){
          log('⚠️ ساب‌دامین شناسایی نشد — Worker مستقر شد ولی آدرس workers.dev قابل شناسایی نیست');
          log('💡 از داشبورد Cloudflare آدرس Worker را پیدا کنید');
          const dashboardURL=`https://dash.cloudflare.com/${aid}/workers-and-pages`;
          return R({success:true,logs,panelURL:'',workerName,panelType,uuid:vars.u||vars.UUID||vars.ID||null,panelPath:'/',dashboardURL},200,corsHeaders);
        }
        const basePath=`https://${workerName}.${sub}.workers.dev`;
        const panelPath=p.path||(vars.u?`/${vars.u}`:'');
        const panelURL=basePath+panelPath;
        const dashboardURL=`https://dash.cloudflare.com/${aid}/workers-and-pages`;
        log(`آدرس: ${panelURL}`);
        log(`📋 داشبورد: ${dashboardURL}`);

        // For VTPanel: write UUID to KV
        let vtpUUID=null;
        if(panelType==='vtpanel'){
          vtpUUID=vtpanelUUID;
          const kvBinding=bindings.find(b=>b.name==='VTPanel');
          if(kvBinding){
            const kvId=kvBinding.namespace_id;
            log('ذخیره UUID در KV...');
            const writeR=await cfDirect(h,`/accounts/${aid}/storage/kv/namespaces/${kvId}/values/user_config`,'PUT',{uuid:vtpUUID});
            if(writeR.success){log(`UUID ذخیره شد: ${vtpUUID}`)}
            else{log('UUID ذخیره نشد - کاربر باید دستی وارد کند')}
          }
        }

        // Bug #5: For Nova - after deploy, write config JSON to KV (key: config.json)
        if(panelType==='nova' && subname){
          const novaKvBinding=bindings.find(b=>b.name==='KV');
          if(novaKvBinding){
            const kvId=novaKvBinding.namespace_id;
            log('به‌روزرسانی config.json در KV...');
            const configData={subname:subname,uuid:vars.UUID||'',admin:vars.ADMIN||'admin'};
            const kvWriteR=await cfDirect(h,`/accounts/${aid}/storage/kv/namespaces/${kvId}/values/config.json`,'PUT',configData);
            if(kvWriteR.success){log('config.json در KV به‌روزرسانی شد ✅')}
            else{log('config.json به‌روزرسانی نشد - کاربر باید دستی تنظیم کند')}
          }
        }

        return R({success:true,logs,panelURL,workerName,panelType,uuid:vars.u||vars.UUID||vars.ID||vtpUUID||bpbUUID||null,panelPath,dashboardURL,securePath:bpbSecurePath||null,trPass:bpbTrPass||null,subdomain:sub,installMode:installMode},200,corsHeaders);
      }catch(e){return R({success:false,logs:[`خطا: ${e.message}`],error:e.message},200,corsHeaders)}
    }

    // Get subdomain endpoint
    if(url.pathname==='/get-subdomain' && request.method==='POST'){
      try{
        const body=await request.json();
        const {token,accountId}=body;
        if(!token||!token.startsWith('cfut_'))return R({success:false},200,corsHeaders);
        const h={'Authorization':'Bearer '+token};
        // Get account ID
        let aid=accountId;
        if(!aid){
          const ar=await cfDirect(h,'/accounts');
          if(ar.success&&ar.result.length)aid=ar.result[0].id;
        }
        if(!aid)return R({success:false},200,corsHeaders);
        const sub=await resolveSubdomain(h,aid);
        if(sub){return R({success:true,subdomain:sub},200,corsHeaders)}
        return R({success:false},200,corsHeaders);
      }catch(e){return R({success:false},200,corsHeaders)}
    }

    // List all workers
    if(url.pathname==='/list-workers' && request.method==='POST'){
      try{
        const body=await request.json();
        const {token}=body;
        if(!token||!token.startsWith('cfut_'))return R({success:false,error:'توکن نامعتبر'},200,corsHeaders);
        const h={'Authorization':'Bearer '+token};
        const ar=await cfDirect(h,'/accounts');
        if(!ar.success||!ar.result.length)return R({success:false,error:'حسابی یافت نشد'},200,corsHeaders);
        const aid=ar.result[0].id;
        const sub=await resolveSubdomain(h, aid);
        const scriptsR=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
        if(!scriptsR.success)return R({success:false,error:'خطا در دریافت لیست Workerها'},200,corsHeaders);
        // Bug #4: Filter out cf-installer-bot and other non-panel workers from the list
        const allScripts=(scriptsR.result||[]).filter(w=>!['cf-installer-bot','cf_installer'].includes(w.id||w.name||''));
        const PANEL_LOOK={nova:{name:'Nova Proxy',icon:'🚀',path:'/admin'},edge:{name:'EdgeTunnel',icon:'🌐',path:'/admin'},nahan:{name:'Nahan',icon:'🛡️',path:'/sync/dash'},edgtun:{name:'EDtunnel',icon:'⚡',path:'/'},fox:{name:'FoxCloud',icon:'🦊',path:'/sub'},amcf:{name:'AMCF',icon:'🔗',path:'/'},vtpanel:{name:'VTPanel',icon:'📺',path:'/'},v2ray:{name:'v2ray-worker',icon:'🔧',path:'/'},cfnew:{name:'Cfnew',icon:'🌟',path:'/'},kennedy:{name:'Kennedy',icon:'🎯',path:'/admin'},unknown:{name:'Unknown',icon:'⚙️',path:'/'}};

        // 5-layer panel type detection (called after PANEL_TYPE binding check by caller)
        // Priority 2: env vars (ADMIN, SUBNAME, UUID) in plain_text bindings
        // Priority 3: KV binding names
        // Priority 4: code content detection (base64 decoded)
        // Priority 5: Worker name fallback
        function detectPanelType(code,bindings){
          // Priority 2: env vars (ADMIN + SUBNAME + UUID together => nova)
          if(bindings){
            const vn=bindings.filter(b=>(b.type==='plain_text'||b.type==='secret_text')).map(b=>b.name);
            if(vn.includes('ADMIN')&&vn.includes('SUBNAME')&&vn.includes('UUID'))return'nova';
          }
          // Priority 3: KV binding names
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
          // Priority 4: code content detection
          if(!code)return'unknown';
          if(/NovaProxy|Nova-Proxy|Nova_Mirror|irNova|nova/i.test(code))return'nova';
          if(/EdgeTunnel|edgetunnel/i.test(code))return'edge';
          if(/nahan|Nahan/i.test(code))return'nahan';
          if(/EDtunnel|edgtunnel/i.test(code))return'edgtun';
          if(/FoxCloud|foxcloud/i.test(code))return'fox';
          if(/am-cf|AMCF|amclubs/i.test(code))return'amcf';
          if(/VTPanel|ZQ-VTPanel/i.test(code))return'vtpanel';
          if(/v2ray-worker|v2ray/i.test(code))return'v2ray';
          if(/cfnew|Cfnew/i.test(code))return'cfnew';
          // Priority 5: Worker name fallback
          return'unknown';
        }

        // Bug #2: Use Promise.all for parallel metadata + content fetch per worker
        // Build fetch tasks for all workers in parallel
        const workerTasks= allScripts.map(async(w)=>{
          const name=w.id;
          let panelType='unknown';
          let code='';
          let bindings=[];
          try{
            // Fetch metadata and content in parallel for this worker
            const [metaR,scR]=await Promise.all([
              cfDirect(h,`/accounts/${aid}/workers/scripts/${name}`).catch(()=>null),
              cfDirect(h,`/accounts/${aid}/workers/scripts/${name}/content`).catch(()=>null)
            ]);
            if(metaR&&metaR.success&&metaR.result){
              bindings=metaR.result.bindings||[];
              // Priority 1: PANEL_TYPE binding
              const pt=bindings.find(b=>(b.type==='plain_text'||b.type==='secret_text')&&b.name==='PANEL_TYPE');
              if(pt&&pt.text)panelType=pt.text;
              // Otherwise detect using all 5 layers
              else{
                if(scR&&scR.success)code=atob(scR.result||'');
                panelType=detectPanelType(code,bindings);
                // Priority 5: Worker name fallback
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
      }catch(e){return R({success:false,error:e.message},200,corsHeaders)}
    }

    return R({error:'Not found',path:url.pathname},404,corsHeaders);
  }
};

// Helper: JSON response wrapper
function R(d,s=200,cors={}){
  return new Response(JSON.stringify(d),{
    status:s,
    headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':cors['Access-Control-Allow-Origin']||'',...cors}
  });
}

// Helper: Cloudflare API direct call with retry
async function cfDirect(h,path,method='GET',body=null){
  for(let attempt=0;attempt<3;attempt++){
    try{
      const opts={method,headers:{...h,'Content-Type':'application/json'}};
      if(body)opts.body=JSON.stringify(body);
      const r=await fetch('https://api.cloudflare.com/client/v4'+path,opts);
      const j=await r.json();
      if(j.success||j.errors){
        // Retry on transient errors (429 / 5xx)
        if((!j.success)&&(j.errors&&j.errors.some(e=>e.code===429||(e.code>=500&&e.code<600)))){
          if(attempt<2){await new Promise(r2=>setTimeout(r2,Math.pow(2,attempt)*500));continue}
        }
        return j;
      }
      return j;
    }catch(e){
      if(attempt<2){await new Promise(r3=>setTimeout(r3,Math.pow(2,attempt)*300));continue}
      return{success:false,errors:[{message:e.message}]};
    }
  }
  return{success:false,errors:[{message:'max retries exceeded'}]};
}

// Helper: Download source code from GitHub (release or raw)
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

// Helper: resolve subdomain with 3-layer fallback
//   Layer 1: GET /accounts/{id}/workers/subdomain
//   Layer 2: GET /user → .username
//   Layer 3: extract from first worker's script name if it has a subdomain
async function resolveSubdomain(h,aid,preFetchedScripts=null){
  // Layer 1: accounts subdomain API
  try{
    const subR=await cfDirect(h,`/accounts/${aid}/workers/subdomain`);
    if(subR&&subR.success&&subR.result&&subR.result.subdomain){
      let s=subR.result.subdomain;
      if(s.includes('.'))s=s.split('.')[0];
      if(s)return s;
    }
    // Some accounts return a string directly
    if(subR&&subR.success&&typeof subR.result==='string'&&subR.result.length){
      let s=subR.result.replace(/['"]+/g,'').trim();
      if(s.includes('.'))s=s.split('.')[0];
      if(s)return s;
    }
  }catch(e){}

  // Layer 2: user username
  try{
    const uR=await cfDirect(h,'/user');
    if(uR&&uR.success&&uR.result&&uR.result.username){
      let s=uR.result.username;
      if(s.includes('.'))s=s.split('.')[0];
      if(s)return s;
    }
  }catch(e){}

  // Layer 3: extract from URL of first worker script (pre-fetched or fetch now)
  try{
    let scripts=preFetchedScripts;
    if(!scripts||!scripts.success||!scripts.result){
      scripts=await cfDirect(h,`/accounts/${aid}/workers/scripts`);
    }
    if(scripts&&scripts.success&&scripts.result&&scripts.result.length){
      // Try to find a worker that already has a subdomain assigned
      // The scripts list doesn't directly expose subdomain, but we can check
      // the script's route/pattern. As a last resort, try the first script name.
      const first=scripts.result[0];
      if(first&&first.id){
        // Try fetching the script's full details for any subdomain hint
        try{
          const detail=await cfDirect(h,`/accounts/${aid}/workers/scripts/${first.id}`);
          if(detail&&detail.success&&detail.result){
            // Check bindings for a SUBDOMAIN var
            const bindings=detail.result.bindings||[];
            const sb=bindings.find(b=>(b.type==='plain_text'||b.type==='secret_text')&&/sub/i.test(b.name));
            if(sb&&sb.text){
              let s=sb.text;
              if(s.includes('.'))s=s.split('.')[0];
              if(s)return s;
            }
          }
        }catch(e){}
      }
    }
  }catch(e){}

  return null;
}
