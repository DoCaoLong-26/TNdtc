import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'), source=path.join(root,'public'), output=path.join(root,'pages');
await fs.mkdir(output,{recursive:true});
// Copy only known frontend assets, never server, credentials, database or uploads.
await fs.cp(source,output,{recursive:true});
for(const name of ['index.html','app.mjs','omr.mjs']) {
  const file=path.join(output,name);let text=await fs.readFile(file,'utf8');
  // Paths must resolve below the repository prefix on username.github.io/repo/.
  for(const asset of ['style.css','manifest.webmanifest','vendor/','app.mjs','templates.json','mau-','team.html','index.html']) {
    text=text.replaceAll('"/'+asset,'"./'+asset).replaceAll("'/"+asset,"'./"+asset);
  }
  if(name==='index.html')text=text.replace('Không gian riêng tư','Bản GitHub Pages').replace('Kỳ thi online</a>','Chấm chung: cần backend</a>');
  if(name==='app.mjs') {
    text=text.replace('function cloudBanner(){',`function cloudBanner(){return '<section class="cloud-banner"><div><b>Chấm trên thiết bị · GitHub Pages</b><p class="small">Nhập Excel, quét và lưu kết quả trên trình duyệt này. Chấm chung và phân quyền cần bản có backend.</p></div><a href="./team.html">Về chức năng chấm chung →</a></section>'; }\nfunction unusedCloudBanner(){`);
    text=text.replace("indexedDB.open('chamthi-v1',1)","indexedDB.open('chamthi-pages:'+new URL('.',location.href).pathname,1)");
    text=text.replace("if(cloudId)await loadCloud(cloudId);","if(cloudId)toast('GitHub Pages chỉ hỗ trợ chấm trên thiết bị. Mở bản có backend để dùng kỳ thi chung.');");
  }
  await fs.writeFile(file,text);
}
let cloud=await fs.readFile(path.join(output,'cloud.mjs'),'utf8');
cloud=cloud.replace('export async function api(path,options={}){',"export async function api(path,options={}){throw Error('Chấm chung cần backend. Bản GitHub Pages chỉ chấm trên thiết bị.');}\nasync function unusedApi(path,options={}){");
await fs.writeFile(path.join(output,'cloud.mjs'),cloud);
const manifest=JSON.parse(await fs.readFile(path.join(output,'manifest.webmanifest'),'utf8'));
manifest.start_url='./index.html';manifest.scope='./';for(const icon of manifest.icons)icon.src='./'+icon.src.replace(/^\//,'');
await fs.writeFile(path.join(output,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(output,'team.html'),`<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chấm chung — Chấm Thi</title><link rel="stylesheet" href="./style.css"></head>
<body><main style="max-width:760px;margin:40px auto;padding:20px"><section class="card"><h1>Kỳ thi chung cần backend</h1><p>Thầy cô đang dùng bản GitHub Pages. Bản này hỗ trợ nhập Excel, quét camera, chấm ba phần, xem ảnh và xuất điểm trên từng thiết bị.</p><p>Đăng nhập giáo viên, phân quyền, cùng chấm một kỳ thi và tổng hợp bảng điểm cần triển khai backend theo hướng dẫn trong bộ mã nguồn. GitHub Pages không cung cấp các chức năng máy chủ này.</p><p>Dữ liệu không tự chia sẻ giữa các máy. Hãy xuất bản sao lưu trước khi đổi điện thoại, xóa dữ liệu trình duyệt hoặc chuyển địa chỉ web.</p><a href="./index.html">← Tiếp tục chấm trên thiết bị</a></section></main></body></html>`);
// Do not ship the backend portal's login code in the static edition.
await fs.unlink(path.join(output,'team.mjs'));
await fs.writeFile(path.join(output,'.nojekyll'),'');
console.log('GitHub Pages assets ready: pages/');
