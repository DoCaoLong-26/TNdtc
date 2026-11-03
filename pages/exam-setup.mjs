import{completeKey}from'./core.mjs?v=local-grid-20261103';

// A prepared setup contains exam inputs only. Device settings, Drive credentials,
// existing photos and graded records belong to the current device, not the file.
export function prepareExamSetup(input,current,newExamId,validateConfig){
 if(input?.format!=='chamthi-exam-setup-v1'||!input.cfg||!Array.isArray(input.roster)||!input.keys||Array.isArray(input.keys))throw Error('Tệp cấu hình kỳ thi không hợp lệ.');
 if(typeof validateConfig!=='function')throw Error('Thiếu bước kiểm tra cấu hình.');
 let cfg=structuredClone(input.cfg);validateConfig(cfg);if(typeof cfg.name!=='string'||!cfg.name.trim()||cfg.name.length>150)throw Error('Tên kỳ thi không hợp lệ.');cfg.version=1;cfg.locked=false;
 let seen=new Set(),roster=input.roster.map(r=>{let SBD=String(r.SBD??'').trim(),HoTen=String(r.HoTen??'').trim(),Lop=String(r.Lop??'').trim();if(!/^\d{8}$/.test(SBD)||!HoTen||HoTen.length>200||Lop.length>80)throw Error('Danh sách học sinh không hợp lệ.');if(seen.has(SBD))throw Error('Trùng SBD '+SBD);seen.add(SBD);return{SBD,HoTen,Lop};});
 if(!roster.length)throw Error('Danh sách học sinh đang trống.');
 let keys={};for(let[code,key]of Object.entries(input.keys)){if(!/^\d{4}$/.test(code)||!Array.isArray(key.mc)||!Array.isArray(key.tf)||!Array.isArray(key.sa)||key.mc.length!==cfg.mc||key.tf.length!==cfg.tf||key.sa.length!==cfg.sa||!completeKey(key,cfg))throw Error('Đáp án mã '+code+' không hợp lệ hoặc chưa đủ.');keys[code]=structuredClone(key);}
 if(!Object.keys(keys).length)throw Error('Chưa có mã đề.');
 if(!newExamId||newExamId===current.examId)throw Error('Cần tạo mã kỳ thi mới.');
 let archives={...current.archives,[current.examId]:{examId:current.examId,cfg:structuredClone(current.cfg),roster:structuredClone(current.roster),keys:structuredClone(current.keys)}};
 return{...current,examId:newExamId,cfg,roster,keys,archives};
}
