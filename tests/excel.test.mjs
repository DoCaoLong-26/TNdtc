import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import{parseWorkbook}from'../public/excel.mjs';
import{defaults}from'../public/core.mjs';
const require=createRequire(import.meta.url),X=require('xlsx');
let wb=X.utils.book_new(),rows=[];for(let q=0;q<12;q++)rows.push({MaDe:'1201',Phan:1,Cau:q+1,Y:'',DapAn:'ABCD'[q%4]});for(let q=0;q<4;q++)for(let i=0;i<4;i++)rows.push({MaDe:'1201',Phan:2,Cau:q+1,Y:'abcd'[i],DapAn:i%2?'S':'Đ'});for(let[q,v]of['-1,5','2','0,25','12','3,5','-2'].entries())rows.push({MaDe:'1201',Phan:3,Cau:q+1,Y:'',DapAn:v});X.utils.book_append_sheet(wb,X.utils.json_to_sheet([{SBD:'00123456',HoTen:'Học sinh thử nghiệm',Lop:'12A1'}]),'HocSinh');X.utils.book_append_sheet(wb,X.utils.json_to_sheet(rows),'DapAn');let r=parseWorkbook(wb,defaults,X);
assert.equal(r.roster[0].SBD,'00123456');assert.equal(r.keys['1201'].sa[0],'-1,5');assert.equal(r.keys['1201'].tf[0].join(''),'ĐSĐS');
let missing=X.utils.book_new();X.utils.book_append_sheet(missing,X.utils.json_to_sheet([{MaDe:'0012',Phan:1,Cau:1,DapAn:'A'}]),'DapAn');assert.throws(()=>parseWorkbook(missing,defaults,X),/thiếu đáp án/);
let dup=X.utils.book_new();X.utils.book_append_sheet(dup,X.utils.json_to_sheet([{SBD:'12',HoTen:'A'},{SBD:'00000012',HoTen:'B'}]),'HocSinh');assert.throws(()=>parseWorkbook(dup,defaults,X),/Trùng SBD/);
let leading=X.utils.book_new();X.utils.book_append_sheet(leading,X.utils.json_to_sheet([{SBD:12,HoTen:'A'}]),'HocSinh');assert.equal(parseWorkbook(leading,defaults,X).roster[0].SBD,'00000012');
let bad=X.utils.book_new();X.utils.book_append_sheet(bad,X.utils.json_to_sheet([{MaDe:'1',Phan:3,Cau:1,DapAn:'12345'}]),'DapAn');assert.throws(()=>parseWorkbook(bad,defaults,X),/không biểu diễn/);
const arr=X.write(wb,{type:'array',bookType:'xlsx'});assert.equal(parseWorkbook(X.read(arr,{type:'array',cellText:true}),defaults,X).roster[0].SBD,'00123456');
console.log('Excel import/export, leading zeros, duplicate SBD, missing keys and invalid short answer checks passed.');
// Compact tables may have arbitrary sheet names. Semicolons separate numeric
// answers, while a decimal comma remains part of its answer.
let compact=X.utils.book_new(),cfg={...defaults,mc:2,tf:1,sa:2},rowsCompact=[{MaDe:'12',Phan1:'B A',Phan2:'SĐ ĐS',Phan3:'82,5; 278'},{MaDe:'13',Phan1:'CD',Phan2:'ĐSĐS',Phan3:'0; -1,5'}];X.utils.book_append_sheet(compact,X.utils.json_to_sheet(rowsCompact),'Dap_an_KSCL');let compactBefore=JSON.stringify(compact,(k,v)=>k==='w'?undefined:v),parsed=parseWorkbook(compact,cfg,X);assert.deepEqual(parsed.keys['0012'],{mc:['B','A'],tf:[['S','Đ','Đ','S']],sa:['82,5','278']});assert.equal(parsed.keys['0013'].sa[0],'0');assert.equal(JSON.stringify(compact,(k,v)=>k==='w'?undefined:v),compactBefore,'parser must not modify original workbook');
function compactBad(row){let wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.json_to_sheet([row]),'Keys');return wb;}
assert.throws(()=>parseWorkbook(compactBad({...rowsCompact[0],Phan2:'ĐS'}),cfg,X),/Phan2/);
assert.throws(()=>parseWorkbook(compactBad({...rowsCompact[0],Phan3:'82,5,278'}),cfg,X),/Phan3/);
assert.throws(()=>parseWorkbook(compactBad({...rowsCompact[0],Phan1:'BAD'}),cfg,X),/Phan1/);
let duplicateCompact=X.utils.book_new();X.utils.book_append_sheet(duplicateCompact,X.utils.json_to_sheet([rowsCompact[0],rowsCompact[0]]),'Keys');assert.throws(()=>parseWorkbook(duplicateCompact,cfg,X),/trùng mã đề/);
console.log('Compact table, decimal comma, count validation, duplicate codes and original-workbook preservation passed.');

let compactNamedDapAn=X.utils.book_new();X.utils.book_append_sheet(compactNamedDapAn,X.utils.json_to_sheet(rowsCompact),'DapAn');assert.deepEqual(parseWorkbook(compactNamedDapAn,cfg,X).keys,parsed.keys);console.log('Compact sheet named DapAn also recognized.');
let multiRoster=X.utils.book_new();X.utils.book_append_sheet(multiRoster,X.utils.json_to_sheet([{SBD:'99999999',HoTen:'Other sheet',Lop:'11A'}]),'HocSinh');X.utils.book_append_sheet(multiRoster,X.utils.json_to_sheet([{TT:1,HoTen:'Selected student',NgaySinh:'01/01/2009',Lop:'12B',SBD:'00000001',Email:'unused@example.invalid'}]),'Sheet12');let selected=parseWorkbook(multiRoster,defaults,X,{rosterSheet:'Sheet12'});assert.deepEqual(selected.roster,[{SBD:'00000001',HoTen:'Selected student',Lop:'12B'}]);assert.throws(()=>parseWorkbook(multiRoster,defaults,X,{rosterSheet:'Missing'}),/Không tìm thấy sheet/);assert.equal(parseWorkbook(multiRoster,defaults,X).roster[0].SBD,'99999999');console.log('Explicit Sheet12 selection excludes other sheets, dates of birth and emails.');

{let book=X.utils.book_new();X.utils.book_append_sheet(book,X.utils.json_to_sheet([{SBD:'00000001',HoTen:'Học sinh kiểm thử',Lop:'10A1',PhongThi:'01'}]),'HocSinh');assert.equal(parseWorkbook(book,defaults,X).roster[0].Phong,'01');console.log('Optional exam-room import preserves room leading zeros.');}
