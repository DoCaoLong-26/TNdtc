export const IMPORT_ACCEPT='.xlsx,.xls,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

export async function importDataFile(file,{excel,json}){
 if(!file)throw Error('Chưa chọn tệp.');
 let name=String(file.name||'').toLowerCase(),type=String(file.type||'').toLowerCase();
 if(/\.json$/.test(name))return await json(file);
 if(/\.xlsx?$/.test(name))return await excel(file);
 if(type==='application/json'||type==='text/json')return await json(file);
 throw Error('Hãy chọn tệp Excel (.xlsx, .xls) hoặc tệp cấu hình / sao lưu JSON (.json).');
}
