/* Camisas Klasiko que vende IMPRESA: fotos blancas que se tiñen de cualquier color conservando pliegues y textura.
   Lo usan el diseñador (disena.js) y el catálogo (catalogo.html). Las coordenadas son sobre un lienzo de 800×800. */
const PRENDAS={
  camiseta:{
    nombre:'Camiseta cuello redondo',corto:'Camiseta',
    fotos:{frente:'assets/camisa/frente.png',espalda:'assets/camisa/espalda.png'},
    // zona de impresión en % del lienzo (≈ 8.1 px por cm)
    zonas:{frente:{x:33.75,y:17,w:32.5,h:42},espalda:{x:33.75,y:10,w:32.5,h:46}},
    etiqueta:{x:400,y:51,modelo:null},
    tallasNino:true,
    tecnicas:['DTF','Bordado'],
    material:'algodón',
    // colores de la foto del cliente (2026-11-07); claro = color claro (dato de referencia)
    colores:[['Blanco','#ffffff',1],['Negro','#151515'],['Gris jaspe','#b7b7b9',1],['Gris oscuro','#55575b'],['Azul marino','#1d2340'],['Azul royal','#1f48c4'],['Azul cielo','#7fb4ec',1],['Celeste','#aed0f0',1],['Rojo','#d01c22'],['Vino','#6a1b2b'],['Naranja','#f2541b'],['Amarillo','#f5d931',1],['Rosado','#f3c0d6',1],['Beige','#e3d3bd',1],['Café','#4a3326'],['Verde','#18a23a'],['Verde botella','#1e3b2b']]
  },
  waffit:{
    nombre:'Camisa Waffit (polo)',corto:'Camisa Waffit',
    fotos:{frente:'assets/waffit/frente.png',espalda:'assets/waffit/espalda.png'},
    ribetes:{frente:'assets/waffit/frente-ribete.png',espalda:'assets/waffit/espalda-ribete.png'},
    // frente: logo en el pecho izquierdo (a la derecha en la foto), como se usa en polos
    zonas:{frente:{x:54.6,y:17.5,w:15.2,h:15.2},espalda:{x:33.75,y:11,w:32.5,h:44}},
    etiqueta:{x:400,y:41,modelo:'MEN U-WAFFIT'},
    tallasNino:false,
    tecnicas:['Bordado'], // IMPRESA no hace DTF en Waffit (cliente, 2026-11-07)
    material:'poliéster',
    // catálogo U-Waffit (códigos visibles en la imagen del cliente, 2026-11-07)
    colores:[['Amarillo','#f5c518',1,'W224'],['Vino','#7a1f2b',0,'W203'],['Naranja','#f26a1b',0,'W207'],['Verde','#1f9a45',0,'W211'],['Turquesa','#3fb0e0',0,'W212'],['Gris oscuro','#5a5d63',0,'W217'],['Azul royal','#1e4fc9',0,'W223'],['Beige','#e2cfa8',1,'W230'],['Gris','#8d9096',0,'W233'],['Blanco','#ffffff',1,'W236'],['Negro','#151515',0,'W237'],['Azul marino','#1d2340',0,'W238'],['Rosado','#f3b8cc',1,'W242']]
  }
};
for(const p of Object.values(PRENDAS))p.colores=p.colores.map(([nombre,hex,claro,codigo])=>({nombre,hex,claro:!!claro,codigo:codigo||''}));
const PCT_CM=100*8.1/800;

const _cache={};
function cargarImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
// Luz (0..1) y transparencia de cada píxel, una vez por prenda y lado
async function cargarPrenda(id){if(_cache[id])return _cache[id];const p=PRENDAS[id],out={};
  for(const lado of ['frente','espalda']){const img=await cargarImg(p.fotos[lado]),c=document.createElement('canvas');c.width=c.height=800;const x=c.getContext('2d');x.drawImage(img,0,0,800,800);
    const d=x.getImageData(0,0,800,800).data,l=new Float32Array(640000),a=new Uint8ClampedArray(640000);
    for(let i=0,k=0;k<640000;i+=4,k++){l[k]=(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])/245;a[k]=d[i+3]}
    out[lado]={l,a,ribete:p.ribetes?await cargarImg(p.ribetes[lado]):null}}
  return _cache[id]=out}

// Pinta la camisa en un lienzo de 800×800 (sincrónico; cargarPrenda antes)
function pintarCamisa(ctx,id,lado,hex,talla){const s=_cache[id]?.[lado];if(!s)return;const out=ctx.createImageData(800,800),o=out.data,[r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),lum=(0.299*r+0.587*g+0.114*b)/255,brillo=(1-lum)*30;
  // brillo suave en colores oscuros: con más, el negro se veía gris
  for(let k=0,i=0;k<640000;k++,i+=4){const v=Math.min(1.04,s.l[k]),h=brillo*Math.pow(v,10);o[i]=r*v+h;o[i+1]=g*v+h;o[i+2]=b*v+h;o[i+3]=s.a[k]}
  ctx.putImageData(out,0,0);if(s.ribete)ctx.drawImage(s.ribete,0,0,800,800);
  if(lado==='frente')etiquetaKlasiko(ctx,PRENDAS[id].etiqueta,talla||'M')}

// Etiqueta Klasiko dentro del cuello (aparte, para que no tome el color de la camisa)
function etiquetaKlasiko(ctx,e,talla){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(-0.03);ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor='#0004';ctx.shadowBlur=3;ctx.shadowOffsetY=1;ctx.fillStyle='#fdfdfb';ctx.beginPath();ctx.roundRect(-19,0,38,32,1.5);ctx.fill();ctx.shadowColor='transparent';
  ctx.fillStyle='#1a1a1a';ctx.font='700 8.5px Arial, sans-serif';ctx.fillText('KLASIKO',0,6.5);
  if(e.modelo){ // Waffit: modelo y talla en texto, como la etiqueta real
    ctx.font='600 4.6px Arial, sans-serif';ctx.fillText('MEN',0,13.5);ctx.fillText('U-WAFFIT',0,18.5);ctx.font='700 6px Arial, sans-serif';ctx.fillText(talla,0,26)}
  else{ctx.fillStyle='#e0262b';ctx.beginPath();ctx.arc(0,16.5,6.2,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font=`700 ${talla.length>2?4.8:6.5}px Arial, sans-serif`;ctx.fillText(talla,0,16.8);
    ctx.fillStyle='#555';ctx.font='600 3.3px Arial, sans-serif';ctx.fillText('HECHO EN NICARAGUA',0,25.5);ctx.fillStyle='#8a8a8a';ctx.fillRect(-14,28.2,28,.7)}
  ctx.restore()}
