const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CFG=window.IMPRESA||{};
const money=n=>`C$ ${Math.round(n).toLocaleString('es-NI')}`;

$('#menu')?.addEventListener('click',()=>$('#nav')?.classList.toggle('open')); $$('#nav a').forEach(a=>a.addEventListener('click',()=>$('#nav')?.classList.remove('open')));

/* ---------- Pedido (se guarda en este navegador hasta enviarlo; la web no cobra) ---------- */
const CART_KEY='impresa-pedido';
function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[]}catch{return[]}}
function setCart(c){try{localStorage.setItem(CART_KEY,JSON.stringify(c))}catch{alert('No se pudo guardar el pedido en este navegador. Si subiste una imagen muy grande, prueba con una más liviana.');return false}updateCount();return true}
function updateCount(){const n=getCart().reduce((a,i)=>a+i.qty,0);$$('#cartCount').forEach(e=>e.textContent=n?`(${n})`:'')}
function addItem(item){const c=getCart();c.push(item);return setCart(c)}
updateCount();

/* ---------- Tienda ---------- */
$$('.cart').forEach(b=>b.addEventListener('click',()=>{if(addItem({nombre:b.dataset.name,detalle:b.dataset.detail||'',qty:1,precio:+b.dataset.price}))$('#cartStatus').innerHTML=`Agregado a tu pedido. <a href="pedido.html"><u>Ver mi pedido</u></a>`}));

/* ---------- Diseña tu camisa ---------- */
const techs=['Bordado','DTF','Serigrafía','Sublimación','Vinil']; let complex=false, designFile=null;
function renderTech(){if(!$('#techs'))return; const material=$('#garment').value,box=$('#techs'),prev=$('input[name=tech]:checked')?.value;box.innerHTML='';let notes=[];
  // conserva la técnica elegida si sigue permitida; si no, DTF (nunca se bloquea)
  const allowed=t=>!(complex&&(t==='Vinil'||t==='Bordado'))&&!(t==='Sublimación'&&material!=='Camiseta'),pick=prev&&allowed(prev)?prev:'DTF';
  techs.forEach((t,i)=>{let ok=true,msg='';if(complex&&t==='Vinil'){ok=false;msg='demasiado detalle/degradados para corte de vinil'}if(complex&&t==='Bordado'){ok=false;msg='requiere revisión por complejidad'}if(t==='Sublimación'&&material!=='Camiseta'){ok=false;msg='confirmar composición/material antes de sublimar'}const d=document.createElement('label');d.className='tech'+(ok?'':' disabled');d.innerHTML=`<span>${t}</span><input type="radio" name="tech" value="${t}" ${ok?'':'disabled'} ${t===pick?'checked':''}>`;box.appendChild(d);if(!ok)notes.push(`${t}: ${msg}.`)});$('#reason').textContent=notes.join(' ');calc()}
