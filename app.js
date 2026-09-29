const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const state={products:[],customers:[],movements:[],sales:[],cart:[],apiUrl:localStorage.getItem("minipos_api")||"",businessName:localStorage.getItem("minipos_name")||"Mi negocio"};
let deferredInstall=null;

function money(n){return `S/ ${Number(n||0).toFixed(2)}`}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function saveLocal(){localStorage.setItem("minipos_products",JSON.stringify(state.products));localStorage.setItem("minipos_customers",JSON.stringify(state.customers));localStorage.setItem("minipos_movements",JSON.stringify(state.movements));localStorage.setItem("minipos_sales",JSON.stringify(state.sales))}
function loadLocal(){["products","customers","movements","sales"].forEach(k=>state[k]=JSON.parse(localStorage.getItem("minipos_"+k)||"[]"))}
async function api(action,payload={}){
  if(!state.apiUrl) throw new Error("Configura primero la URL de Apps Script.");
  const url=new URL(state.apiUrl);url.searchParams.set("action",action);
  if(action==="getData"){const r=await fetch(url);return r.json()}
  const r=await fetch(state.apiUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,payload})});
  return r.json();
}
async function sync(){
  if(!state.apiUrl){updateConnection();return}
  try{
    const d=await api("getData");
    if(d.ok){state.products=d.products||[];state.customers=d.customers||[];state.movements=d.movements||[];state.sales=d.sales||[];saveLocal();renderAll();$("#kpiSync").textContent=new Date().toLocaleTimeString();$("#statusBox").textContent="Conectado correctamente con Google Sheets.";$("#connectionBadge").className="badge online";$("#connectionBadge").textContent="Google Sheets";}
  }catch(e){$("#statusBox").textContent="No se pudo sincronizar. Se muestran los datos locales.";toast(e.message)}
}
function updateConnection(){const ok=!!state.apiUrl;$("#connectionBadge").className="badge "+(ok?"online":"offline");$("#connectionBadge").textContent=ok?"Configurado":"Sin configurar";$("#apiUrl").value=state.apiUrl;$("#businessName").value=state.businessName}
function nav(view){$$(".view").forEach(x=>x.classList.remove("active"));$("#"+view).classList.add("active");$$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===view));renderAll()}
function renderDashboard(){
 const today=new Date().toISOString().slice(0,10), ss=state.sales.filter(s=>String(s.date||"").slice(0,10)===today);
 $("#kpiSales").textContent=money(ss.reduce((a,s)=>a+Number(s.total||0),0));$("#kpiTickets").textContent=`${ss.length} comprobantes`;
 $("#kpiProducts").textContent=state.products.length;$("#kpiLow").textContent=state.products.filter(p=>Number(p.stock)<=Number(p.minStock||0)).length;
}
function renderProducts(){
 const q=($("#inventorySearch")?.value||"").toLowerCase();
 $("#productsTable").innerHTML=state.products.filter(p=>`${p.code} ${p.name} ${p.category}`.toLowerCase().includes(q)).map(p=>`<tr><td>${p.code}</td><td>${p.name}</td><td>${p.category||"—"}</td><td>${money(p.price)}</td><td class="${Number(p.stock)<=Number(p.minStock||0)?"low":""}">${p.stock}</td><td>${p.minStock||0}</td><td><button class="secondary" onclick="addToCart('${String(p.code).replaceAll("'","\\'")}')">Vender</button></td></tr>`).join("")||`<tr><td colspan="7">No hay productos registrados.</td></tr>`;
 $("#movementProduct").innerHTML=state.products.map(p=>`<option value="${p.code}">${p.name} (${p.stock})</option>`).join("");
}
function renderCart(){
 $("#cartList").innerHTML=state.cart.length?state.cart.map((x,i)=>`<div class="cart-item"><div><strong>${x.name}</strong><small>${x.code} · ${money(x.price)}</small></div><input type="number" min="1" max="${x.maxStock}" value="${x.qty}" onchange="changeQty(${i},this.value)"><strong>${money(x.price*x.qty)}</strong><button class="ghost" onclick="removeCart(${i})">×</button></div>`).join(""):`<div class="status-box">El carrito está vacío. Busca un producto o usa la cámara para escanear un código.</div>`;
 const sub=state.cart.reduce((a,x)=>a+x.price*x.qty,0), dis=Number($("#discount").value||0);$("#subtotal").textContent=money(sub);$("#grandTotal").textContent=money(Math.max(0,sub-dis));
}
function renderCustomers(){
 $("#customersTable").innerHTML=state.customers.map(c=>`<tr><td>${c.doc||"—"}</td><td>${c.name}</td><td>${c.phone||"—"}</td><td>${c.email||"—"}</td><td>${c.purchases||0}</td></tr>`).join("")||`<tr><td colspan="5">No hay clientes registrados.</td></tr>`;
 $("#saleCustomer").innerHTML=`<option value="">Público general</option>`+state.customers.map(c=>`<option value="${c.doc||c.name}">${c.name}</option>`).join("");
}
function renderMovements(){ $("#movementHistory").innerHTML=state.movements.slice().reverse().slice(0,30).map(m=>`<div class="history-item"><span><strong>${m.type}</strong><br><small>${m.product} · ${m.qty} und. · ${m.date}</small></span><strong>${money(m.total)}</strong></div>`).join("")||"Sin movimientos."}
function renderReports(){
 const sales=state.sales;const total=sales.reduce((a,s)=>a+Number(s.total||0),0);$("#reportSales").textContent=sales.length;$("#reportTicket").textContent=money(sales.length?total/sales.length:0);$("#reportStockValue").textContent=money(state.products.reduce((a,p)=>a+Number(p.price||0)*Number(p.stock||0),0));$("#reportCritical").textContent=state.products.filter(p=>Number(p.stock)<=Number(p.minStock||0)).length;
 const m={};sales.forEach(s=>m[s.payment]=(m[s.payment]||0)+Number(s.total||0));$("#paymentSummary").innerHTML=Object.entries(m).map(([k,v])=>`<div class="summary-item"><span>${k}</span><strong>${money(v)}</strong></div>`).join("")||"No hay ventas.";
}
function renderAll(){renderDashboard();renderProducts();renderCart();renderCustomers();renderMovements();renderReports();updateConnection()}
function addToCart(code){const p=state.products.find(x=>String(x.code)===String(code));if(!p)return toast("Producto no encontrado");if(Number(p.stock)<=0)return toast("Producto sin stock");const e=state.cart.find(x=>String(x.code)===String(code));if(e){if(e.qty<e.maxStock)e.qty++;else toast("Stock insuficiente")}else state.cart.push({code:p.code,name:p.name,price:Number(p.price),qty:1,maxStock:Number(p.stock)});nav("sales");renderCart()}
function changeQty(i,v){state.cart[i].qty=Math.max(1,Math.min(Number(v),state.cart[i].maxStock));renderCart()}
function removeCart(i){state.cart.splice(i,1);renderCart()}
window.addToCart=addToCart;window.changeQty=changeQty;window.removeCart=removeCart;

