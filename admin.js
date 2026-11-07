/* Panel de IMPRESA: productos, videos, puntos de entrega y pedidos. La seguridad real está en RLS (función es_admin). */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const CFG=window.IMPRESA;
const sb=supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey);
const money=n=>`C$ ${Math.round(n||0).toLocaleString('es-NI')}`;

/* ---------- Sesión ---------- */
async function entrar(){const {data:{session}}=await sb.auth.getSession();
  if(!session){$('#login').hidden=false;$('#panel').hidden=true;$('#salir').hidden=true;return}
  const {data:ok,error}=await sb.rpc('es_admin');
  if(error||!ok){await sb.auth.signOut();$('#login').hidden=false;$('#loginMsg').className='msg err';$('#loginMsg').textContent='Esta cuenta no tiene permiso de administrador.';return}
  $('#login').hidden=true;$('#panel').hidden=false;$('#salir').hidden=false;cargar('disenos')}
$('#login').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,m=$('#loginMsg');m.className='msg';m.textContent='Entrando…';
  const {error}=await sb.auth.signInWithPassword({email:f.email.value.trim(),password:f.password.value});
  if(error){m.className='msg err';m.textContent='Correo o contraseña incorrectos.';return}
  f.password.value='';m.textContent='';entrar()});
$('#salir').addEventListener('click',async()=>{await sb.auth.signOut();location.reload()});

/* ---------- Pestañas ---------- */
$$('.tabsA button').forEach(b=>b.addEventListener('click',()=>{$$('.tabsA button').forEach(x=>x.classList.toggle('on',x===b));$$('[data-sec]').forEach(s=>s.hidden=s.dataset.sec!==b.dataset.tab);cargar(b.dataset.tab)}));

/* ---------- Archivos ---------- */
async function subir(file,carpeta){if(file.size>50*1024*1024)throw new Error('El archivo pasa de 50 MB. Para videos largos usa un enlace de YouTube.');
  const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,''),path=`${carpeta}/${crypto.randomUUID()}.${ext}`;
  const {error}=await sb.storage.from('media').upload(path,file,{contentType:file.type});if(error)throw new Error('No se pudo subir: '+error.message);
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl}
// shortcut: al cambiar o borrar, el archivo viejo queda en Storage; limpiar a mano si el espacio (1 GB gratis) se llena

/* ---------- Tablas editables ---------- */
const TABLAS={
  productos:{orden:'orden',foto:'foto_url',carpeta:'productos',vacio:{nombre:'',detalle:'',precio:0,foto_url:'',orden:99,activo:true},
    campos:[['nombre','Nombre','text',1],['detalle','Detalle (ej. Camiseta negra • DTF • diseño D007)','text'],['precio','Precio C$','number',1],['enlace','Enlace «Cambiar color» (opcional, empieza con disena.html?)','text'],['orden','Orden','number'],['activo','Visible en la web','check']]},
  disenos:{orden:'orden',foto:'preview_url',carpeta:'disenos',fotoTxt:'vista',vacio:{en_tienda:true,codigo:'',nombre:'',categoria:'',preview_url:'',archivo:null,precio:500,color:'Negro',orden:99,activo:true},
    campos:[['en_tienda','En la tienda','switch'],['codigo','Código (D011)','text',1],['nombre','Nombre','text',1],['categoria','Categoría (ej. Anime)','text',1],['precio','Precio en la tienda C$','number'],['color','Color de camiseta en la tienda (ej. Negro, Blanco, Rosado)','text'],['archivo','Archivo de impresión','impresion'],['orden','Orden','number'],['activo','Visible en la web','check']]},
  videos:{orden:'orden',foto:'portada_url',carpeta:'videos',vacio:{titulo:'',portada_url:'',video_url:'',orden:99,activo:true},
    campos:[['titulo','Título','text',1],['video_url','Video: enlace de YouTube o archivo','video'],['orden','Orden','number'],['activo','Visible en la web','check']]},
  puntos_entrega:{orden:'orden',vacio:{nombre:'',direccion:'',referencia:'',horario:'12:00 m – 2:00 pm',lat:null,lng:null,orden:99,activo:true},
    campos:[['nombre','Nombre del punto','text',1],['direccion','Dirección','text'],['referencia','Referencia (ej. frente a…)','text'],['horario','Horario','text'],['lat','Latitud','number',1],['lng','Longitud','number',1],['orden','Orden','number'],['activo','Visible en la web','check']]}
};
const caja={productos:'#lista-productos',disenos:'#lista-disenos',videos:'#lista-videos',puntos_entrega:'#lista-puntos'};
// Archivo de impresión: bucket privado; se descarga con un enlace temporal de 10 minutos
async function descargarImpresion(ruta,btn){const t=btn.textContent;btn.textContent='Preparando…';
  const {data,error}=await sb.storage.from('impresion').createSignedUrl(ruta,600,{download:true});btn.textContent=t;
  if(error){alert('No se pudo descargar: '+error.message);return}location.href=data.signedUrl}
