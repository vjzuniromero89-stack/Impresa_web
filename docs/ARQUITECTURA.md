# IMPRESA web — Arquitectura

## 1. Resumen
Sitio público de IMPRESA (Nicaragua): servicios, tienda de productos con precio fijo, diseñador de camisas y pedidos **sin pago en línea** (el pedido se guarda y se confirma por WhatsApp). Desde 2026-11-07 suma un **panel de administrador** para cambiar productos y videos sin tocar código, y un **mapa de Managua** con los puntos de entrega donde el cliente recoge su pedido.

## 2. Stack
| Capa | Elección | Por qué |
|---|---|---|
| Páginas | HTML + CSS + JS sin compilar | El sitio ya es estático y pequeño; no hace falta Next.js |
| Datos, login, archivos | Supabase `impresaweb` (`hyuxtupnjovjgbflblbx`) | Postgres + Auth + Storage con permisos (RLS) en la base |
| Cliente Supabase | `@supabase/supabase-js@2.45.4` (UMD, jsDelivr), solo en `admin.html` | Login y subida de archivos; las páginas públicas usan `fetch` a la REST API |
| Mapa | Leaflet 1.9.4 + mapas de OpenStreetMap | Gratis, sin clave de API, se ve y se usa como Google Maps |
| Publicación | GitHub `Impresa_web` → Vercel `impresa-web` | Un push a `main` publica |

## 3. Carpetas
```
index.html  servicios.html  disena.html  tienda.html  galeria.html  nosotros.html
contacto.html  pedido.html  puntos.html (mapa)  admin.html (panel, sin enlace en el menú)
app.js      lógica pública (pedido, diseñador, tienda y videos desde Supabase)
admin.js    lógica del panel
config.js   WhatsApp + URL y clave pública de Supabase
styles.css  estilos compartidos
assets/portada/   fotos recortadas del diseño aprobado
docs/ARQUITECTURA.md  este documento
```

## 4. Modelo de datos
| Tabla | Columnas clave | Público | Administrador |
|---|---|---|---|
| `pedidos` | tipo, nombre, telefono, entrega, items (jsonb), total_estimado, estado | solo crear | leer y cambiar |
| `productos` | nombre, detalle, precio, foto_url, orden, activo | leer los activos | todo |
| `videos` | titulo, portada_url, video_url, orden, activo | leer los activos | todo |
| `puntos_entrega` | nombre, direccion, referencia, lat, lng, horario, orden, activo | leer los activos | todo |
| `admins` | user_id → `auth.users` | nada | nada (se agrega por SQL) |

Storage: `disenos` (logos de clientes; público sube, nadie lista) y `media` (fotos y videos del sitio; todos ven, solo administradores suben o borran; 50 MB por archivo).

## 5. Rutas
- Públicas: todas las páginas. `tienda.html` e `index.html` cargan productos y videos de Supabase; si Supabase no responde, se queda el contenido fijo del HTML.
- `puntos.html`: mapa + lista; «Usar mi ubicación» calcula el punto más cercano en el navegador (la ubicación no se envía a ningún lado); «Elegir este punto» lo deja preseleccionado en Mi pedido.
- `admin.html`: login con correo y contraseña; pestañas Tienda, Videos y Puntos de entrega.

## 6. Permisos
- Rol único: administrador = usuario de Supabase Auth cuyo id está en `admins`.
- La comprobación vive en la base: función `es_admin()` (security definer) usada en cada política RLS y en las de Storage. El panel solo oculta botones; la seguridad real es RLS.
- El administrador se crea en el panel de Supabase (Authentication → Add user) y se añade a `admins` por SQL. Aunque alguien se registre por su cuenta, no puede escribir nada.

## 7. Integraciones
WhatsApp (`wa.me`), OpenStreetMap (atribución obligatoria en el mapa), Google Maps solo como enlace «Cómo llegar». Variables: ninguna secreta; `config.js` solo lleva la clave pública.

## 8. Despliegue
Local: `python -m http.server` (preview `impresa-web`, puerto 4393) contra el Supabase real. Producción: push a `main`.

## 9. Riesgos y decisiones
- **Videos**: el plan gratis de Supabase da 1 GB y 50 MB por archivo. Elegí aceptar archivo **o** enlace de YouTube; para videos largos, YouTube. Lo revisaría si suben muchos videos.
- **Horario**: entendí «llegan a las 12 y hay 2 horas» como recogida de 12:00 m a 2:00 pm; se puede cambiar por punto en el panel.
- Los 4 puntos aún no existen: el mapa muestra «Pronto» hasta que el administrador los agregue.
- Fuera por ahora: ver pedidos dentro del panel (se ven en Supabase → Table Editor), galería editable, varios administradores con roles.

## Diseñador y catálogo (2026-11-07)
- Solo **DTF y Bordado** (cliente, 2026-11-07). Camiseta de algodón: DTF o bordado. Waffit: solo bordado (IMPRESA no hace DTF en Waffit). Técnicas por prenda en `camisas.js` → `tecnicas`.
- Camisas **Klasiko** reales: `camiseta` (cuello redondo, algodón, 17 colores) y `waffit` (polo U-Waffit, 13 colores con código W…). Fotos generadas en blanco (Higgsfield, gpt_image_2_6) sin fondo en `assets/camisa/` y `assets/waffit/`; el ribete gris de la Waffit va en una capa aparte (`*-ribete.png`) para no teñirse.
- `camisas.js` es la única fuente de prendas, colores, zonas de impresión y la etiqueta Klasiko (dibujada en canvas). La usan `disena.js` y `catalogo.html`.
- Teñido: luz de cada píxel × color + brillo en colores oscuros, en canvas 800×800.
- Precios en `config.js` → `precios` por prenda y técnica (valores de muestra hasta que IMPRESA confirme).
- Al agregar al pedido se guarda una vista JPG de la camisa con el diseño; al enviar, se sube a `disenos` junto con los archivos originales.

