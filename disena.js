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
  $('#cm').max=maxCm(d.ratio);$('#cm').value=d.cm;$('#cmTxt').textContent=`${d.cm} cm de ancho`}
function maxCm(ratio,lado=st.lado){const z=P().zonas[lado];return Math.max(3,Math.floor(Math.min(30,z.w/PCT_CM,z.h/PCT_CM/ratio)))}
function limitar(d,lado=st.lado){const z=P().zonas[lado];d.cm=Math.min(d.cm,maxCm(d.ratio,lado));const w=d.cm*PCT_CM,h=w*d.ratio;
  d.cx=Math.min(Math.max(d.cx,z.x+w/2),z.x+z.w-w/2);d.cy=Math.min(Math.max(d.cy,z.y+h/2),z.y+z.h-h/2)}

$('#file').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)usarArchivo(f)});
// Diseño listo de la Galería (?diseno=…): solo archivos del propio sitio
const disenoListo=qs.get('diseno');
if(disenoListo&&/^assets\/disenos-anime\/[\w-]+\.png$/.test(disenoListo))fetch(disenoListo).then(r=>r.ok?r.blob():null).then(b=>b&&usarArchivo(new File([b],disenoListo.split('/').pop(),{type:'image/png'})));
function usarArchivo(f){
  if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)){alert('Sube una imagen PNG, JPG, WEBP o SVG.');return}
  if(f.size>8e6){alert('La imagen pesa más de 8 MB. Prueba con una más liviana.');return}
  const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const ratio=img.naturalHeight/img.naturalWidth||1,z=Z();
    const d={nombre:f.name,data:r.result,ratio,cm:Math.min(st.prenda==='waffit'&&st.lado==='frente'?10:25,maxCm(ratio)),cx:z.x+z.w/2,cy:z.y};d.cy=z.y+d.cm*PCT_CM*ratio/2+(z.h>20?2:0);limitar(d);st.lados[st.lado]=d;mostrarDiseno();calc()};img.src=r.result};r.readAsDataURL(f)}
$('#cm').addEventListener('input',e=>{const d=st.lados[st.lado];if(!d)return;d.cm=+e.target.value;limitar(d);mostrarDiseno()});
$('#centrar').addEventListener('click',()=>{const d=st.lados[st.lado];if(!d)return;d.cx=Z().x+Z().w/2;limitar(d);mostrarDiseno()});
$('#quitar').addEventListener('click',()=>{st.lados[st.lado]=null;mostrarDiseno();calc()});
let drag=null;
dImg.addEventListener('pointerdown',e=>{const d=st.lados[st.lado];if(!d)return;e.preventDefault();dImg.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,cx:d.cx,cy:d.cy}});
dImg.addEventListener('pointermove',e=>{if(!drag)return;const d=st.lados[st.lado],b=stage.getBoundingClientRect();d.cx=drag.cx+(e.clientX-drag.x)/b.width*100;d.cy=drag.cy+(e.clientY-drag.y)/b.height*100;limitar(d);mostrarDiseno()});
['pointerup','pointercancel'].forEach(t=>dImg.addEventListener(t,()=>drag=null));

/* ---------- Opciones ---------- */
$$('.ladoBtn').forEach(b=>b.addEventListener('click',()=>{st.lado=b.dataset.lado;$$('.ladoBtn').forEach(x=>x.classList.toggle('active',x===b));pintar();mostrarDiseno()}));
function renderColores(){const box=$('#colores');box.innerHTML='';const lista=P().colores.filter(c=>st.tec==='DTF'||c.claro);
  if(!lista.includes(st.color))st.color=lista.find(c=>c.nombre===st.color?.nombre)||lista[0];
  lista.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='sw'+(c===st.color?' on':'');b.style.background=c.hex;const n=c.codigo?`${c.nombre} (${c.codigo})`:c.nombre;b.title=n;b.setAttribute('aria-label',n);b.setAttribute('aria-pressed',c===st.color);
    b.onclick=()=>{st.color=c;renderColores()};box.appendChild(b)});
  $('#colorNombre').textContent=st.color.codigo?`${st.color.nombre} · ${st.color.codigo}`:st.color.nombre;pintar()}
$$('input[name=tec]').forEach(r=>r.addEventListener('change',()=>{st.tec=r.value;$('#tecNota').hidden=st.tec!=='Sublimación';renderColores();calc()}));
$$('input[name=prenda]').forEach(r=>{r.checked=r.value===st.prenda;r.addEventListener('change',async()=>{st.prenda=r.value;await cargarPrenda(st.prenda);
  $('.ladoBtn[data-lado=frente]').textContent=st.prenda==='waffit'?'Frente (pecho)':'Frente';
  for(const l of ['frente','espalda'])if(st.lados[l])limitar(st.lados[l],l); // el diseño se ajusta a la nueva zona
  $$('#audience option').forEach(o=>o.disabled=!P().tallasNino&&/Niñ/.test(o.value));if($('#audience option:checked').disabled)$('#audience').value='Hombre';
  renderTallas();renderColores();mostrarDiseno();calc()})});
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
  const lados=['frente','espalda'].filter(l=>st.lados[l]).map(l=>`${l} ${st.lados[l].cm} cm`).join(' + ')||'sin diseño subido';
  const color=st.color.codigo?`${st.color.nombre} ${st.color.codigo}`:st.color.nombre;
  const ok=addItem({nombre:`${P().corto} Klasiko ${st.tec}`,detalle:`${$('#audience').value} • ${color} • ${lados} • tallas ${tallas}`,qty:q,precio:unitario(),
    archivos:['frente','espalda'].filter(l=>st.lados[l]).map(l=>({lado:l,nombre:st.lados[l].nombre,data:st.lados[l].data})),vista:await vista()});
  if(ok)location.href='pedido.html'});

renderTallas();colocarZona();
cargarPrenda(st.prenda).then(()=>{$$('input[name=prenda]').find(r=>r.checked)?.dispatchEvent(new Event('change'))});
cargarPrenda(st.prenda==='waffit'?'camiseta':'waffit'); // la otra en segundo plano para cambiar sin espera
})();