async function completeSale(){
 if(!state.cart.length)return toast("Agrega productos al carrito.");
 const total=Math.max(0,state.cart.reduce((a,x)=>a+x.price*x.qty,0)-Number($("#discount").value||0));
 const sale={id:"V-"+Date.now(),date:new Date().toISOString(),items:state.cart.map(x=>({code:x.code,name:x.name,qty:x.qty,price:x.price})),total,payment:$("#paymentMethod").value,customer:$("#saleCustomer").value,reference:$("#paymentRef").value};
 try{if(state.apiUrl){const r=await api("sale",sale);if(!r.ok)throw Error(r.message||"Error al registrar")}else state.sales.push(sale);
 state.cart.forEach(x=>{const p=state.products.find(p=>String(p.code)===String(x.code));if(p)p.stock-=x.qty});state.sales.push(...(state.apiUrl?[]:[sale]));saveLocal();state.cart=[];$("#discount").value=0;$("#paymentRef").value="";toast("Venta registrada correctamente.");renderAll();if(state.apiUrl)sync();
 }catch(e){toast(e.message)}
}
async function registerProduct(data){
 const p={code:data.code.trim(),name:data.name.trim(),category:data.category.trim(),price:Number(data.price),stock:Number(data.stock),minStock:Number(data.minStock||0)};
 try{if(state.apiUrl){const r=await api("product",p);if(!r.ok)throw Error(r.message||"No se pudo guardar")}state.products.push(p);saveLocal();$("#productDialog").close();renderAll();toast("Producto guardado.");if(state.apiUrl)sync()}catch(e){toast(e.message)}
}
async function registerCustomer(data){
 const c={doc:data.doc.trim(),name:data.name.trim(),phone:data.phone.trim(),email:data.email.trim(),purchases:0};
 try{if(state.apiUrl){const r=await api("customer",c);if(!r.ok)throw Error(r.message||"No se pudo guardar")}state.customers.push(c);saveLocal();$("#customerDialog").close();renderAll();toast("Cliente guardado.");if(state.apiUrl)sync()}catch(e){toast(e.message)}
}
async function registerEntry(){
 const p=state.products.find(x=>String(x.code)===$("#movementProduct").value);const qty=Number($("#movementQty").value),cost=Number($("#movementCost").value||0);if(!p||qty<1)return toast("Completa los datos.");
 const m={id:"M-"+Date.now(),date:new Date().toISOString(),type:"Entrada",product:p.name,code:p.code,qty,total:qty*cost,supplier:$("#movementSupplier").value};
 try{if(state.apiUrl){const r=await api("movement",m);if(!r.ok)throw Error(r.message||"No se pudo guardar")}p.stock+=qty;state.movements.push(m);saveLocal();renderAll();toast("Entrada de mercadería registrada.");if(state.apiUrl)sync()}catch(e){toast(e.message)}
}
function searchAdd(){const q=$("#productSearch").value.trim().toLowerCase();const p=state.products.find(x=>String(x.code).toLowerCase()===q||String(x.name).toLowerCase().includes(q));if(p)addToCart(p.code);else toast("No se encontró el producto.")}
async function scan(){if(!("BarcodeDetector" in window))return toast("Tu navegador no admite lectura nativa de códigos. Usa el buscador o Chrome/Android actualizado.");const supported=await BarcodeDetector.getSupportedFormats();const input=document.createElement("input");input.type="file";input.accept="image/*";input.capture="environment";input.onchange=async()=>{const file=input.files[0];if(!file)return;const bitmap=await createImageBitmap(file);const detector=new BarcodeDetector({formats:supported});const codes=await detector.detect(bitmap);if(codes[0])addToCart(codes[0].rawValue);else toast("No se detectó ningún código.");};input.click()}

