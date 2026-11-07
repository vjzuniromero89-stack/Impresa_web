const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CFG=window.IMPRESA||{};
const money=n=>`C$ ${Math.round(n).toLocaleString('es-NI')}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

$('#menu')?.addEventListener('click',()=>$('#nav')?.classList.toggle('open')); $$('#nav a').forEach(a=>a.addEventListener('click',()=>$('#nav')?.classList.remove('open')));

/* ---------- Supabase (REST, sin librería) ---------- */
const sbReady=()=>CFG.supabaseUrl&&CFG.supabaseKey;
// clave sb_publishable_ va solo en apikey; una clave anon antigua (JWT) también en Authorization
const sbHeaders=extra=>({apikey:CFG.supabaseKey,...(CFG.supabaseKey.startsWith('sb_')?{}:{Authorization:`Bearer ${CFG.supabaseKey}`}),...extra});
async function sbGet(path){if(!sbReady())return null;try{const r=await fetch(`${CFG.supabaseUrl}/rest/v1/${path}`,{headers:sbHeaders()});return r.ok?await r.json():null}catch{return null}}

/* ---------- Pedido (se guarda en este navegador hasta enviarlo; la web no cobra) ---------- */
const CART_KEY='impresa-pedido';
function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[]}catch{return[]}}
function setCart(c){try{localStorage.setItem(CART_KEY,JSON.stringify(c))}catch{alert('No se pudo guardar el pedido en este navegador. Si subiste una imagen muy grande, prueba con una más liviana.');return false}updateCount();return true}
function updateCount(){const n=getCart().reduce((a,i)=>a+i.qty,0);$$('#cartCount').forEach(e=>e.textContent=n?`(${n})`:'')}
function addItem(item){const c=getCart();c.push(item);return setCart(c)}
updateCount();

/* ---------- Tienda (productos desde Supabase; si falla, quedan los del HTML) ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('.cart');if(!b)return;if(addItem({nombre:b.dataset.name,detalle:b.dataset.detail||'',qty:1,precio:+b.dataset.price}))$('#cartStatus').innerHTML=`Agregado a tu pedido. <a href="pedido.html"><u>Ver mi pedido</u></a>`});
(async()=>{const box=$('.realProducts');if(!box)return;const rows=await sbGet('productos?select=nombre,detalle,precio,foto_url&activo=eq.true&order=orden,created_at');if(!rows?.length)return;
  box.innerHTML=rows.map(p=>`<article><img src="${esc(p.foto_url)}" alt="${esc(p.nombre)}" loading="lazy"><h3>${esc(p.nombre)}</h3><p>${esc(p.detalle)}</p><strong>${money(p.precio)}</strong><button class="btn cart" data-name="${esc(p.nombre)}" data-detail="${esc(p.detalle)}" data-price="${+p.precio}">Agregar al carrito</button></article>`).join('')})();

/* ---------- Videos del proceso (portada y Nosotros) ---------- */
function youtubeId(u){const m=String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([\w-]{11})/);return m?.[1]}
function playVideo(title,url){const box=$('.videoBox');$('#videoTitle').textContent=title;const note=$('#videoNote');
  if(url&&youtubeId(url)){box.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(url)}?autoplay=1&rel=0" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;if(note)note.hidden=true}
  else if(url){box.innerHTML='';const v=document.createElement('video');v.src=url;v.controls=true;v.autoplay=true;v.playsInline=true;box.appendChild(v);if(note)note.hidden=true}
  else{box.textContent='▶';if(note)note.hidden=false}
  $('#videoModal').showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('.video');if(b&&$('#videoModal'))playVideo(b.dataset.title,b.dataset.video)});
$('#closeModal')?.addEventListener('click',()=>$('#videoModal').close());
$('#videoModal')?.addEventListener('close',()=>{$('.videoBox').textContent='▶'}); // detiene el video al cerrar
(async()=>{const vids=$('.vids'),proc=$('#proceso.process');if(!vids&&!proc)return;const rows=await sbGet('videos?select=titulo,portada_url,video_url&activo=eq.true&order=orden,created_at');if(!rows?.length)return;
  if(vids)vids.innerHTML=rows.slice(0,4).map(v=>`<button class="vid video" data-title="${esc(v.titulo)}" data-video="${esc(v.video_url||'')}"><img src="${esc(v.portada_url)}" alt="" loading="lazy"><span>${esc(v.titulo)}</span></button>`).join('');
  if(proc){proc.querySelectorAll('.video').forEach(b=>b.remove());proc.insertAdjacentHTML('beforeend',rows.map(v=>`<button class="video" data-title="${esc(v.titulo)}" data-video="${esc(v.video_url||'')}">▶ ${esc(v.titulo)}</button>`).join(''))}})();

/* ---------- Envío: Supabase (si está configurado) + WhatsApp ---------- */
async function uploadFile(d){const blob=await (await fetch(d.data)).blob(),ext=(d.nombre.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,''),path=`${crypto.randomUUID()}.${ext}`;
  const r=await fetch(`${CFG.supabaseUrl}/storage/v1/object/disenos/${path}`,{method:'POST',headers:sbHeaders({'Content-Type':blob.type||'application/octet-stream'}),body:blob});
  if(!r.ok)throw new Error('No se pudo subir el diseño');return `${CFG.supabaseUrl}/storage/v1/object/public/disenos/${path}`}
async function saveRecord(row){if(!sbReady())return;const r=await fetch(`${CFG.supabaseUrl}/rest/v1/pedidos`,{method:'POST',headers:sbHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify(row)});if(!r.ok)throw new Error('No se pudo guardar')}
// misma pestaña: window.open después de un await lo bloquean los navegadores del móvil
const openWhatsApp=text=>setTimeout(()=>location.href=`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`,600);
const field=(f,n)=>f.elements[n]?.value.trim()||'';
const archivosDe=it=>it.archivos||(it.diseno?[it.diseno]:[]); // pedidos guardados antes del diseñador nuevo

/* ---------- Página Mi pedido ---------- */
function renderPedido(){const list=$('#pedidoItems');if(!list)return;const c=getCart();list.innerHTML='';
  $('#pedidoVacio').hidden=c.length>0;$('#pedidoForm').hidden=c.length===0;
  c.forEach((it,i)=>{const row=document.createElement('article');row.className='pedidoItem';
    if(it.vista){const img=document.createElement('img');img.src=it.vista;img.alt='Vista de tu camisa';img.className='pedidoVista';row.appendChild(img)}
    const info=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=`${it.qty} × ${it.nombre}`;p.textContent=it.detalle;info.append(h,p);
    const right=document.createElement('div'),s=document.createElement('strong'),del=document.createElement('button');s.textContent=money(it.precio*it.qty);del.type='button';del.className='btn ghost';del.textContent='Quitar';del.onclick=()=>{const cc=getCart();cc.splice(i,1);setCart(cc);renderPedido()};right.append(s,del);
    row.append(info,right);list.appendChild(row)});
  $('#pedidoTotal').textContent=money(c.reduce((a,i)=>a+i.precio*i.qty,0))}
renderPedido();

// Opciones de entrega: puntos activos de Supabase + envío a domicilio
const PUNTO_KEY='impresa-punto';
(async()=>{const sel=$('#entrega');if(!sel)return;const pts=await sbGet('puntos_entrega?select=id,nombre,direccion,horario&activo=eq.true&order=orden,created_at')||[];
  const opts=pts.map(p=>({v:`Punto de entrega: ${p.nombre} (${p.horario})`,t:`${p.nombre} — ${p.horario}`,id:p.id}));
  if(!opts.length)opts.push({v:'Retiro en IMPRESA',t:'Retiro en IMPRESA'});
  opts.push({v:'Envío a domicilio',t:'Envío a domicilio'});
  sel.innerHTML=opts.map(o=>`<option value="${esc(o.v)}" data-id="${o.id||''}">${esc(o.t)}</option>`).join('');
  let saved=null;try{saved=localStorage.getItem(PUNTO_KEY)}catch{}
  const pre=[...sel.options].find(o=>saved&&o.dataset.id===saved);if(pre)sel.value=pre.value;
  sel.dispatchEvent(new Event('change'))})();
$('#entrega')?.addEventListener('change',e=>{$('#direccionBox').hidden=e.target.value!=='Envío a domicilio';$('#direccionBox input').required=e.target.value==='Envío a domicilio'});

$('#pedidoForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,btn=f.querySelector('button[type=submit]'),st=$('#pedidoStatus'),c=getCart();if(!c.length)return;
  btn.disabled=true;st.textContent='Enviando…';
  try{const items=[];for(const it of c){const links=[];if(sbReady()){for(const a of archivosDe(it))links.push(`${a.lado?a.lado+': ':''}${await uploadFile(a)}`);if(it.vista)links.push(`Vista: ${await uploadFile({nombre:'vista.jpg',data:it.vista})}`)}
      items.push({nombre:it.nombre,detalle:it.detalle,cantidad:it.qty,precio_unitario:Math.round(it.precio),archivos:links})}
    const total=c.reduce((a,i)=>a+i.precio*i.qty,0),row={tipo:'pedido',nombre:field(f,'nombre'),telefono:field(f,'telefono'),correo:field(f,'correo')||null,entrega:field(f,'entrega'),direccion:field(f,'direccion')||null,notas:field(f,'notas')||null,items,total_estimado:Math.round(total)};
    await saveRecord(row);
    const lines=items.map(i=>`• ${i.cantidad} × ${i.nombre} — ${i.detalle} — ${money(i.precio_unitario*i.cantidad)}${i.archivos.map(l=>`\n  ${l}`).join('')}`);
    const sinSubir=c.some(i=>archivosDe(i).length)&&!sbReady()?'\n(Te envío el diseño en este chat.)':'';
    openWhatsApp(`Hola IMPRESA, quiero hacer este pedido:\n${lines.join('\n')}\nTotal estimado: ${money(total)}\n\nNombre: ${row.nombre}\nTeléfono: ${row.telefono}${row.correo?`\nCorreo: ${row.correo}`:''}\nEntrega: ${row.entrega}${row.direccion?`\nDirección: ${row.direccion}`:''}${row.notas?`\nNotas: ${row.notas}`:''}${sinSubir}`);
    setCart([]);renderPedido();$('#pedidoVacio').hidden=true;st.textContent='¡Pedido enviado! Te confirmamos precio y entrega por WhatsApp.'}
  catch(err){st.textContent=`${err.message}. Revisa tu conexión e inténtalo de nuevo.`}finally{btn.disabled=false}});

/* ---------- Contacto / cotización ---------- */
$('#contactForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,btn=f.querySelector('button[type=submit]'),st=$('#contactStatus');btn.disabled=true;st.textContent='Enviando…';
  const row={tipo:'contacto',nombre:field(f,'nombre'),telefono:field(f,'telefono'),correo:field(f,'correo')||null,notas:field(f,'mensaje'),items:[]};
  try{await saveRecord(row);openWhatsApp(`Hola IMPRESA, quiero una cotización.\nNombre: ${row.nombre}\nTeléfono: ${row.telefono}${row.correo?`\nCorreo: ${row.correo}`:''}\n\n${row.notas}`);f.reset();st.textContent='¡Mensaje enviado! Te respondemos por WhatsApp.'}
  catch(err){st.textContent=`${err.message}. Revisa tu conexión e inténtalo de nuevo.`}finally{btn.disabled=false}});