const tabla=t=>t==='puntos'?'puntos_entrega':t;
let filasPuntos=[];

async function cargar(tab){if(tab==='pedidos')return pedidos();const t=tabla(tab),def=TABLAS[t];
  const {data,error}=await sb.from(t).select('*').order(def.orden).order('created_at');
  const box=$(caja[t]);if(error){box.innerHTML=`<p class="msg err">No se pudo cargar: ${error.message}</p>`;return}
  box.innerHTML='';if(t==='puntos_entrega'){filasPuntos=[];mapa()}
  data.forEach((row,i)=>box.appendChild(fila(t,row,i)));
  if(!data.length)box.innerHTML='<p class="msg">Todavía no hay nada aquí. Usa el botón de arriba para agregar.</p>';
  if(t==='puntos_entrega')ajustarMapa()}
$$('[data-nuevo]').forEach(b=>b.addEventListener('click',()=>{const t=tabla(b.dataset.nuevo),box=$(caja[t]);box.querySelector('.msg')?.remove();const el=fila(t,{...TABLAS[t].vacio},null);box.prepend(el);el.scrollIntoView({behavior:'smooth',block:'center'});el.querySelector('input:not([type=file])')?.focus();if(t==='puntos_entrega')activar(el._punto)}));

function fila(t,row,i){const def=TABLAS[t],el=document.createElement('article');el.className='fila'+(row.id?'':' nueva')+(row.activo===false?' inactiva':'');
  const izq=document.createElement('div'),campos=document.createElement('div');campos.className='campos';
  let nuevaFoto=null,nuevoVideo=null,nuevaImpresion=null;
  if(def.foto){const img=document.createElement('img');img.className='thumb';img.alt='';if(row[def.foto])img.src=row[def.foto];
    const lb=document.createElement('label');lb.className='fileBtn';const ft=def.fotoTxt||'foto';lb.textContent=row[def.foto]?`Cambiar ${ft}`:`Subir ${ft}`;const inp=document.createElement('input');inp.type='file';inp.accept='image/png,image/jpeg,image/webp';
    inp.onchange=()=>{const f=inp.files[0];if(!f)return;nuevaFoto=f;img.src=URL.createObjectURL(f);lb.firstChild.textContent='Foto lista para guardar'};lb.appendChild(inp);izq.append(img,lb)}
  else{const n=document.createElement('div');n.className='pin';n.style.margin='10px auto';n.innerHTML=`<span>${i==null?'+':i+1}</span>`;izq.appendChild(n)}
  for(const [k,label,tipo,req] of def.campos){const lb=document.createElement(tipo==='impresion'?'div':'label');
    if(tipo==='impresion'){lb.className='ancho';const t=document.createElement('b');t.style.fontSize='12px';t.textContent=label;const fila2=document.createElement('div');fila2.className='acc';fila2.style.marginTop='4px';
      if(row.archivo){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent='⬇ Descargar para imprimir';b.onclick=()=>descargarImpresion(row.archivo,b);const n=document.createElement('span');n.className='msg';n.textContent=row.archivo.split('/').pop();fila2.append(b,n)}
      else{const n=document.createElement('span');n.className='msg err';n.textContent='Falta el archivo de impresión';fila2.append(n)}
      const fb=document.createElement('label');fb.className='fileBtn';fb.textContent=row.archivo?'Reemplazar archivo de impresión':'Subir archivo de impresión';const fi=document.createElement('input');fi.type='file';fi.accept='image/png,image/jpeg,image/webp,image/svg+xml,application/pdf';
      fi.onchange=()=>{nuevaImpresion=fi.files[0];if(nuevaImpresion)fb.firstChild.textContent=`Se subirá: ${nuevaImpresion.name} (${(nuevaImpresion.size/1e6).toFixed(1)} MB)`};fb.appendChild(fi);lb.append(t,fila2,fb)}
    // Publicar en la tienda también requiere que el diseño sea visible.
    else if(tipo==='switch'){lb.className='ancho swRow';const b=document.createElement('button');b.type='button';b.className='swTienda';b.name=k;const m=document.createElement('span');m.className='msg';
      const poner=v=>{b.setAttribute('aria-pressed',String(v));b.innerHTML=v?'<i></i> En la tienda':'<i></i> Agregar a la tienda'};
      poner(row[k]===true&&row.activo!==false);
      b.onclick=async()=>{const anterior=b.getAttribute('aria-pressed')==='true',v=!anterior,vis=campos.querySelector('[name=activo]'),antesVisible=vis?.checked;
        if(!row.id){poner(v);if(v&&vis)vis.checked=true;return}
        b.disabled=true;m.className='msg';m.textContent='Guardando…';
        try{const cambios=v?{[k]:true,activo:true}:{[k]:false};
          const {data,error}=await sb.from(t).update(cambios).eq('id',row.id).select('id,en_tienda,activo').single();
          if(error)throw error;if(!data||data.en_tienda!==v||(v&&!data.activo))throw new Error('No se pudo confirmar el cambio. Recarga e inténtalo de nuevo.');
          Object.assign(row,cambios);poner(v);if(v&&vis)vis.checked=true;
          if(v)el.classList.remove('inactiva');m.className='msg ok';m.textContent=v?'Ahora está en la tienda ✓':'Quitado de la tienda ✓';
        }catch(error){poner(anterior);if(vis)vis.checked=antesVisible;m.className='msg err';m.textContent=error.message||'No se pudo guardar'}
        finally{b.disabled=false}};lb.append(b,m)}
    else if(tipo==='check'){lb.className='chk';const c=document.createElement('input');c.type='checkbox';c.name=k;c.checked=!!row[k];lb.append(c,label)}
    else if(tipo==='video'){lb.className='ancho';lb.append(label);const c=document.createElement('input');c.name=k;c.type='url';c.placeholder='https://youtu.be/… (o sube un archivo abajo)';c.value=row[k]||'';lb.append(c);
      const fb=document.createElement('label');fb.className='fileBtn';fb.textContent='Subir archivo de video (MP4, máx. 50 MB)';const fi=document.createElement('input');fi.type='file';fi.accept='video/mp4,video/webm,video/quicktime';fi.onchange=()=>{nuevoVideo=fi.files[0];if(nuevoVideo){c.value='';c.placeholder=`Se subirá: ${nuevoVideo.name}`}};fb.appendChild(fi);lb.append(fb)}
    else{lb.append(label);const c=document.createElement('input');c.name=k;c.type=tipo;if(tipo==='number')c.step='any';c.required=!!req;c.value=row[k]??'';if(k==='lat'||k==='lng')c.readOnly=true;lb.append(c)}
    campos.appendChild(lb)}
  const acc=document.createElement('div');acc.className='acc';const g=document.createElement('button');g.type='button';g.className='btn';g.textContent='Guardar';const msg=document.createElement('span');msg.className='msg';msg.setAttribute('role','status');
  acc.append(g);if(row.id){const d=document.createElement('button');d.type='button';d.className='btn rojo';d.textContent='Borrar';acc.append(d);
    d.onclick=async()=>{if(!confirm('¿Borrar? Esto no se puede deshacer.'))return;const {error}=await sb.from(t).delete().eq('id',row.id);if(error){msg.className='msg err';msg.textContent=error.message;return}cargar(t==='puntos_entrega'?'puntos':t)}}
  acc.append(msg);campos.appendChild(Object.assign(document.createElement('div'),{className:'ancho'}));campos.lastChild.appendChild(acc);
  el.append(izq,campos);

  g.onclick=async()=>{const datos={};for(const [k,,tipo,req] of def.campos){if(tipo==='impresion')continue;const c=campos.querySelector(`[name=${k}]`);if(tipo==='switch'){datos[k]=c.getAttribute('aria-pressed')==='true';continue}
      const v=tipo==='check'?c.checked:tipo==='number'?(c.value===''?null:+c.value):c.value.trim();
      if(req&&(v===''||v==null)){msg.className='msg err';msg.textContent=k==='lat'||k==='lng'?'Haz clic en el mapa para ubicar el punto.':'Completa los campos obligatorios.';c.focus?.();return}
      datos[k]=tipo==='text'||tipo==='video'?(v||(k==='video_url'||k==='enlace'?null:'')):v}
    if(def.foto&&!nuevaFoto&&!row[def.foto]){msg.className='msg err';msg.textContent='Falta la foto.';return}
    g.disabled=true;msg.className='msg';msg.textContent='Guardando…';
    try{if(nuevaFoto)datos[def.foto]=await subir(nuevaFoto,def.carpeta);
      if(nuevoVideo)datos.video_url=await subir(nuevoVideo,'videos');
      if(nuevaImpresion){if(!/^D\d{3,5}$/.test(datos.codigo||''))throw new Error('El código debe ser como D011.');
        const ext=(nuevaImpresion.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,''),slug=(datos.nombre||'').normalize('NFD').replace(/[^\w\s-]/g,'').trim().toLowerCase().replace(/\s+/g,'-').slice(0,40)||'diseno',ruta=`catalogo/${datos.codigo}-${slug}.${ext}`;
        if(nuevaImpresion.size>50*1024*1024)throw new Error('El archivo de impresión pasa de 50 MB.');
        const {error:e2}=await sb.storage.from('impresion').upload(ruta,nuevaImpresion,{contentType:nuevaImpresion.type,upsert:true});if(e2)throw new Error('No se pudo subir el archivo de impresión: '+e2.message);datos.archivo=ruta}
      const q=row.id?sb.from(t).update(datos).eq('id',row.id):sb.from(t).insert(datos);const {error}=await q;if(error)throw error;
      msg.className='msg ok';msg.textContent='Guardado ✓';setTimeout(()=>cargar(t==='puntos_entrega'?'puntos':t),700)}
    catch(err){msg.className='msg err';msg.textContent=err.message||'No se pudo guardar'}finally{g.disabled=false}};

  if(t==='puntos_entrega'){const p={el,row,marker:null,idx:i};el._punto=p;filasPuntos.push(p);
    if(row.lat!=null)ponerMarcador(p,[row.lat,row.lng]);el.addEventListener('focusin',()=>activar(p));el.addEventListener('click',()=>activar(p))}
  return el}