$$(".nav").forEach(b=>b.onclick=()=>nav(b.dataset.view));$$("[data-go]").forEach(b=>b.onclick=()=>nav(b.dataset.go));
$("#newProductBtn").onclick=()=>$("#productDialog").showModal();$("#newCustomerBtn").onclick=()=>$("#customerDialog").showModal();$("#scanBtn").onclick=scan;$("#addSearchBtn").onclick=searchAdd;$("#productSearch").addEventListener("keydown",e=>{if(e.key==="Enter")searchAdd()});$("#discount").oninput=renderCart;$("#completeSale").onclick=completeSale;$("#clearCart").onclick=()=>{state.cart=[];renderCart()};$("#registerEntry").onclick=registerEntry;$("#inventorySearch").oninput=renderProducts;$("#refreshBtn").onclick=sync;
$("#productForm").onsubmit=e=>{e.preventDefault();registerProduct(Object.fromEntries(new FormData(e.target)))};$("#customerForm").onsubmit=e=>{e.preventDefault();registerCustomer(Object.fromEntries(new FormData(e.target)))};
$("#saveSettings").onclick=()=>{state.apiUrl=$("#apiUrl").value.trim();state.businessName=$("#businessName").value.trim()||"Mi negocio";localStorage.setItem("minipos_api",state.apiUrl);localStorage.setItem("minipos_name",state.businessName);updateConnection();toast("Configuración guardada.");sync()};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBtn").classList.remove("hidden")});$("#installBtn").onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}};
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
loadLocal();renderAll();if(state.apiUrl)sync();
