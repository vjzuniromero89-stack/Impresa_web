// Datos de IMPRESA que se cambian sin tocar el resto del código.
window.IMPRESA = {
  // WhatsApp de IMPRESA: código de país + número, sin + ni espacios
  whatsapp: '50581214068',
  // Supabase del proyecto impresaweb (URL y clave pública). Vacíos = solo WhatsApp.
  supabaseUrl: 'https://hyuxtupnjovjgbflblbx.supabase.co',
  supabaseKey: 'sb_publishable_PdTx9tjzJMzKoTm8tdZpGQ_g1_LpF4x',
  // Precios del diseñador (C$ por camisa). shortcut: valores de muestra; confirmar con IMPRESA
  precios: {
    'Camiseta cuello redondo': { 'DTF': 350, 'Bordado': 420 },
    'Camisa Waffit (polo)': { 'Bordado': 600 },
    'Conjunto (camiseta + legging)': { 'DTF': 750 },
    taza: 200, // taza blanca 11 oz de la tienda (muestra)
    segundoLado: 150, // se suma si lleva diseño adelante y atrás
    // de mayor a menor: a partir de N camisas se multiplica por factor
    descuentos: [{ desde: 24, factor: 0.82 }, { desde: 12, factor: 0.9 }]
  }
};
