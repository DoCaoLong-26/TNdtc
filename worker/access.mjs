const cache=new Map();
const error=(message,status=401)=>{throw Object.assign(Error(message),{status});};
function decode(part){if(!/^[A-Za-z0-9_-]+$/.test(part))error('Token đăng nhập không hợp lệ.');try{return Uint8Array.from(atob(part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=')),c=>c.charCodeAt(0));}catch{error('Token đăng nhập không hợp lệ.');}}
function json(part){try{return JSON.parse(new TextDecoder().decode(decode(part)));}catch{error('Token đăng nhập không hợp lệ.');}}
async function keysFor(domain,fetcher,refresh=false){let entry=cache.get(domain);if(!refresh&&entry&&entry.until>Date.now())return entry.keys;let response=await fetcher(domain+'/cdn-cgi/access/certs',{redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok)error('Không kiểm tra được phiên đăng nhập. Thử lại sau.',503);let data=await response.json();if(!Array.isArray(data.keys)||data.keys.length>20)error('Bộ khóa đăng nhập không hợp lệ.',503);cache.set(domain,{keys:data.keys,until:Date.now()+300000});return data.keys;}
export async function verifyAccessToken(token,env,{fetcher=fetch,now=Math.floor(Date.now()/1000)}={}){
 let domain=String(env.ACCESS_TEAM_DOMAIN||'').replace(/\/$/,''),audience=String(env.ACCESS_POLICY_AUD||'');
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)||!audience||audience==='REPLACE_WITH_ACCESS_AUD')error('Quản trị viên chưa cấu hình đăng nhập Cloudflare Access.',503);
 if(typeof token!=='string'||token.length>16384)error('Cần đăng nhập để sử dụng website.');let parts=token.split('.');if(parts.length!==3)error('Token đăng nhập không hợp lệ.');let header=json(parts[0]),claims=json(parts[1]);
 if(header.alg!=='RS256'||typeof header.kid!=='string')error('Token đăng nhập không hợp lệ.');let keys=await keysFor(domain,fetcher),key=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!key){keys=await keysFor(domain,fetcher,true);key=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');}if(!key)error('Khóa đăng nhập không hợp lệ.');
 let cryptoKey;try{cryptoKey=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);}catch{error('Khóa đăng nhập không hợp lệ.');}
 let verified=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',cryptoKey,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));if(!verified)error('Chữ ký đăng nhập không hợp lệ.');
 if(claims.iss!==domain||!(Array.isArray(claims.aud)?claims.aud:[claims.aud]).includes(audience)||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60||(claims.nbf!==undefined&&(!Number.isFinite(claims.nbf)||claims.nbf>now+60)))error('Phiên đăng nhập hết hạn hoặc không dành cho ứng dụng này.');
 if(typeof claims.sub!=='string'||!claims.sub||claims.sub.length>200||typeof claims.email!=='string'||!/^\S+@\S+\.\S+$/.test(claims.email)||claims.email.length>200)error('Tài khoản đăng nhập thiếu thông tin.');return{id:'cfaccess:'+claims.sub,email:claims.email.trim().toLowerCase(),name:typeof claims.name==='string'?claims.name.slice(0,150):claims.email};
}
export async function identityFor(request,env,options={}){
 const host=new URL(request.url).hostname;
 if(env.AUTH_MODE==='local'&&['localhost','127.0.0.1','[::1]'].includes(host)){
  const email=String(env.DEV_EMAIL||'teacher@example.test').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))error('Email thử nghiệm không hợp lệ.',503);return{id:'local:'+email,email,name:'Giáo viên thử nghiệm'};
 }
 const cookie=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
 const token=request.headers.get('Cf-Access-Jwt-Assertion')||cookie;if(!token)error('Cần đăng nhập bằng tài khoản được cấp quyền.');return verifyAccessToken(token,env,options);
}