/* ---------- Mapa de puntos ---------- */
let M=null,activo=null;
function mapa(){if(M){M.eachLayer(l=>{if(l instanceof L.Marker)l.remove()});return}
  M=L.map('mapaAdm').setView([12.1150,-86.2362],12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(M);
  M.on('click',e=>{if(!activo){alert('Primero elige o agrega un punto en la lista de abajo.');return}ponerMarcador(activo,[e.latlng.lat,e.latlng.lng])})}
function ponerMarcador(p,ll){const set=([a,b])=>{p.el.querySelector('[name=lat]').value=a.toFixed(6);p.el.querySelector('[name=lng]').value=b.toFixed(6)};
  if(p.marker)p.marker.setLatLng(ll);else{p.marker=L.marker(ll,{draggable:true,icon:L.divIcon({className:'',html:`<div class="pin"><span>${p.idx==null?'+':p.idx+1}</span></div>`,iconSize:[30,30],iconAnchor:[15,30]})}).addTo(M);
    p.marker.on('dragend',()=>{const q=p.marker.getLatLng();set([q.lat,q.lng]);activar(p)})}
  set(ll)}
function activar(p){activo=p;filasPuntos.forEach(x=>x.el.style.outline=x===p?'2px solid #29a8ff':'')}
function ajustarMapa(){setTimeout(()=>{M.invalidateSize();const ms=filasPuntos.filter(p=>p.marker).map(p=>p.marker.getLatLng());if(ms.length>1)M.fitBounds(L.latLngBounds(ms).pad(.3));else if(ms.length)M.setView(ms[0],14)},50)}

/* ---------- Pedidos ---------- */
const ESTADOS=['nuevo','en_proceso','listo','entregado','cancelado'];
async function pedidos(){const box=$('#lista-pedidos');box.innerHTML='<p class="msg">Cargando…</p>';
  const {data,error}=await sb.from('pedidos').select('*').order('created_at',{ascending:false}).limit(100);
  if(error){box.innerHTML=`<p class="msg err">${error.message}</p>`;return}
  if(!data.length){box.innerHTML='<p class="msg">Todavía no hay pedidos.</p>';return}
  box.innerHTML='';for(const p of data){const el=document.createElement('article');el.className='ped';
    const tel=(p.telefono||'').replace(/\D/g,''),wa=tel?`https://wa.me/${tel.length===8?'505'+tel:tel}`:null;
    el.innerHTML=`<header><b></b><span class="msg"></span></header><p class="cliente"></p><p class="items"></p><div class="acc"><label class="chk">Estado <select></select></label><span class="msg"></span></div>`;
    el.querySelector('b').textContent=`${p.tipo==='pedido'?'🧾 Pedido':'💬 Mensaje'} · ${p.nombre}${p.total_estimado?' · '+money(p.total_estimado):''}`;
    el.querySelector('header .msg').textContent=new Date(p.created_at).toLocaleString('es-NI');
    const cli=el.querySelector('.cliente');cli.textContent=`Tel: ${p.telefono}${p.correo?' · '+p.correo:''}${p.entrega?'\nEntrega: '+p.entrega:''}${p.direccion?'\nDirección: '+p.direccion:''}${p.notas?'\nNotas: '+p.notas:''}`;
    if(wa){const a=document.createElement('a');a.href=wa;a.target='_blank';a.rel='noopener';a.textContent=' Abrir WhatsApp';cli.append(' ',a)}
    const it=el.querySelector('.items');(p.items||[]).forEach(i=>{it.append(`• ${i.cantidad} × ${i.nombre} — ${i.detalle||''}\n`);
      // diseños del catálogo (D007…): botón directo al archivo de impresión
      for(const cod of new Set(String(i.detalle||'').match(/\bD\d{3,5}\b/g)||[])){const b=document.createElement('button');b.type='button';b.className='btn';b.style.cssText='padding:6px 10px;font-size:12px;margin:2px 6px 6px 0';b.textContent=`⬇ ${cod} para imprimir`;
        b.onclick=async()=>{const {data}=await sb.from('disenos').select('archivo').eq('codigo',cod).maybeSingle();if(!data?.archivo){alert(`El diseño ${cod} no tiene archivo de impresión.`);return}descargarImpresion(data.archivo,b)};it.append(b)}(i.archivos||(i.diseno?[i.diseno]:[])).forEach(l=>{const url=String(l).match(/https:\/\/\S+/)?.[0];if(!url)return;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=String(l).split(': ')[0]==url?'Ver archivo':String(l).split(': ')[0];it.append('   ',a,'\n')})});
    const sel=el.querySelector('select'),m=el.querySelector('.acc .msg');sel.innerHTML=ESTADOS.map(s=>`<option ${s===p.estado?'selected':''}>${s}</option>`).join('');
    sel.onchange=async()=>{const {error}=await sb.from('pedidos').update({estado:sel.value}).eq('id',p.id);m.className=error?'msg err':'msg ok';m.textContent=error?error.message:'Guardado ✓'};
    box.appendChild(el)}}
$('#recargarPed').addEventListener('click',pedidos);

entrar();
