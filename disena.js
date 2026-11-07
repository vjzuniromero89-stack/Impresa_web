/* Diseña tu camisa: camisas Klasiko reales (camiseta o Waffit) teñidas del color elegido, diseño por lado, solo DTF y Sublimación. */
(()=>{
const stage=$('#stage');if(!stage)return;
const TALLAS={adulto:['XS','S','M','L','XL','2XL','3XL'],nino:['2','4','6','8','10','12','14','16']};
const qs=new URLSearchParams(location.search);
const st={prenda:PRENDAS[qs.get('prenda')]?qs.get('prenda'):'camiseta',tec:'DTF',color:null,lado:qs.get('lado')==='espalda'?'espalda':'frente',lados:{frente:null,espalda:null}};
$$('.ladoBtn').forEach(x=>x.classList.toggle('active',x.dataset.lado===st.lado));
const P=()=>PRENDAS[st.prenda],Z=()=>P().zonas[st.lado];
st.color=P().colores.find(c=>c.codigo&&c.codigo===qs.get('color')||c.nombre===qs.get('color'))||P().colores[0];
const canvas=$('#shirt'),ctx=canvas.getContext('2d');
const talla=()=>$$('.qty').find(q=>+q.value>0)?.dataset.talla||'M';
const pintar=()=>pintarCamisa(ctx,st.prenda,st.lado,st.color.hex,talla());

/* ---------- Diseño sobre la camisa ---------- */
const zonaEl=$('#zona'),dImg=$('#designImg');
function colocarZona(){const z=Z();Object.assign(zonaEl.style,{left:z.x+'%',top:z.y+'%',width:z.w+'%',height:z.h+'%'})}
function mostrarDiseno(){const d=st.lados[st.lado];colocarZona();$('#ladoNombre').textContent=st.lado==='frente'?(st.prenda==='waffit'?'el pecho':'el frente'):'la espalda';
  $('#sizeBox').hidden=!d;$('#quitar').hidden=!d;zonaEl.classList.toggle('vacia',!d);
  if(!d){dImg.hidden=true;return}
  dImg.hidden=false;if(dImg.src!==d.data)dImg.src=d.data;
  const w=d.cm*PCT_CM,h=w*d.ratio;Object.assign(dImg.style,{width:w+'%',left:(d.cx-w/2)+'%',top:(d.cy-h/2)+'%'});
  $('#fondoBtn').hidden=!d.sinFondo;$('#fondoBtn').textContent=d.usarSinFondo?'Poner fondo':'Quitar fondo';
  $('#cm').max=maxCm(d.ratio);$('#cm').value=d.cm;$('#cmTxt').textContent=`${d.cm} cm de ancho`}
function maxCm(ratio,lado=st.lado){const z=P().zonas[lado];return Math.max(3,Math.floor(Math.min(30,z.w/PCT_CM,z.h/PCT_CM/ratio)))}
function limitar(d,lado=st.lado){const z=P().zonas[lado];d.cm=Math.min(d.cm,maxCm(d.ratio,lado));const w=d.cm*PCT_CM,h=w*d.ratio;
  d.cx=Math.min(Math.max(d.cx,z.x+w/2),z.x+z.w-w/2);d.cy=Math.min(Math.max(d.cy,z.y+h/2),z.y+z.h-h/2)}

$('#file').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)usarArchivo(f)});
// Diseño del catálogo o la Galería (?diseno=…&dn=D007): solo archivos del sitio o del Storage público del proyecto
const disenoListo=qs.get('diseno'),codigoDiseno=/^D\d{3,5}$/.test(qs.get('dn')||'')?qs.get('dn'):null;
const permitido=u=>/^assets\/disenos-anime\/[\w-]+\.png$/.test(u)||u.startsWith(`${CFG.supabaseUrl}/storage/v1/object/public/media/`);
if(disenoListo&&permitido(disenoListo))fetch(disenoListo).then(r=>r.ok?r.blob():null).then(b=>b&&usarArchivo(new File([b],disenoListo.split('/').pop().split('?')[0],{type:b.type||'image/png'}),codigoDiseno));
function usarArchivo(f,codigo=null){
  if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)){alert('Sube una imagen PNG, JPG, WEBP o SVG.');return}
  if(f.size>8e6){alert('La imagen pesa más de 8 MB. Prueba con una más liviana.');return}
  const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const z=Z(),sf=f.type==='image/svg+xml'?null:quitarFondo(img);
    const d={nombre:f.name,codigo,orig:{data:r.result,ratio:img.naturalHeight/img.naturalWidth||1},sinFondo:sf,usarSinFondo:!!sf};aplicarFondo(d);
    d.cm=Math.min(st.prenda==='waffit'&&st.lado==='frente'?10:25,maxCm(d.ratio));d.cx=z.x+z.w/2;d.cy=z.y+d.cm*PCT_CM*d.ratio/2+(z.h>20?2:0);limitar(d);st.lados[st.lado]=d;mostrarDiseno();calc()};img.src=r.result};r.readAsDataURL(f)}
