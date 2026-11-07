# Tazas personalizadas

`taza.html` usa el catálogo `disenos` y el carrito existentes. Permite buscar
por nombre, código o categoría, ver distintas secciones de la impresión,
elegir cantidad y guardar una taza en Mi pedido. Todos los diseños activos
pueden usarse en el personalizador; el interruptor `taza` controla si también
aparecen como producto terminado en la tienda.

En el administrador, `precio_taza` cambia el precio por diseño (inicialmente
C$ 200), y `formato_taza` permite elegir `motivo` o `envolvente`. Un motivo
se repite a ambos lados; una plantilla envolvente ocupa 21 × 9,5 cm.
El PNG de pedido tiene 2480 × 1122 píxeles. El trabajador debe imprimirlo
a 21 × 9,5 cm y configurar espejo según su proceso de sublimación.

La tienda y el personalizador comparten `mockupTaza` y `precioTaza` en
`app.js`. Los enlaces guardan el código `dn`, no una dirección arbitraria.
La compra guarda el código original, la plantilla de taza y la vista del
producto; sigue el flujo existente de confirmación por WhatsApp, sin pagos.

Los archivos de impresión del catálogo permanecen en el bucket privado
`impresion`. Las vistas se publican en `media`. Los seis diseños de Navidad
D020–D025 tienen ambos archivos; D020–D022 también se ofrecen en camiseta.

Migración aplicada con Supabase MCP: `mug_price_and_print_layout`.
Añade `precio_taza numeric not null default 200 check (precio_taza >= 0)`
y `formato_taza text not null default 'motivo'` con valores
`motivo`/`envolvente`. No cambia las políticas RLS existentes.

Validación: revisión del flujo en escritorio y móvil con Playwright,
selección de motivo y envolvente, filtros, cantidades, exportación PNG y
carrito. La escritura de una plantilla de prueba se simula para no crear
archivos o pedidos ficticios en producción.