## 10. Fases
1. Base de datos: tablas, RLS, bucket `media`, datos iniciales (4 productos, 4 videos).
2. Tienda y videos de la portada leen de Supabase.
3. `puntos.html` + selección de punto en Mi pedido.
4. `admin.html`: login, productos, videos, puntos con clic en el mapa.
5. Pruebas en PC y móvil; publicación.

## Galería de ejemplos
Diseños originales de IMPRESA (anime y osos streetwear) generados con Higgsfield sobre verde y recortados (`assets/disenos-anime/`); fotos de ejemplo en `assets/galeria/`. «Pedir esta camisa» abre `disena.html?prenda&color&lado&diseno&dn`; `diseno` solo acepta `assets/disenos-anime/*.png` o el Storage público `media`. No se hacen personajes de franquicias con derechos (p. ej. Dragon Ball) ni logos de marcas (Adidas, Moschino…).

## Catálogo de diseños (2026-11-07)
- Tabla `disenos` (codigo D001…, nombre, categoria, preview_url, archivo, orden, activo); página `disenos.html` con filtro por categoría; «Usar este diseño» → `disena.html?diseno=…&dn=D007`.
- Archivo de impresión: bucket **privado** `impresion` (solo `es_admin()`), PNG sin fondo a 300 DPI (~30–35 cm), ampliado 4x con Real-ESRGAN `realesrgan-x4plus-anime` (`D:\herramientas\realesrgan`). Copia local y scripts en `D:\proyectos\impresa-disenos-impresion`.
- Panel: pestaña Diseños (vista pública + archivo de impresión, descarga con enlace firmado de 10 min); en Pedidos, botón «⬇ D007 para imprimir».
- Carrito: los diseños del cliente se suben a `disenos` al agregarlos (el carrito en localStorage solo guarda el enlace); los del catálogo solo guardan el código.
- El diseñador quita solo los fondos lisos (verde, blanco…) de la imagen del cliente y recorta; botón «Poner fondo» para deshacer.

## Conjunto (2026-11-07)
- Prenda `conjunto` = camiseta + legging, se eligen juntos (mujer o niña), solo DTF. Cada pieza tiene su color.
- Modelo de cuerpo entero en 8 vistas (`assets/modelo/vNNN.jpg` + `vNNN-mascara.png`: R camiseta, G legging, B luz), generadas en verde y magenta para teñir cada pieza. Frente, espalda y legging van sobre la modelo (`pieza:'modelo'`). Zonas con su propia escala (`pct` 0.31 %/cm): pecho, espalda y muslo izquierdo. `piezaDe()`, `zonaDe()`, `pctDe()` y `vistaDe()` en `camisas.js`.
- Precio de muestra en `config.js`: Conjunto DTF C$ 750 (+150 si la camiseta lleva frente y espalda).
- Nota: `img.decode()` se quedaba colgado en algunos navegadores; se usa `cargarImg()` (onload).

## Diseñador (2026-11-07)
- Diseño nuevo = 30 cm o lo más grande que quepa en la zona (`maxCm`). «Elige uno de nuestros diseños» abre la tabla `disenos` en un `<dialog>` dentro de disena.html.
- Giro 360°: una foto por ángulo (`giro` en `PRENDAS`, cada 45°; camiseta y modelo 8, Waffit 6 — faltan 45° y 315°). Arrastrar pasa por las fotos; de 90° a 270° se edita la espalda. En diagonal el diseño se encoge y se corre como sobre un cilindro (`eje` = ancho de la prenda en cada vista); de lado no se ve. El diseño solo se mueve en frente/espalda.
- Fuentes y scripts del giro: `D:\proyectos\impresa-disenos-impresion\giro360` (`procesar.py` corta y alinea; `recorte_brillo.py` para fondos negros con halo).
- Conjunto: botón «Poner también en el legging» copia el diseño al muslo.

## Tienda, Inicio y nombre en la espalda (2026-11-07)
- Galería eliminada: sus 16 camisas son productos en la tabla `productos` (columna `enlace` → abre el diseñador con ese diseño y color). Se borraron los 3 productos viejos.
- Tienda: talla por producto; clic en la foto → `verGrande()` con las flechas recorriendo los 17 colores de camiseta del mismo diseño (dibujado al momento con `camisas.js`), botón «Pedir en este color».
- Inicio: carrusel `#carrusel` con los productos de la tienda (avanza cada 4 s, se detiene al tocarlo, respeta «reducir movimiento»).
- `verGrande(lista, i)` (app.js): vista en grande compartida por Diseños, la ventana de diseños del diseñador y la tienda; `src` puede ser una función.
- Diseñador, paso 05: nombre (y número) en la espalda con 6 letras de Google Fonts (Bebas Neue, Graduate, Bungee, Permanent Marker, Pacifico, Great Vibes), 7 colores y contorno. Se dibuja en canvas; al pedir se sube un PNG a 300 DPI. Cuenta como espalda para el precio.
- Fotos de productos con fondo gris azulado (igual que el diseñador) para que la camiseta blanca se vea; `?v=2` en `foto_url` evita la caché vieja.
