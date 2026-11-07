/* Personalizador de taza: usa el mismo catálogo y pedido de IMPRESA. */
(()=>{
const canvas=$('#tazaCanvas');if(!canvas)return;
let rows=[],selected=null,category='Todos',offset=0,version=0,preview=null,busy=false;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const quantity=()=>Math.max(1,Math.min(999,Math.floor(Number($('#tazaCantidad').value)||1)));
function total(){const n=quantity();$('#tazaCantidad').value=n;$('#tazaUnitario').textContent=selected?money(precioTaza(selected))+' por taza':'';$('#tazaTotal').textContent=selected?money(precioTaza(selected)*n):''}
async function paint(){const v=++version;$('#tazaAgregar').disabled=true;try{const src=await mockupTaza(selected||{codigo:'base',preview_url:null},{offset});if(v!==version)return;const img=await cargarImg(src);if(v!==version)return;canvas.getContext('2d').drawImage(img,0,0,800,800);preview=src;$('#tazaAgregar').disabled=!selected||busy;canvas.setAttribute('aria-label',selected?'Taza blanca con '+selected.nombre:'Taza blanca de 11 oz sin diseño')}catch{if(v===version)$('#tazaEstado').textContent='No se pudo cargar la vista. Elige otro diseño o vuelve a intentarlo.'}}
function choose(d){selected=d;$('#tazaNombre').textContent=d.codigo+' · '+d.nombre;$('#tazaPedidoEstado').textContent='';render();total();paint();const q=new URLSearchParams();q.set('dn',d.codigo);history.replaceState(null,'','taza.html?'+q)}
function render(){const term=norm($('#tazaBuscar').value),shown=rows.filter(d=>(category==='Todos'||d.categoria===category)&&norm(d.codigo+' '+d.nombre+' '+d.categoria).includes(term));
 const box=$('#tazaDisenos');box.replaceChildren();for(const d of shown){const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(d.codigo===selected?.codigo));const img=document.createElement('img');img.src=d.preview_url;img.alt=d.nombre;img.loading='lazy';const label=document.createElement('span');label.textContent=d.codigo+' · '+d.nombre;b.append(img,label);b.onclick=()=>choose(d);box.appendChild(b)}
 $('#tazaEstado').textContent=shown.length?shown.length+' diseños disponibles':'No hay diseños que coincidan. Prueba otra búsqueda.'}
$('#tazaBuscar').addEventListener('input',render);$('#tazaCantidad').addEventListener('change',total);
$$('[data-offset]').forEach(b=>b.onclick=()=>{offset=Number(b.dataset.offset);$$('[data-offset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));paint()});
// Exportación para el pedido: una plantilla de taza, nunca la foto del producto.
async function printLayout(d){const img=await cargarImg(d.preview_url);return plantillaTaza(img,d).toDataURL('image/png')}
$('#tazaAgregar').onclick=async()=>{if(!selected||!preview||busy)return;const d=selected,n=quantity(),src=preview;busy=true;$('#tazaAgregar').disabled=true;const status=$('#tazaPedidoEstado');status.textContent='Preparando tu taza…';
 try{const data=await printLayout(d),file={nombre:d.codigo+'-taza-21x9.5cm.png',data};let printFile;if(sbReady())printFile={url:await uploadFile(file),lado:'plantilla taza'};else printFile={...file,lado:'plantilla taza'};
  if(!addItem({nombre:'Taza '+d.nombre,detalle:'Taza blanca 11 oz • sublimación • diseño '+d.codigo+' • plantilla 21 × 9,5 cm',qty:n,precio:precioTaza(d),vista:src,archivos:[{codigo:d.codigo,lado:'diseño catálogo'},printFile]}))throw new Error('No se pudo guardar la taza en tu pedido.');
  status.textContent='¡Taza agregada! Puedes verla en Mi pedido.';
 }catch(error){status.textContent=error.message||'No se pudo agregar. Inténtalo de nuevo.'}finally{busy=false;$('#tazaAgregar').disabled=!selected}}
paint();
(async()=>{const data=await sbGet('disenos?select=codigo,nombre,categoria,preview_url,precio_taza,formato_taza&activo=eq.true&order=orden,created_at');if(!data?.length){$('#tazaEstado').textContent='No se pudieron cargar los diseños. Recarga la página para intentarlo de nuevo.';return}rows=data;
 const cats=['Todos',...new Set(rows.map(d=>d.categoria).filter(Boolean))];for(const c of cats){const b=document.createElement('button');b.type='button';b.textContent=c;b.setAttribute('aria-pressed',String(c==='Todos'));b.onclick=()=>{category=c;$('#tazaCategorias').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()};$('#tazaCategorias').appendChild(b)}
 const requested=new URLSearchParams(location.search).get('dn'),d=rows.find(d=>d.codigo===requested);if(d)choose(d);else render();
})();
})();
