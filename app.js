const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CFG=window.IMPRESA||{};
const money=n=>`C$ ${Math.round(n).toLocaleString('es-NI')}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

$('#menu')?.addEventListener('click',()=>$('#nav')?.classList.toggle('open')); $$('#nav a').forEach(a=>a.addEventListener('click',()=>$('#nav')?.classList.remove('open')));

/* ---------- Vista en grande (diseños, galería) ----------
   verGrande(lista, i): lista = [{src, titulo, sub, oscuro, diseno, accion:{texto, href | onclick}}]
   diseno: imagen del diseño solo; muestra el botón «Ver diseño» / «Ver camisa» */
let _vg=null;
function verGrande(lista,i=0){
  if(!_vg){_vg=document.createElement('dialog');_vg.className='vg';_vg.setAttribute('aria-label','Vista en grande');
    _vg.innerHTML='<button type="button" class="vgX" aria-label="Cerrar">×</button><button type="button" class="vgN vgP" aria-label="Anterior">‹</button><figure><div class="vgImg"><img alt=""></div><figcaption><b></b><span></span></figcaption></figure><button type="button" class="vgN vgS" aria-label="Siguiente">›</button><div class="vgAcc"><button type="button" class="btn ghost vgDis" hidden>Ver diseño</button><button type="button" class="btn ghost vgFondo">◐ Cambiar fondo</button><a class="btn vgBtn"></a></div>';
    document.body.appendChild(_vg);
    _vg.querySelector('.vgX').onclick=()=>_vg.close();
    _vg.addEventListener('click',e=>{if(e.target===_vg)_vg.close()});
    _vg.querySelector('.vgFondo').onclick=()=>_vg.classList.toggle('claro');
    _vg.querySelector('.vgDis').onclick=()=>{_vg._dis=!_vg._dis;_vg._pintar()};
    _vg.querySelector('.vgP').onclick=()=>_vg._ir(-1);_vg.querySelector('.vgS').onclick=()=>_vg._ir(1);
    _vg.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')_vg._ir(-1);if(e.key==='ArrowRight')_vg._ir(1)});
    let x0=null;_vg.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
    _vg.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)_vg._ir(dx<0?1:-1);x0=null})}
  const pintar=()=>{const it=lista[i],img=_vg.querySelector('img'),a=_vg.querySelector('.vgBtn'),k=i,dis=_vg._dis&&it.diseno;
    _vg.classList.toggle('verDis',!!dis);const bd=_vg.querySelector('.vgDis');bd.hidden=!it.diseno;bd.textContent=dis?'Ver camisa':'🔍 Ver diseño';
    if(dis){if(typeof it.diseno==='function'){img.style.opacity=.35;Promise.resolve(it.diseno()).then(u=>{if(k===i&&_vg._dis){img.src=u;img.style.opacity=1}})}else{img.src=it.diseno;img.style.opacity=1}}
    else if(typeof it.src==='function'){img.style.opacity=.35;Promise.resolve(it.src()).then(u=>{if(k===i&&!(_vg._dis&&lista[i].diseno)){img.src=u;img.style.opacity=1}})}else{img.src=it.src;img.style.opacity=1}img.alt=it.titulo||'';
    _vg.querySelector('figcaption b').textContent=it.titulo||'';_vg.querySelector('figcaption span').textContent=it.sub||'';
    _vg.classList.toggle('foto',!dis&&!it.oscuro&&it.oscuro!==undefined);_vg.querySelector('.vgFondo').hidden=!!dis||it.oscuro===false;
    a.hidden=!it.accion;if(it.accion){a.textContent=it.accion.texto;if(it.accion.href){a.href=it.accion.href;a.onclick=null}else{a.removeAttribute('href');a.onclick=()=>{_vg.close();it.accion.onclick()}}}
    $$('.vgN').forEach(b=>b.hidden=lista.length<2||!!dis);
    // viendo solo el diseño: sin botones de camisa ni de pedido (se cierra con la ×)
    if(dis){bd.hidden=true;a.hidden=true;_vg.querySelector('figcaption span').textContent=''}};
  _vg._ir=d=>{i=(i+d+lista.length)%lista.length;pintar()};_vg._pintar=pintar;
  if(!_vg.open)_vg._dis=false;pintar();if(!_vg.open)_vg.showModal()}

/* Diseño con marca de agua «IMPRESA» en diagonal (para mostrarlo en grande sin que lo copien limpio) */
const _marca={};
function conMarca(src){return _marca[src]??=(async()=>{const img=await cargarImg(src),S=1000,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  x.fillStyle='#151515';x.fillRect(0,0,S,S);const k=Math.min(S*.88/img.naturalWidth,S*.88/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;x.drawImage(img,(S-w)/2,(S-h)/2,w,h);
  x.save();x.translate(S/2,S/2);x.rotate(-Math.PI/6);x.font='900 54px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(255,255,255,.16)';x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;
  for(let yy=-S;yy<=S;yy+=120)for(let xx=-S*1.2+(yy/120%2?150:0);xx<=S*1.2;xx+=300){x.strokeText('IMPRESA',xx,yy);x.fillText('IMPRESA',xx,yy)}
  x.restore();x.font='700 22px Arial, sans-serif';x.fillStyle='rgba(255,255,255,.55)';x.textAlign='right';x.fillText('© IMPRESA · Nicaragua',S-24,S-24);return c.toDataURL('image/jpeg',.9)})()}

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

/* ---------- Tienda: cada diseño activo del administrador (pestaña Diseños) es un producto ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('.cart');if(!b)return;const t=b.closest('article')?.querySelector('.tallaSel')?.value;
  if(addItem({nombre:b.dataset.name,detalle:(b.dataset.detail||'')+(t?` • talla ${t}`:''),qty:1,precio:+b.dataset.price,vista:b.dataset.foto||undefined}))$('#cartStatus').innerHTML=`Agregado a tu pedido${t?` (talla ${esc(t)})`:''}. <a href="pedido.html"><u>Ver mi pedido</u></a>`});
const TALLAS_TIENDA=['XS','S','M','L','XL','2XL','3XL'];
const disenosTienda=sbGet('disenos?select=codigo,nombre,categoria,preview_url,precio,color,en_tienda,taza,precio_taza,formato_taza&activo=eq.true&or=(en_tienda.eq.true,taza.eq.true)&order=orden,created_at'); // interruptores «En la tienda» y «Taza en la tienda» del panel
const precioDe=d=>d.precio!=null&&d.precio!==''?+d.precio:(CFG.precios?.tienda??500);
const colorTienda=d=>(typeof PRENDAS!=='undefined'&&PRENDAS.camiseta.colores.find(c=>c.nombre===d.color))||{nombre:'Negro',hex:'#151515'};
const enlaceDe=(d,color)=>`disena.html?prenda=camiseta&color=${encodeURIComponent(color)}&lado=frente&diseno=${encodeURIComponent(d.preview_url)}&dn=${encodeURIComponent(d.codigo)}`;
const detalleDe=(d,c)=>`Camiseta color ${c.nombre.toLowerCase()} • DTF • diseño ${d.codigo}`;
// Foto del producto: camiseta Klasiko teñida + el diseño, dibujada en el navegador (todas con el mismo tamaño y lugar)
const _mk={};let _camiseta=null;
function mockup(d,c){return _mk[d.codigo+'|'+c.nombre]??=(async()=>{_camiseta??=cargarPrenda('camiseta');await _camiseta;const img=await cargarImg(d.preview_url);
  const t=document.createElement('canvas'),o=document.createElement('canvas');t.width=t.height=o.width=o.height=800;pintarCamisa(t.getContext('2d'),'camiseta','frente',c.hex,'M');
  const x=o.getContext('2d'),g=x.createRadialGradient(400,320,0,400,320,560);g.addColorStop(0,'#a9b4c1');g.addColorStop(.7,'#8692a1');g.addColorStop(1,'#727e8d');x.fillStyle=g;x.fillRect(0,0,800,800);x.drawImage(t,0,0);
  const k=Math.min(31*8.1/img.naturalWidth,330/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;x.drawImage(img,400-w/2,140,w,h); // máx. 31 cm de ancho, sin pasar del pecho
  return o.toDataURL('image/jpeg',.88)})()}
// Vista en grande: las flechas recorren los 17 colores de camiseta con el mismo diseño
function verColores(d){const cols=PRENDAS.camiseta.colores,ini=Math.max(0,cols.findIndex(c=>c.nombre===colorTienda(d).nombre));
  verGrande(cols.map(c=>({src:()=>mockup(d,c),titulo:`${d.codigo} · ${d.nombre}`,sub:`Camiseta color ${c.nombre.toLowerCase()} · DTF · ${money(precioDe(d))} · ‹ › otros colores`,oscuro:false,diseno:()=>conMarca(d.preview_url),accion:{texto:'Pedir en este color',href:enlaceDe(d,c.nombre)}})),ini)}
// Taza blanca 11 oz dibujada en el navegador (8.2 × 9.5 cm); el diseño se curva como sobre un cilindro
const precioTaza=d=>d?.precio_taza!=null&&Number.isFinite(+d.precio_taza)?+d.precio_taza:(CFG.precios?.taza??200);
// Los diseños panorámicos se detectan aunque un registro antiguo no tenga formato.
function esEnvolventeTaza(img,d){return d.formato_taza==='envolvente'||img.naturalWidth/img.naturalHeight>1.6}
function plantillaTaza(img,d){
  const c=document.createElement('canvas');c.width=2480;c.height=1122;const x=c.getContext('2d');
  x.fillStyle='#ffffff';x.fillRect(0,0,c.width,c.height);
  if(esEnvolventeTaza(img,d)){
    // Cubrir sin estirar: solo se recorta el mínimo sobrante de proporción.
    const k=Math.max(c.width/img.naturalWidth,c.height/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;
    x.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h);
  }else{
    // Motivos grandes, hasta el borde superior e inferior, a ambos lados.
    const k=Math.min(1190/img.naturalWidth,1102/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;
    for(const center of [620,1860])x.drawImage(img,center-w/2,(c.height-h)/2,w,h);
  }
  return c;
}
const _mt={};
function mockupTaza(d,opciones={}){const key=[d.codigo,d.preview_url,d.formato_taza,opciones.offset||0].join('|');return _mt[key]??=(async()=>{const img=d.preview_url?await cargarImg(d.preview_url):null,o=document.createElement('canvas');o.width=o.height=800;const x=o.getContext('2d');
  const g=x.createRadialGradient(400,320,0,400,320,560);g.addColorStop(0,'#a9b4c1');g.addColorStop(.7,'#8692a1');g.addColorStop(1,'#727e8d');x.fillStyle=g;x.fillRect(0,0,800,800);
  const L=215,R=545,T=215,B=615,cx=(L+R)/2,rx=(R-L)/2,ry=26,px=(B-T)/9.5,Rcm=4.1;
  x.save();x.filter='blur(14px)';x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(cx+35,B+10,rx+70,ry+8,0,0,7);x.fill();x.restore();
  x.lineCap='round';x.strokeStyle='#c3cbd3';x.lineWidth=40;x.beginPath();x.ellipse(R-6,415,94,114,0,-Math.PI/2+.22,Math.PI/2-.22);x.stroke();
  x.strokeStyle='#eef1f4';x.lineWidth=16;x.beginPath();x.ellipse(R-12,410,94,110,0,-Math.PI/2+.45,Math.PI/2-.6);x.stroke();
  const cuerpo=()=>{x.beginPath();x.moveTo(L,T);x.lineTo(L,B);x.ellipse(cx,B,rx,ry,0,Math.PI,0,true);x.lineTo(R,T);x.ellipse(cx,T,rx,ry,0,0,Math.PI);x.closePath()};
  const lg=x.createLinearGradient(L,0,R,0);[[0,'#98a1ab'],[.12,'#d9dee3'],[.3,'#ffffff'],[.45,'#fbfcfd'],[.75,'#e3e7eb'],[.92,'#bac2ca'],[1,'#96a0aa']].forEach(([p,c])=>lg.addColorStop(p,c));
  cuerpo();x.fillStyle=lg;x.fill();
  // La misma plantilla completa se usa en la vista y en el archivo del pedido.
  const D=document.createElement('canvas');D.width=D.height=800;const y=D.getContext('2d');
  if(img){const wrap=plantillaTaza(img,d);
    const viewCenter=esEnvolventeTaza(img,d)?10.5:5.25;
    for(let X=L;X<R;X++){const u=(X+.5-cx)/rx,th=Math.asin(Math.max(-1,Math.min(1,u))),cm=th*Rcm+viewCenter+(opciones.offset||0),pos=((cm%21)+21)%21;
      y.drawImage(wrap,pos/21*2480,0,Math.max(1,Rcm/(rx*Math.max(.05,Math.cos(th)))*2480/21),1122,X,T+6+ry*(Math.cos(th)-1)*.9,1,B-T-10)}
  }
  y.globalCompositeOperation='source-atop';const sg=y.createLinearGradient(L,0,R,0);[[0,'rgba(0,0,0,.5)'],[.12,'rgba(0,0,0,.16)'],[.27,'rgba(255,255,255,.18)'],[.33,'rgba(255,255,255,.18)'],[.45,'rgba(0,0,0,0)'],[.75,'rgba(0,0,0,.08)'],[.92,'rgba(0,0,0,.28)'],[1,'rgba(0,0,0,.5)']].forEach(([p,c])=>sg.addColorStop(p,c));
  y.fillStyle=sg;y.fillRect(0,0,800,800);x.save();cuerpo();x.clip();x.drawImage(D,0,0);x.restore();
  x.fillStyle='#eef1f4';x.beginPath();x.ellipse(cx,T,rx,ry,0,0,7);x.fill();
  const ig=x.createLinearGradient(0,T-ry,0,T+ry);ig.addColorStop(0,'#8c96a1');ig.addColorStop(1,'#dce1e6');x.fillStyle=ig;x.beginPath();x.ellipse(cx,T+1,rx-11,ry-4,0,0,7);x.fill();
  x.strokeStyle='rgba(0,0,0,.12)';x.lineWidth=1.5;cuerpo();x.stroke();
  return o.toDataURL('image/jpeg',.88)})()}
// cada diseño da hasta 2 productos: camiseta («En la tienda») y taza («Taza en la tienda»)
const productosTienda=disenosTienda.then(rows=>(rows||[]).flatMap(d=>[d.en_tienda&&{d,tipo:'camiseta'},d.taza&&{d,tipo:'taza'}].filter(Boolean)));
const fotoDe=p=>p.tipo==='taza'?mockupTaza(p.d):mockup(p.d,colorTienda(p.d));
const verProducto=p=>p.tipo==='taza'?verGrande([{src:()=>mockupTaza(p.d),titulo:`${p.d.codigo} · ${p.d.nombre}`,sub:`Taza blanca 11 oz · ${money(precioTaza(p.d))}`,oscuro:false,diseno:()=>conMarca(p.d.preview_url),accion:{texto:'Personalizar esta taza',href:'taza.html?dn='+encodeURIComponent(p.d.codigo)}}]):verColores(p.d);
// las fotos se dibujan cuando la tarjeta se acerca a la pantalla
// respaldo: si el navegador no avisa (pestaña en segundo plano), se dibuja igual en unos segundos
function pintarCuando(img,p,i=0){let hecho=false;const ir=()=>{if(hecho)return;hecho=true;io.disconnect();
  fotoDe(p).then(u=>{img.src=u;img.classList.add('lista');const b=img.closest('article')?.querySelector('.cart');if(b)b.dataset.foto=u}).catch(()=>{img.alt=`${p.d.nombre} (no se pudo cargar la foto)`})};
  const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))ir()},{rootMargin:'400px'});io.observe(img);setTimeout(ir,2500+i*150)}
const VACIO='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
(async()=>{const box=$('.realProducts');if(!box)return;const rows=await productosTienda;if(!rows.length){box.innerHTML='<p class="status">Pronto agregaremos productos. Mientras tanto, <a href="disena.html"><u>diseña tu camisa</u></a>.</p>';return}
  box.innerHTML=rows.map((p,i)=>{const d=p.d,c=colorTienda(d),taza=p.tipo==='taza',det=taza?`Taza blanca 11 oz • diseño ${d.codigo}`:detalleDe(d,c),precio=taza?precioTaza(d):precioDe(d);
    return `<article data-tipo="${p.tipo}" data-cat="${esc(d.categoria||'')}"><button type="button" class="zoom" data-i="${i}" aria-label="Ver ${esc(d.nombre)} en grande"><img class="mk" src="${VACIO}" alt="${esc(d.nombre)}"></button><h3>${esc(d.nombre)}</h3><p>${esc(det)}</p><strong>${money(precio)}</strong>
    ${taza?'':`<label class="tallaLbl">Talla <select class="tallaSel">${TALLAS_TIENDA.map(t=>`<option${t==='M'?' selected':''}>${t}</option>`).join('')}</select></label>`}
    <button class="btn cart" data-name="${esc(taza?`Taza ${d.nombre}`:d.nombre)}" data-detail="${esc(det)}" data-price="${precio}">Agregar al carrito</button>${taza?`<a class="btn ghost cambiar" href="taza.html?dn=${encodeURIComponent(d.codigo)}">Cambiar diseño de taza</a>`:`<a class="btn ghost cambiar" href="${esc(enlaceDe(d,c.nombre))}">Cambiar color o diseño</a>`}</article>`}).join('');
  box.querySelectorAll('img.mk').forEach((img,i)=>pintarCuando(img,rows[i],i));
  box.addEventListener('click',e=>{const z=e.target.closest('.zoom');if(z)verProducto(rows[+z.dataset.i])});
  // filtros: Todo, Camisetas, Tazas y cada categoría (Navidad, Purísima… salen solas al agregar diseños con esa categoría)
  const cats=[...new Set(rows.map(p=>p.d.categoria).filter(Boolean))],f=document.createElement('div');f.className='filtros';f.setAttribute('role','group');f.setAttribute('aria-label','Filtrar productos');
  f.innerHTML=[['','Todo'],['tipo:camiseta','Camisetas'],['tipo:taza','Tazas'],...cats.map(c=>['cat:'+c,c])].map(([v,t],j)=>`<button type="button" data-f="${esc(v)}" aria-pressed="${!j}">${esc(t)}</button>`).join('');box.before(f);
  f.onclick=e=>{const b=e.target.closest('button');if(!b)return;f.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));const [k,v]=b.dataset.f.split(/:(.*)/);box.querySelectorAll('article').forEach(a=>a.hidden=!!k&&a.dataset[k]!==v)}})();
/* ---------- Carrusel de la tienda en el Inicio ---------- */
(async()=>{const box=$('#carrusel');if(!box)return;const rows=await productosTienda;if(!rows.length){box.closest('section').hidden=true;return}
  const pista=box.querySelector('.pista');pista.innerHTML=rows.map(({d,tipo},i)=>`<article class="slide"><button type="button" class="zoom" data-i="${i}" aria-label="Ver ${esc(d.nombre)} en grande"><img class="mk" src="${VACIO}" alt="${esc(d.nombre)}"></button><b>${esc(d.nombre)}</b><span>${tipo==='taza'?'Taza blanca 11 oz':`Camiseta color ${esc(colorTienda(d).nombre.toLowerCase())}`}</span><strong>${money(tipo==='taza'?precioTaza(d):precioDe(d))}</strong></article>`).join('');
  pista.querySelectorAll('img.mk').forEach((img,i)=>pintarCuando(img,rows[i],i));
  pista.addEventListener('click',e=>{const z=e.target.closest('.zoom');if(z)verProducto(rows[+z.dataset.i])});
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