function aplicarFondo(d){const v=d.usarSinFondo&&d.sinFondo?d.sinFondo:d.orig;d.data=v.data;d.ratio=v.ratio;
  if(d.usarSinFondo&&d.sinFondo&&!/-sin-fondo\.png$/.test(d.nombre))d.nombre=d.nombre.replace(/\.[^.]+$/,'')+'-sin-fondo.png';else if(!d.usarSinFondo)d.nombre=d.nombre.replace(/-sin-fondo\.png$/,'.png')}
$('#fondoBtn').addEventListener('click',()=>{const d=st.lados[st.lado];if(!d?.sinFondo)return;d.usarSinFondo=!d.usarSinFondo;aplicarFondo(d);limitar(d);mostrarDiseno()});

/* Quita un fondo de un solo color (verde, blanco, etc.). Devuelve PNG recortado o null si el fondo no es liso o ya es transparente. */
function quitarFondo(img){const max=4000,s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),W=Math.round(img.naturalWidth*s),H=Math.round(img.naturalHeight*s);
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,W,H);const id=x.getImageData(0,0,W,H),p=id.data;
  // color del borde: si casi todo el borde es de un mismo color opaco, eso es el fondo
  const borde=[];const paso=Math.max(1,Math.floor((W+H)/400));
  for(let i=0;i<W;i+=paso)borde.push((0*W+i)*4,((H-1)*W+i)*4);for(let j=0;j<H;j+=paso)borde.push((j*W)*4,(j*W+W-1)*4);
  if(borde.some(k=>p[k+3]<250))return null; // ya tiene transparencia
  const med=[0,1,2].map(ch=>borde.map(k=>p[k+ch]).sort((a,b)=>a-b)[borde.length>>1]);
  const dist=k=>Math.abs(p[k]-med[0])+Math.abs(p[k+1]-med[1])+Math.abs(p[k+2]-med[2]);
  if(borde.filter(k=>dist(k)<45).length/borde.length<0.85)return null;
  const croma=Math.max(...med)-Math.min(...med)>100; // fondo de color fuerte (verde/azul): se quita en toda la imagen
  const alfa=new Uint8ClampedArray(W*H).fill(255),T=70;
  if(croma){for(let q=0;q<W*H;q++){const dd=dist(q*4);alfa[q]=dd<T?0:dd<T*2?Math.round((dd-T)/T*255):255}}
  else{const pila=[],visto=new Uint8Array(W*H);for(let i=0;i<W;i++)pila.push(i,(H-1)*W+i);for(let j=0;j<H;j++)pila.push(j*W,j*W+W-1);
    while(pila.length){const q=pila.pop();if(visto[q])continue;visto[q]=1;if(dist(q*4)>=T)continue;alfa[q]=0;const xx=q%W;
      if(xx>0)pila.push(q-1);if(xx<W-1)pila.push(q+1);if(q>=W)pila.push(q-W);if(q<W*(H-1))pila.push(q+W)}
    for(let q=0;q<W*H;q++)if(alfa[q]&&((q%W>0&&!alfa[q-1])||(q%W<W-1&&!alfa[q+1])||(q>=W&&!alfa[q-W])||(q<W*(H-1)&&!alfa[q+W]))){const dd=dist(q*4);alfa[q]=Math.min(255,Math.round(dd/(T*2)*255))}}
  // quita el reflejo del color de fondo en los bordes (sobre todo con verde)
  const dom=med.indexOf(Math.max(...med));
  let x0=W,y0=H,x1=-1,y1=-1;
  for(let q=0;q<W*H;q++){const k=q*4,a=alfa[q];p[k+3]=a;if(croma&&a<255&&a>0){const otros=[0,1,2].filter(ch=>ch!==dom).map(ch=>p[k+ch]);p[k+dom]=Math.min(p[k+dom],Math.max(...otros))}
    if(a>40){const xx=q%W,yy=(q-xx)/W;if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy}}
  if(x1<0)return null;x.putImageData(id,0,0);
  const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);
  return {data:o.toDataURL('image/png'),ratio:o.height/o.width}}
