/**
 * MiniPOS Perú - Google Apps Script
 * 1) Crea un Google Sheet nuevo.
 * 2) Extensiones > Apps Script.
 * 3) Pega este archivo.
 * 4) Ejecuta setup() una vez y autoriza.
 * 5) Implementar > Nueva implementación > Aplicación web.
 *    Ejecutar como: tú
 *    Quién tiene acceso: cualquier usuario con el enlace (o la opción disponible en tu cuenta).
 * 6) Copia la URL /exec en la PWA > Configuración.
 *
 * Hojas creadas:
 * Productos, Ventas, DetalleVentas, Movimientos, Clientes
 */

const SHEETS = {
  Productos: ["code","name","category","price","stock","minStock","updatedAt"],
  Ventas: ["id","date","total","payment","customer","reference"],
  DetalleVentas: ["saleId","code","name","qty","price","subtotal"],
  Movimientos: ["id","date","type","code","product","qty","total","supplier"],
  Clientes: ["doc","name","phone","email","purchases"]
};

function setup(){
  const ss=SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(name=>{
    let sh=ss.getSheetByName(name);
    if(!sh) sh=ss.insertSheet(name);
    if(sh.getLastRow()===0) sh.appendRow(SHEETS[name]);
    else if(sh.getRange(1,1,1,SHEETS[name].length).getValues()[0].join("|")!==SHEETS[name].join("|")){
      sh.clear();sh.appendRow(SHEETS[name]);
    }
    sh.setFrozenRows(1);
  });
  return "OK";
}
function json(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function rows(name){
  const sh=SpreadsheetApp.getActive().getSheetByName(name), values=sh.getDataRange().getValues();
  if(values.length<2)return [];
  const h=values.shift();return values.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])));
}
function append(name,obj){
  const sh=SpreadsheetApp.getActive().getSheetByName(name), h=SHEETS[name];
  sh.appendRow(h.map(k=>obj[k]!==undefined?obj[k]:""));
}
function doGet(e){
  try{
    const a=e.parameter.action||"getData";
    if(a==="getData")return json({ok:true,products:rows("Productos"),customers:rows("Clientes"),movements:rows("Movimientos"),sales:rows("Ventas")});
    return json({ok:false,message:"Acción GET no válida"});
  }catch(err){return json({ok:false,message:err.message})}
}
function doPost(e){
  try{
    const body=JSON.parse(e.postData.contents||"{}"), a=body.action, p=body.payload||{};
    if(a==="product"){append("Productos",p);return json({ok:true})}
    if(a==="customer"){append("Clientes",p);return json({ok:true})}
    if(a==="movement"){
      append("Movimientos",p);
      updateStock(p.code,Number(p.qty||0));
      return json({ok:true});
    }
    if(a==="sale"){
      append("Ventas",{id:p.id,date:p.date,total:p.total,payment:p.payment,customer:p.customer,reference:p.reference});
      (p.items||[]).forEach(i=>append("DetalleVentas",{saleId:p.id,code:i.code,name:i.name,qty:i.qty,price:i.price,subtotal:Number(i.qty)*Number(i.price)}));
      (p.items||[]).forEach(i=>updateStock(i.code,-Number(i.qty||0)));
      if(p.customer)increaseCustomer(p.customer);
      return json({ok:true});
    }
    return json({ok:false,message:"Acción no reconocida"});
  }catch(err){return json({ok:false,message:err.message})}
}
function updateStock(code,delta){
  const sh=SpreadsheetApp.getActive().getSheetByName("Productos"), data=sh.getDataRange().getValues();
  const idx=data[0].indexOf("code"), stockIdx=data[0].indexOf("stock"), upd=data[0].indexOf("updatedAt");
  for(let r=1;r<data.length;r++){
    if(String(data[r][idx])===String(code)){
      sh.getRange(r+1,stockIdx+1).setValue(Number(data[r][stockIdx]||0)+delta);
      sh.getRange(r+1,upd+1).setValue(new Date());
      return;
    }
  }
}
function increaseCustomer(doc){
  const sh=SpreadsheetApp.getActive().getSheetByName("Clientes"), data=sh.getDataRange().getValues();
  const idx=data[0].indexOf("doc"), pidx=data[0].indexOf("purchases");
  for(let r=1;r<data.length;r++)if(String(data[r][idx])===String(doc)){sh.getRange(r+1,pidx+1).setValue(Number(data[r][pidx]||0)+1);return;}
}
