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
  },
  // pieza del conjunto (no se vende sola en el diseñador)
  legging:{
    nombre:'Legging',corto:'Legging',
    colores:[] // los mismos 17 de la camiseta (cliente, 2026-11-07)
  },
  // Conjunto = camiseta + legging, se eligen juntos (cliente, 2026-11-07)
  // modelo con camiseta (arriba) y legging (abajo): una foto, dos telas que se tiñen por separado
  modelo:{
    nombre:'Conjunto en modelo',corto:'Conjunto',
    modelo:{base:'assets/modelo/base.jpg',mascara:'assets/modelo/mascara.png'},
    // pct = % del lienzo por cm (la modelo se ve más chica que la camiseta sola: ≈0.5 %/cm)
    zonas:{frente:{x:39,y:11,w:21,h:19,pct:0.5},legging:{x:51.5,y:45,w:10,h:16,pct:0.5}}, // legging: muslo izquierdo de quien lo usa
    etiqueta:null,colores:[]
  },
  conjunto:{
    nombre:'Conjunto (camiseta + legging)',corto:'Conjunto',
    piezas:{frente:'modelo',espalda:'camiseta',legging:'modelo'},
    tallasNino:true,soloMujer:true,
    tecnicas:['DTF'],
    colores:[]
  }
};
PRENDAS.conjunto.colores=PRENDAS.legging.colores=PRENDAS.camiseta.colores;
for(const p of Object.values(PRENDAS))if(p.colores.length&&Array.isArray(p.colores[0]))p.colores=p.colores.map(([nombre,hex,claro,codigo])=>({nombre,hex,claro:!!claro,codigo:codigo||''}));
const PCT_CM=100*8.1/800;

const _cache={};
function cargarImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
// Luz (0..1) y transparencia de cada píxel, una vez por prenda y lado
const piezaDe=(id,lado)=>PRENDAS[id].piezas?.[lado]||id;
const zonaDe=(id,lado)=>PRENDAS[piezaDe(id,lado)].zonas[lado];
const pctDe=(id,lado)=>zonaDe(id,lado).pct||PCT_CM;
async function cargarPrenda(id){if(_cache[id])return _cache[id];const p=PRENDAS[id],out={};
  if(p.piezas){for(const pz of new Set(Object.values(p.piezas)))await cargarPrenda(pz);return _cache[id]=true}
  if(p.modelo){const px=async src=>{const img=await cargarImg(src),c=document.createElement('canvas');c.width=c.height=800;const x=c.getContext('2d');x.drawImage(img,0,0,800,800);return x.getImageData(0,0,800,800).data};
    const m={base:await px(p.modelo.base),mask:await px(p.modelo.mascara)};return _cache[id]={frente:{modelo:m},legging:{modelo:m}}}
  for(const lado of Object.keys(p.fotos)){const img=await cargarImg(p.fotos[lado]),c=document.createElement('canvas');c.width=c.height=800;const x=c.getContext('2d');x.drawImage(img,0,0,800,800);
    const d=x.getImageData(0,0,800,800).data,l=new Float32Array(640000),a=new Uint8ClampedArray(640000);
    for(let i=0,k=0;k<640000;i+=4,k++){l[k]=(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])/245;a[k]=d[i+3]}
    out[lado]={l,a,ribete:p.ribetes?await cargarImg(p.ribetes[lado]):null}}
  return _cache[id]=out}

// Pinta la camisa en un lienzo de 800×800 (sincrónico; cargarPrenda antes)
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
// hex2 = color del legging (solo en la modelo)
function pintarCamisa(ctx,id,lado,hex,talla,hex2='#151515'){id=piezaDe(id,lado);const s=_cache[id]?.[lado];if(!s)return;
  if(s.modelo){const out=ctx.createImageData(800,800),o=out.data,B=s.modelo.base,M=s.modelo.mask,c1=rgb(hex),c2=rgb(hex2),
      br=c=>(1-(0.299*c[0]+0.587*c[1]+0.114*c[2])/255)*30,b1=br(c1),b2=br(c2);
    for(let i=0;i<2560000;i+=4){const wc=M[i]/255,wl=M[i+1]/255,v=Math.min(1.04,M[i+2]/255*1.1),h=Math.pow(v,10),wb=Math.max(0,1-wc-wl);
      for(let ch=0;ch<3;ch++)o[i+ch]=B[i+ch]*wb+(c1[ch]*v+b1*h)*wc+(c2[ch]*v+b2*h)*wl;o[i+3]=255}
    ctx.putImageData(out,0,0);return}const out=ctx.createImageData(800,800),o=out.data,[r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),lum=(0.299*r+0.587*g+0.114*b)/255,brillo=(1-lum)*30;
  // brillo suave en colores oscuros: con más, el negro se veía gris
  for(let k=0,i=0;k<640000;k++,i+=4){const v=Math.min(1.04,s.l[k]),h=brillo*Math.pow(v,10);o[i]=r*v+h;o[i+1]=g*v+h;o[i+2]=b*v+h;o[i+3]=s.a[k]}
  ctx.putImageData(out,0,0);if(s.ribete)ctx.drawImage(s.ribete,0,0,800,800);
  if(lado==='frente'&&PRENDAS[id].etiqueta)etiquetaKlasiko(ctx,PRENDAS[id].etiqueta,talla||'M')}

// Etiqueta Klasiko dentro del cuello (aparte, para que no tome el color de la camisa)
function etiquetaKlasiko(ctx,e,talla){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(-0.03);ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor='#0004';ctx.shadowBlur=3;ctx.shadowOffsetY=1;ctx.fillStyle='#fdfdfb';ctx.beginPath();ctx.roundRect(-19,0,38,32,1.5);ctx.fill();ctx.shadowColor='transparent';
  ctx.fillStyle='#1a1a1a';ctx.font='700 8.5px Arial, sans-serif';ctx.fillText('KLASIKO',0,6.5);
  if(e.modelo){ // Waffit: modelo y talla en texto, como la etiqueta real
    ctx.font='600 4.6px Arial, sans-serif';ctx.fillText('MEN',0,13.5);ctx.fillText('U-WAFFIT',0,18.5);ctx.font='700 6px Arial, sans-serif';ctx.fillText(talla,0,26)}
  else{ctx.fillStyle='#e0262b';ctx.beginPath();ctx.arc(0,16.5,6.2,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font=`700 ${talla.length>2?4.8:6.5}px Arial, sans-serif`;ctx.fillText(talla,0,16.8);
    ctx.fillStyle='#555';ctx.font='600 3.3px Arial, sans-serif';ctx.fillText('HECHO EN NICARAGUA',0,25.5);ctx.fillStyle='#8a8a8a';ctx.fillRect(-14,28.2,28,.7)}
  ctx.restore()}