function totalQty(){return $$('.qty').reduce((a,x)=>a+(+x.value||0),0)}
function estimate(){const q=totalQty(),tech=$('input[name=tech]:checked')?.value||'DTF',base={Bordado:420,DTF:350,Serigrafía:320,Sublimación:360,Vinil:330}[tech],disc=q>=24?.82:q>=12?.9:1;return base*q*disc}
function calc(){if(!$('#price'))return;$('#totalQty').textContent=totalQty();$('#price').textContent=money(estimate())}
$('#config')?.addEventListener('submit',e=>e.preventDefault()); // Enter en un campo no debe recargar y perder el diseño
$$('.qty').forEach(x=>x.addEventListener('input',calc));$('#garment')?.addEventListener('change',renderTech);$('#techs')?.addEventListener('change',calc);
$('#audience')?.addEventListener('change',e=>{const map={Hombre:'Corte hombre',Mujer:'Corte mujer',Niño:'Corte infantil niño',Niña:'Corte infantil niña'};$('#viewNote').textContent=map[e.target.value]+' • arrastra la prenda para verla desde distintos ángulos.'});
$('#color')?.addEventListener('input',e=>{const c=e.target.value;$('#model').style.background=`linear-gradient(90deg,color-mix(in srgb, ${c} 72%, #555),${c} 20%,color-mix(in srgb, ${c} 96%, white) 50%,${c} 80%,color-mix(in srgb, ${c} 72%, #555))`});
$('#file')?.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;complex=f.size>300000;const mark=$('#designMark'),r=new FileReader();r.onload=()=>{designFile={nombre:f.name,data:r.result};mark.textContent='';mark.style.background=`url(${r.result}) center/contain no-repeat`;mark.style.width='145px';mark.style.height='145px';mark.style.border='0'};r.readAsDataURL(f);renderTech()});
$$('.tabs button').forEach(b=>b.addEventListener('click',()=>{$$('.tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');const angles={front:0,back:180,left:-75,right:75};rotY=angles[b.dataset.view]||0;applyRotation()}));
let rotY=0,rotX=0,drag=false,lastX=0,lastY=0;function applyRotation(){if($('#model'))$('#model').style.transform=`rotateX(${rotX}deg) rotateY(${rotY}deg)`}const studio=$('#dragStudio');if(studio){const start=(x,y)=>{drag=true;lastX=x;lastY=y},move=(x,y)=>{if(!drag)return;rotY+=(x-lastX)*.65;rotX=Math.max(-18,Math.min(18,rotX-(y-lastY)*.18));lastX=x;lastY=y;applyRotation()},end=()=>drag=false;studio.addEventListener('pointerdown',e=>{studio.setPointerCapture(e.pointerId);start(e.clientX,e.clientY)});studio.addEventListener('pointermove',e=>move(e.clientX,e.clientY));studio.addEventListener('pointerup',end);studio.addEventListener('pointercancel',end)}
$('#add')?.addEventListener('click',()=>{const q=totalQty();if(q<1){alert('Indica al menos una prenda en la distribución de tallas.');return}
  const tallas=$$('.qty').map(x=>+x.value?`${x.closest('label').firstChild.textContent.trim()}: ${x.value}`:'').filter(Boolean).join(', ');
  const tech=$('input[name=tech]:checked')?.value||'DTF';
  const g=$('#garment').value;
  const ok=addItem({nombre:`${g} ${g==='Polo'?'personalizado':'personalizada'}`,detalle:`${$('#audience').value} • color ${$('#color').value} • ${tech} • tallas ${tallas}${designFile?` • diseño: ${designFile.nombre}`:' • sin diseño subido'}`,qty:q,precio:estimate()/q,diseno:designFile});
  if(ok)location.href='pedido.html'});

/* ---------- Videos del proceso ---------- */
$$('.video').forEach(b=>b.addEventListener('click',()=>{if($('#videoTitle'))$('#videoTitle').textContent=b.dataset.title;$('#videoModal')?.showModal()}));$('#closeModal')?.addEventListener('click',()=>$('#videoModal')?.close());renderTech();

/* ---------- Envío: Supabase (si está configurado) + WhatsApp ---------- */
const sbReady=()=>CFG.supabaseUrl&&CFG.supabaseKey;
// clave sb_publishable_ va solo en apikey; una clave anon antigua (JWT) también en Authorization
const sbHeaders=extra=>({apikey:CFG.supabaseKey,...(CFG.supabaseKey.startsWith('sb_')?{}:{Authorization:`Bearer ${CFG.supabaseKey}`}),...extra});
async function uploadDesign(d){const blob=await (await fetch(d.data)).blob(),ext=(d.nombre.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,''),path=`${crypto.randomUUID()}.${ext}`;
  const r=await fetch(`${CFG.supabaseUrl}/storage/v1/object/disenos/${path}`,{method:'POST',headers:sbHeaders({'Content-Type':blob.type||'application/octet-stream'}),body:blob});
  if(!r.ok)throw new Error('No se pudo subir el diseño');return `${CFG.supabaseUrl}/storage/v1/object/public/disenos/${path}`}
async function saveRecord(row){if(!sbReady())return;const r=await fetch(`${CFG.supabaseUrl}/rest/v1/pedidos`,{method:'POST',headers:sbHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify(row)});if(!r.ok)throw new Error('No se pudo guardar')}
// misma pestaña: window.open después de un await lo bloquean los navegadores del móvil
const openWhatsApp=text=>setTimeout(()=>location.href=`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`,600);
const field=(f,n)=>f.elements[n]?.value.trim()||'';