$('#cm').addEventListener('input',e=>{const d=st.lados[st.lado];if(!d)return;d.cm=+e.target.value;limitar(d);mostrarDiseno()});
$('#centrar').addEventListener('click',()=>{const d=st.lados[st.lado];if(!d)return;d.cx=Z().x+Z().w/2;limitar(d);mostrarDiseno()});
$('#quitar').addEventListener('click',()=>{st.lados[st.lado]=null;mostrarDiseno();calc()});
let drag=null;
dImg.addEventListener('pointerdown',e=>{const d=st.lados[st.lado];if(!d)return;e.preventDefault();dImg.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,cx:d.cx,cy:d.cy}});
dImg.addEventListener('pointermove',e=>{if(!drag)return;const d=st.lados[st.lado],b=stage.getBoundingClientRect();d.cx=drag.cx+(e.clientX-drag.x)/b.width*100;d.cy=drag.cy+(e.clientY-drag.y)/b.height*100;limitar(d);mostrarDiseno()});
['pointerup','pointercancel'].forEach(t=>dImg.addEventListener(t,()=>drag=null));

/* ---------- Opciones ---------- */
$$('.ladoBtn').forEach(b=>b.addEventListener('click',()=>{st.lado=b.dataset.lado;$$('.ladoBtn').forEach(x=>x.classList.toggle('active',x===b));pintar();mostrarDiseno()}));
function renderColores(){const box=$('#colores');box.innerHTML='';const lista=P().colores; // DTF y bordado van en cualquier color
  if(!lista.includes(st.color))st.color=lista.find(c=>c.nombre===st.color?.nombre)||lista[0];
  lista.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='sw'+(c===st.color?' on':'');b.style.background=c.hex;const n=c.codigo?`${c.nombre} (${c.codigo})`:c.nombre;b.title=n;b.setAttribute('aria-label',n);b.setAttribute('aria-pressed',c===st.color);
    b.onclick=()=>{st.color=c;renderColores()};box.appendChild(b)});
  $('#colorNombre').textContent=st.color.codigo?`${st.color.nombre} · ${st.color.codigo}`:st.color.nombre;pintar()}
$$('input[name=tec]').forEach(r=>r.addEventListener('change',()=>{st.tec=r.value;notaTec();renderColores();calc()}));
// Cada camisa admite sus técnicas: camiseta = DTF o bordado, Waffit = solo bordado
function syncTec(){const ts=P().tecnicas;if(!ts.includes(st.tec))st.tec=ts[0];
  $$('input[name=tec]').forEach(r=>{const ok=ts.includes(r.value);r.disabled=!ok;r.checked=r.value===st.tec;r.closest('.tec').classList.toggle('off',!ok)});notaTec()}
function notaTec(){stage.classList.toggle('bordado',st.tec==='Bordado');
  $('#tecNota').textContent=st.tec==='Bordado'?`Bordado${st.prenda==='waffit'?' (la Waffit solo se borda)':''}: funciona mejor con logos de pocos colores y sin degradados. IMPRESA revisa tu logo antes de bordar.`:'DTF: impresión a todo color, perfecta para diseños grandes, fotos y degradados.'}
$$('input[name=prenda]').forEach(r=>{r.checked=r.value===st.prenda;r.addEventListener('change',async()=>{st.prenda=r.value;await cargarPrenda(st.prenda);
  $('.ladoBtn[data-lado=frente]').textContent=st.prenda==='waffit'?'Frente (pecho)':'Frente';
  for(const l of ['frente','espalda'])if(st.lados[l])limitar(st.lados[l],l); // el diseño se ajusta a la nueva zona
  $$('#audience option').forEach(o=>o.disabled=!P().tallasNino&&/Niñ/.test(o.value));if($('#audience option:checked').disabled)$('#audience').value='Hombre';
  syncTec();renderTallas();renderColores();mostrarDiseno();calc()})});
function renderTallas(){const prev=Object.fromEntries($$('.qty').map(q=>[q.dataset.talla,q.value]));const t=TALLAS[/Niñ/.test($('#audience').value)?'nino':'adulto'];
  $('#sizes').innerHTML=t.map(x=>`<label>${x}<input class="qty" type="number" min="0" max="999" inputmode="numeric" value="${prev[x]??(x==='M'||x==='8'?1:0)}" data-talla="${x}"></label>`).join('');
  $$('.qty').forEach(q=>q.addEventListener('input',()=>{calc();pintar()}));calc();pintar()} // la etiqueta muestra la primera talla elegida
