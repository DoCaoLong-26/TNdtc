import{identityFor}from'./access.mjs';
import{handleTeamRequest}from'../server/team-api.mjs';
export default{async fetch(request,env){let url=new URL(request.url);try{
 // Never trust caller-supplied identity headers. Only Access JWT (or explicit
 // loopback-only local configuration) may establish the current principal.
 let user=await identityFor(request,env);
 if(url.pathname==='/login')return Response.redirect(new URL('/team.html',url.origin),303);
 if(url.pathname==='/logout')return Response.redirect(new URL('/cdn-cgi/access/logout',url.origin),303);
 if(url.pathname.startsWith('/api/')){let headers=new Headers(request.headers);for(let key of [...headers.keys()])if(key.toLowerCase().startsWith('oai-authenticated-'))headers.delete(key);headers.set('oai-authenticated-user-id',user.id);headers.set('oai-authenticated-user-email',user.email);headers.set('oai-authenticated-user-full-name',encodeURIComponent(user.name));headers.set('oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');return handleTeamRequest(new Request(request,{headers}),env);}
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 if(url.pathname==='/')url.pathname='/index.html';return env.ASSETS.fetch(new Request(url,request));
 }catch(error){let status=error.status||503,message=error.status?error.message:'Không kiểm tra được đăng nhập. Thử lại sau.';if(url.pathname.startsWith('/api/'))return Response.json({error:message},{status,headers:{'Cache-Control':'private, no-store'}});return new Response('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đăng nhập — Chấm Thi</title><body style="font:16px system-ui;max-width:640px;margin:60px auto;padding:24px"><h1>Chấm Thi</h1><p>'+message+'</p><p>Mở địa chỉ website đã được quản trị viên bảo vệ bằng Cloudflare Access. Trong chế độ chạy thử, dùng lệnh npm run dev trên máy tính.</p></body></html>',{status,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"}});}
}};
