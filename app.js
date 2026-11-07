const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CFG=window.IMPRESA||{};
const money=n=>`C$ ${Math.round(n).toLocaleString('es-NI')}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

$('#menu')?.addEventListener('click',()=>$('#nav')?.classList.toggle('open')); $$('#nav a').forEach(a=>a.addEventListener('click',()=>$('#nav')?.classList.remove('open')));

/* ---------- Vista en grande (diseños, galería) ----------
   verGrande(lista, i): lista = [{src, titulo, sub, oscuro, accion:{texto, href | onclick}}] */
let _vg=null;
function verGrande(lista,i=0){
  if(!_vg){_vg=document.createElement('dialog');_vg.className='vg';_vg.setAttribute('aria-label','Vista en grande');
    _vg.innerHTML='<button type="button" class="vgX" aria-label="Cerrar">×</button><button type="button" class="vgN vgP" aria-label="Anterior">‹</button><figure><div class="vgImg"><img alt=""></div><figcaption><b></b><span></span></figcaption></figure><button type="button" class="vgN vgS" aria-label="Siguiente">›</button><div class="vgAcc"><button type="button" class="btn ghost vgFondo">◐ Cambiar fondo</button><a class="btn vgBtn"></a></div>';
    document.body.appendChild(_vg);
    _vg.querySelector('.vgX').onclick=()=>_vg.close();
    _vg.addEventListener('click',e=>{if(e.target===_vg)_vg.close()});
    _vg.querySelector('.vgFondo').onclick=()=>_vg.classList.toggle('claro');
    _vg.querySelector('.vgP').onclick=()=>_vg._ir(-1);_vg.querySelector('.vgS').onclick=()=>_vg._ir(1);
    _vg.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')_vg._ir(-1);if(e.key==='ArrowRight')_vg._ir(1)});
    let x0=null;_vg.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
    _vg.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)_vg._ir(dx<0?1:-1);x0=null})}
  const pintar=()=>{const it=lista[i],img=_vg.querySelector('img'),a=_vg.querySelector('.vgBtn'),k=i;
    if(typeof it.src==='function'){img.style.opacity=.35;Promise.resolve(it.src()).then(u=>{if(k===i){img.src=u;img.style.opacity=1}})}else{img.src=it.src;img.style.opacity=1}img.alt=it.titulo||'';
    _vg.querySelector('figcaption b').textContent=it.titulo||'';_vg.querySelector('figcaption span').textContent=it.sub||'';
    _vg.classList.toggle('foto',!it.oscuro&&it.oscuro!==undefined);_vg.querySelector('.vgFondo').hidden=it.oscuro===false;
    a.hidden=!it.accion;if(it.accion){a.textContent=it.accion.texto;if(it.accion.href){a.href=it.accion.href;a.onclick=null}else{a.removeAttribute('href');a.onclick=()=>{_vg.close();it.accion.onclick()}}}
    $$('.vgN').forEach(b=>b.hidden=lista.length<2)};
  _vg._ir=d=>{i=(i+d+lista.length)%lista.length;pintar()};
  pintar();if(!_vg.open)_vg.showModal()}

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
document.addEventListener('click',e=>{const b=e.target.closest('.cart');if(!b)return;const t=b.closest('article')?.querySelector('.tallaSel')?.value;
  if(addItem({nombre:b.dataset.name,detalle:(b.dataset.detail||'')+(t?` • talla ${t}`:''),qty:1,precio:+b.dataset.price,vista:b.dataset.foto||undefined}))$('#cartStatus').innerHTML=`Agregado a tu pedido${t?` (talla ${esc(t)})`:''}. <a href="pedido.html"><u>Ver mi pedido</u></a>`});
const TALLAS_TIENDA=['XS','S','M','L','XL','2XL','3XL'];
const productos=sbGet('productos?select=nombre,detalle,precio,foto_url,enlace&activo=eq.true&order=orden,created_at');
// Vista en grande de un producto: las flechas recorren los 17 colores de camiseta con el mismo diseño
async function verColores(p){if(!p.enlace||typeof PRENDAS==='undefined'){verGrande([{src:p.foto_url,titulo:p.nombre,sub:`${p.detalle} · ${money(p.precio)}`,oscuro:false}],0);return}
  const q=new URL(p.enlace,location.href).searchParams,cols=PRENDAS.camiseta.colores,ini=Math.max(0,cols.findIndex(c=>c.nombre===q.get('color')));
  const prep=Promise.all([cargarPrenda('camiseta'),cargarImg(q.get('diseno'))]),cache={};
  const dibujar=async c=>{const [,img]=await prep,t=document.createElement('canvas'),o=document.createElement('canvas');t.width=t.height=o.width=o.height=800;pintarCamisa(t.getContext('2d'),'camiseta','frente',c.hex,'M');
    const x=o.getContext('2d'),g=x.createRadialGradient(400,320,0,400,320,560);g.addColorStop(0,'#a9b4c1');g.addColorStop(.7,'#8692a1');g.addColorStop(1,'#727e8d');x.fillStyle=g;x.fillRect(0,0,800,800);x.drawImage(t,0,0);
    const w=28*8.1,h=w*img.naturalHeight/img.naturalWidth;x.drawImage(img,400-w/2,148,w,h);return o.toDataURL('image/jpeg',.9)}; // mismo tamaño y lugar que las fotos de la tienda
  verGrande(cols.map(c=>{q.set('color',c.nombre);return {src:()=>cache[c.nombre]??=dibujar(c),titulo:p.nombre,sub:`Camiseta ${c.nombre.toLowerCase()} · DTF · ${money(p.precio)} · ‹ › otros colores`,oscuro:false,accion:{texto:'Pedir en este color',href:'disena.html?'+q.toString()}}}),ini)}
const aGrande=rows=>rows.map(p=>({src:p.foto_url,titulo:p.nombre,sub:`${p.detalle} · ${money(p.precio)}`,oscuro:false,accion:p.enlace?{texto:'Cambiar color o diseño',href:p.enlace}:{texto:'Ver en la tienda',href:'tienda.html'}}));
(async()=>{const box=$('.realProducts');if(!box)return;const rows=await productos;if(!rows?.length){box.innerHTML='<p class="status">Pronto agregaremos productos. Mientras tanto, <a href="disena.html"><u>diseña tu camisa</u></a>.</p>';return}
  box.innerHTML=rows.map((p,i)=>`<article><button type="button" class="zoom" data-i="${i}" aria-label="Ver ${esc(p.nombre)} en grande"><img src="${esc(p.foto_url)}" alt="${esc(p.nombre)}" loading="lazy"></button><h3>${esc(p.nombre)}</h3><p>${esc(p.detalle)}</p><strong>${money(p.precio)}</strong>
    <label class="tallaLbl">Talla <select class="tallaSel">${TALLAS_TIENDA.map(t=>`<option${t==='M'?' selected':''}>${t}</option>`).join('')}</select></label>
    <button class="btn cart" data-name="${esc(p.nombre)}" data-detail="${esc(p.detalle)}" data-price="${+p.precio}" data-foto="${esc(p.foto_url)}">Agregar al carrito</button>${p.enlace?`<a class="btn ghost cambiar" href="${esc(p.enlace)}">Cambiar color o diseño</a>`:''}</article>`).join('');
  box.addEventListener('click',e=>{const z=e.target.closest('.zoom');if(z)verColores(rows[+z.dataset.i])})})();
/* ---------- Carrusel de la tienda en el Inicio ---------- */
(async()=>{const box=$('#carrusel');if(!box)return;const rows=await productos;if(!rows?.length){box.closest('section').hidden=true;return}
  const pista=box.querySelector('.pista');pista.innerHTML=rows.map((p,i)=>`<article class="slide"><button type="button" class="zoom" data-i="${i}" aria-label="Ver ${esc(p.nombre)} en grande"><img src="${esc(p.foto_url)}" alt="${esc(p.nombre)}" loading="lazy"></button><b>${esc(p.nombre)}</b><span>${esc(p.detalle.split(' • ')[0])}</span><strong>${money(p.precio)}</strong></article>`).join('');
  pista.addEventListener('click',e=>{const z=e.target.closest('.zoom');if(z)verColores(rows[+z.dataset.i])});
  const paso=()=>pista.querySelector('.slide').getBoundingClientRect().width+16;
  const mover=d=>{const fin=pista.scrollLeft+d*paso();pista.scrollTo({left:fin>pista.scrollWidth-pista.clientWidth+5?0:fin<-5?pista.scrollWidth:fin,behavior:'smooth'})};
  box.querySelector('.cPrev').onclick=()=>mover(-1);box.querySelector('.cSig').onclick=()=>mover(1);
  // avanza solo cada 4 s; se detiene mientras el cliente lo toca o pasa el mouse
  let quieto=false;['pointerenter','focusin','touchstart'].forEach(ev=>box.addEventListener(ev,()=>quieto=true,{passive:true}));['pointerleave','focusout'].forEach(ev=>box.addEventListener(ev,()=>quieto=false));
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{if(!quieto&&!document.hidden)mover(1)},4000)})();

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
  try{const items=[];for(const it of c){const links=[];if(sbReady()){for(const a of archivosDe(it))links.push(`${a.lado?a.lado+': ':''}${a.codigo?`diseño de catálogo ${a.codigo}`:a.url||await uploadFile(a)}`);if(it.vista)links.push(`Vista: ${it.vista.startsWith('data:')?await uploadFile({nombre:'vista.jpg',data:it.vista}):new URL(it.vista,location.href).href}`)}
      items.push({nombre:it.nombre,detalle:it.detalle,cantidad:it.qty,precio_unitario:Math.round(it.precio),archivos:links})}
    const total=c.reduce((a,i)=>a+i.precio*i.qty,0),row={tipo:'pedido',nombre:field(f,'nombre'),telefono:field(f,'telefono'),correo:field(f,'correo')||null,entrega:field(f,'entrega'),direccion:field(f,'direccion')||null,notas:field(f,'notas')||null,items,total_estimado:Math.round(total)};
    await saveRecord(row);
    const lines=items.map(i=>`• ${i.cantidad} × ${i.nombre} — ${i.detalle} — ${money(i.precio_unitario*i.cantidad)}${i.archivos.map(l=>`\n  ${l}`).join('')}`);
    const sinSubir=c.some(i=>archivosDe(i).some(a=>a.data))&&!sbReady()?'\n(Te envío el diseño en este chat.)':'';
    openWhatsApp(`Hola IMPRESA, quiero hacer este pedido:\n${lines.join('\n')}\nTotal estimado: ${money(total)}\n\nNombre: ${row.nombre}\nTeléfono: ${row.telefono}${row.correo?`\nCorreo: ${row.correo}`:''}\nEntrega: ${row.entrega}${row.direccion?`\nDirección: ${row.direccion}`:''}${row.notas?`\nNotas: ${row.notas}`:''}${sinSubir}`);
    setCart([]);renderPedido();$('#pedidoVacio').hidden=true;st.textContent='¡Pedido enviado! Te confirmamos precio y entrega por WhatsApp.'}
  catch(err){st.textContent=`${err.message}. Revisa tu conexión e inténtalo de nuevo.`}finally{btn.disabled=false}});

/* ---------- Contacto / cotización ---------- */
$('#contactForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,btn=f.querySelector('button[type=submit]'),st=$('#contactStatus');btn.disabled=true;st.textContent='Enviando…';
  const row={tipo:'contacto',nombre:field(f,'nombre'),telefono:field(f,'telefono'),correo:field(f,'correo')||null,notas:field(f,'mensaje'),items:[]};
  try{await saveRecord(row);openWhatsApp(`Hola IMPRESA, quiero una cotización.\nNombre: ${row.nombre}\nTeléfono: ${row.telefono}${row.correo?`\nCorreo: ${row.correo}`:''}\n\n${row.notas}`);f.reset();st.textContent='¡Mensaje enviado! Te respondemos por WhatsApp.'}
  catch(err){st.textContent=`${err.message}. Revisa tu conexión e inténtalo de nuevo.`}finally{btn.disabled=false}});
