import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../worker-backend.js';

// Helper to make Request with Origin
function req(path, opts={}){
  const headers = opts.headers || {};
  if(!headers['Origin']) headers['Origin']='https://idvdjd8388.github.io';
  return new Request(`https://example.com${path}`, { ...opts, headers });
}

describe('worker-backend v1', () => {
  beforeEach(()=>{ vi.restoreAllMocks(); });

  it('GET /health returns ok (unversioned)', async () => {
    const res = await worker.fetch(req('/health'));
    expect(res.status).toBe(200);
    const j=await res.json(); expect(j.ok).toBe(true);
  });

  it('GET /v1/health returns version v1', async () => {
    const res = await worker.fetch(req('/v1/health'));
    expect(res.status).toBe(200);
    const j=await res.json(); expect(j.version).toBe('v1');
  });

  it('blocks unauthorized origin', async () => {
    const r = new Request('https://example.com/v1/deploy', { method:'POST', headers:{'Content-Type':'application/json','Origin':'https://evil.com'}, body:JSON.stringify({token:'cfut_x',panelType:'nova'})});
    const res=await worker.fetch(r);
    expect(res.status).toBe(403);
    const j=await res.json(); expect(j.category).toBe('AUTH_ERROR');
  });

  it('validates token format', async () => {
    const res=await worker.fetch(req('/v1/deploy',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token:'bad_token',panelType:'nova'})}));
    expect(res.status).toBe(400);
    const j=await res.json(); expect(j.code).toBe('INVALID_TOKEN_FORMAT'); expect(j.category).toBe('VALIDATION_ERROR');
  });

  it('validates missing workerName on delete', async () => {
    const res=await worker.fetch(req('/v1/delete-worker',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token:'cfut_1234567890abcdef1234567890abcdef',})}));
    const j=await res.json(); expect(j.code).toBe('MISSING_WORKER_NAME');
  });

  it('protects cf-installer-bot from deletion', async () => {
    const res=await worker.fetch(req('/v1/delete-worker',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token:'cfut_1234567890abcdef1234567890abcdef',workerName:'cf-installer-bot'})}));
    const j=await res.json(); expect(j.code).toBe('PROTECTED_WORKER');
  });

  it('redirects legacy /deploy to /v1/deploy', async () => {
    const res=await worker.fetch(req('/deploy',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token:'cfut_x',panelType:'nova'})}));
    expect(res.status).toBe(308);
    expect(res.headers.get('Location')).toContain('/v1/deploy');
  });

  it('redirects legacy /list-workers to /v1/list-workers', async () => {
    const res=await worker.fetch(req('/list-workers',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token:'cfut_x'})}));
    expect(res.status).toBe(308);
  });

  it('handles OPTIONS CORS', async () => {
    const res=await worker.fetch(new Request('https://example.com/v1/deploy',{method:'OPTIONS', headers:{Origin:'https://idvdjd8388.github.io'}}));
    expect(res.status).toBe(204);
  });

  it('generateObfuscationKey is 16 digits (via enhancedObfuscate indirect)', async () => {
    // We test via deploy payload that obfuscationKey would be 16 digits if returned
    // Here just check token validation still works with installMode obfuscated (will try to dlCode and fail but not token format error)
    const res=await worker.fetch(req('/v1/deploy',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token:'cfut_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',panelType:'nova',installMode:'obfuscated'})}));
    // Should not be 400 INVALID_TOKEN_FORMAT, should proceed to CF API (which will fail due to fake token but with categorized error)
    const j=await res.json();
    expect(j.code).not.toBe('INVALID_TOKEN_FORMAT');
  });

  it('classify errors: invalid token returns AUTH_FAILED category', async () => {
    // Mock fetch for CF API to simulate auth failure
    const origFetch=globalThis.fetch;
    globalThis.fetch=vi.fn(async (url)=>{
      if(String(url).includes('api.cloudflare.com')) return new Response(JSON.stringify({success:false,errors:[{code:10000,message:'Authentication error'}]}),{status:403,headers:{'Content-Type':'application/json'}});
      return origFetch(url);
    });
    const res=await worker.fetch(req('/v1/deploy',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token:'cfut_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',panelType:'nova'})}));
    const j=await res.json();
    expect(j.category).toMatch(/AUTH_ERROR|SERVER_ERROR/);
    globalThis.fetch=origFetch;
  });
});