$('#audience').addEventListener('change',renderTallas);
$('#config').addEventListener('submit',e=>e.preventDefault()); // Enter no recarga ni pierde el diseño

/* ---------- Precio ---------- */
const totalQty=()=>$$('.qty').reduce((a,x)=>a+Math.max(0,Math.floor(+x.value)||0),0);
function unitario(){const pr=CFG.precios||{},base=pr[P().nombre]?.[st.tec]??350,dos=st.lados.frente&&st.lados.espalda,q=totalQty(),desc=(pr.descuentos||[]).find(d=>q>=d.desde)?.factor||1;return (base+(dos?pr.segundoLado??150:0))*desc}
function calc(){const q=totalQty();$('#totalQty').textContent=q;$('#price').textContent=money(unitario()*q);$('#unit').textContent=`${money(unitario())} por camisa${st.lados.frente&&st.lados.espalda?' (frente y espalda)':''}`}

/* ---------- Vista para el pedido: camisa + diseños, en JPG pequeño ---------- */
async function vista(){const lados=['frente','espalda'].filter(l=>st.lados[l]),c=document.createElement('canvas');c.width=600*Math.max(1,lados.length);c.height=600;const x=c.getContext('2d');x.fillStyle='#eef2f7';x.fillRect(0,0,c.width,c.height);
  const tmp=document.createElement('canvas');tmp.width=tmp.height=800;const tx=tmp.getContext('2d');
  for(const [i,l] of (lados.length?lados:['frente']).entries()){pintarCamisa(tx,st.prenda,l,st.color.hex,talla());x.drawImage(tmp,i*600,0,600,600);const d=st.lados[l];
    if(d){const img=new Image();img.src=d.data;await img.decode();const w=d.cm*PCT_CM/100*600,h=w*d.ratio;x.drawImage(img,i*600+d.cx/100*600-w/2,d.cy/100*600-h/2,w,h)}}
  return c.toDataURL('image/jpeg',0.82)}

$('#add').addEventListener('click',async()=>{const q=totalQty();if(q<1){alert('Indica cuántas camisas quieres en cada talla.');return}
  if(!st.lados.frente&&!st.lados.espalda&&!confirm('No subiste ningún diseño. ¿Agregar la camisa igual y enviar el diseño por WhatsApp?'))return;
  const tallas=$$('.qty').filter(x=>+x.value>0).map(x=>`${x.dataset.talla}: ${Math.floor(+x.value)}`).join(', ');
  const lados=['frente','espalda'].filter(l=>st.lados[l]).map(l=>`${l} ${st.lados[l].cm} cm${st.lados[l].codigo?` diseño ${st.lados[l].codigo}`:''}`).join(' + ')||'sin diseño subido';
  const color=st.color.codigo?`${st.color.nombre} ${st.color.codigo}`:st.color.nombre,btn=$('#add'),txt=btn.textContent;
  // el carrito vive en localStorage (≈5 MB): el diseño del cliente se sube ya y se guarda solo su enlace
  btn.disabled=true;btn.textContent='Guardando tu diseño…';
  try{const archivos=[];for(const l of ['frente','espalda']){const d=st.lados[l];if(!d)continue;
      if(d.codigo)archivos.push({lado:l,nombre:d.nombre,codigo:d.codigo});
      else archivos.push(sbReady()?{lado:l,nombre:d.nombre,url:await uploadFile(d)}:{lado:l,nombre:d.nombre,data:d.data})}
    const ok=addItem({nombre:`${P().corto} Klasiko ${st.tec}`,detalle:`${$('#audience').value} • ${color} • ${lados} • tallas ${tallas}`,qty:q,precio:unitario(),archivos,vista:await vista()});
    if(ok)location.href='pedido.html'}
  catch(err){alert(`${err.message}. Revisa tu conexión e inténtalo de nuevo.`)}
  finally{btn.disabled=false;btn.textContent=txt}});

renderTallas();colocarZona();
cargarPrenda(st.prenda).then(()=>{$$('input[name=prenda]').find(r=>r.checked)?.dispatchEvent(new Event('change'))});
cargarPrenda(st.prenda==='waffit'?'camiseta':'waffit'); // la otra en segundo plano para cambiar sin espera
})();