/* ---------- Página Mi pedido ---------- */
function renderPedido(){const list=$('#pedidoItems');if(!list)return;const c=getCart();list.innerHTML='';
  $('#pedidoVacio').hidden=c.length>0;$('#pedidoForm').hidden=c.length===0;
  c.forEach((it,i)=>{const row=document.createElement('article');row.className='pedidoItem';
    const info=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=`${it.qty} × ${it.nombre}`;p.textContent=it.detalle;info.append(h,p);
    const right=document.createElement('div'),s=document.createElement('strong'),del=document.createElement('button');s.textContent=money(it.precio*it.qty);del.type='button';del.className='btn ghost';del.textContent='Quitar';del.onclick=()=>{const cc=getCart();cc.splice(i,1);setCart(cc);renderPedido()};right.append(s,del);
    row.append(info,right);list.appendChild(row)});
  $('#pedidoTotal').textContent=money(c.reduce((a,i)=>a+i.precio*i.qty,0))}
renderPedido();
$('#pedidoForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,btn=f.querySelector('button[type=submit]'),st=$('#pedidoStatus'),c=getCart();if(!c.length)return;
  btn.disabled=true;st.textContent='Enviando…';
  try{const items=[];for(const it of c){let diseno=null;if(it.diseno&&sbReady())diseno=await uploadDesign(it.diseno);items.push({nombre:it.nombre,detalle:it.detalle,cantidad:it.qty,precio_unitario:Math.round(it.precio),diseno})}
    const total=c.reduce((a,i)=>a+i.precio*i.qty,0),row={tipo:'pedido',nombre:field(f,'nombre'),telefono:field(f,'telefono'),correo:field(f,'correo')||null,entrega:field(f,'entrega'),direccion:field(f,'direccion')||null,notas:field(f,'notas')||null,items,total_estimado:Math.round(total)};
    await saveRecord(row);
    const lines=items.map(i=>`• ${i.cantidad} × ${i.nombre} — ${i.detalle} — ${money(i.precio_unitario*i.cantidad)}${i.diseno?`\n  Diseño: ${i.diseno}`:''}`);
    const sinSubir=c.some(i=>i.diseno)&&!sbReady()?'\n(Te envío el diseño en este chat.)':'';
    openWhatsApp(`Hola IMPRESA, quiero hacer este pedido:\n${lines.join('\n')}\nTotal estimado: ${money(total)}\n\nNombre: ${row.nombre}\nTeléfono: ${row.telefono}${row.correo?`\nCorreo: ${row.correo}`:''}\nEntrega: ${row.entrega}${row.direccion?`\nDirección: ${row.direccion}`:''}${row.notas?`\nNotas: ${row.notas}`:''}${sinSubir}`);
    setCart([]);renderPedido();$('#pedidoVacio').hidden=true;st.textContent='¡Pedido enviado! Te confirmamos precio, pago y entrega por WhatsApp.'}
  catch(err){st.textContent=`${err.message}. Revisa tu conexión e inténtalo de nuevo.`}finally{btn.disabled=false}});
$('#entrega')?.addEventListener('change',e=>{$('#direccionBox').hidden=e.target.value!=='Envío'});

/* ---------- Contacto / cotización ---------- */
$('#contactForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,btn=f.querySelector('button[type=submit]'),st=$('#contactStatus');btn.disabled=true;st.textContent='Enviando…';
  const row={tipo:'contacto',nombre:field(f,'nombre'),telefono:field(f,'telefono'),correo:field(f,'correo')||null,notas:field(f,'mensaje'),items:[]};
  try{await saveRecord(row);openWhatsApp(`Hola IMPRESA, quiero una cotización.\nNombre: ${row.nombre}\nTeléfono: ${row.telefono}${row.correo?`\nCorreo: ${row.correo}`:''}\n\n${row.notas}`);f.reset();st.textContent='¡Mensaje enviado! Te respondemos por WhatsApp.'}
  catch(err){st.textContent=`${err.message}. Revisa tu conexión e inténtalo de nuevo.`}finally{btn.disabled=false}});
