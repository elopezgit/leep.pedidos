// Catálogo basado en el PDF 2025 (formatos, packs y colores). :contentReference[oaicite:3]{index=3}
const CatalogStore = (() => {
  /** Utilidad para generar códigos legibles y únicos */
  const code = (prefix, slug) => `${prefix}-${slug}`.toUpperCase();

  /** Paleta tentativa para swatches (fallback si un color no tiene HEX exacto).
   *  Se puede mapear a HEX corporativos si el proveedor los comparte. */
  const COLOR_HEX = {
    "Amarillo":"#f2cf00",
    "Naranja":"#f7931a",
    "Rojo":"#e84545",
    "Rosa":"#ff6fb5",
    "Fucsia":"#ff2e83",
    "Lila":"#c29ffa",
    "Violeta":"#7d3cff",
    "Celeste":"#8fd3ff",
    "Azul":"#1f6feb",
    "Verde manzana":"#7ed957",
    "Verde medio":"#39a845",
    "Verde oscuro":"#206a2e",
    "Turquesa":"#00c1b5",
    "Verde aguamarina":"#5cd6c0",
    "Marrón":"#7b4b3a",
    "Piel":"#f0c7a3",
    "Negro":"#111111",
    "Blanco":"#f5f7fb",
    "Dorado":"#caa648",
    "Champagne":"#e5d0a6",
    "Plata":"#d7d7d7",
    "Iridiscente":"#d5e1ff"
  };

  // Ayuda para crear variantes de color (incluye alias "iridiscente" donde aplique)
  const color = (name) => ({
    name,
    hex: COLOR_HEX[name] || "#cccccc",
    variant: name
  });

  /** Catálogo normalizado */
  const CATALOG = [
    {
      category: "Goma Eva Lisa",
      prefix: "GEL",
      spec: { medida: "40x60 cm", espesor: "1,5 mm", pack: "Pack x10u" },
      items: [
        "Amarillo","Naranja","Rojo","Rosa","Fucsia","Lila","Violeta",
        "Celeste","Azul","Verde manzana","Verde medio","Verde oscuro",
        "Piel","Marrón","Negro","Blanco"
      ].map(c => ({
        code: code("GEL", c.replace(/\s+/g,'-')),
        name: "Goma Eva Lisa",
        variant: color(c)
      }))
    },
    {
      category: "Goma Eva Glitter",
      prefix: "GEG",
      spec: { medida: "40x60 cm", espesor: "1,7 mm", pack: "Pack x10u" },
      items: [
        "Plata","Blanco","Negro","Dorado","Marron","Champagne","Azul",
        "Celeste","Turquesa","Verde aguamarina","Verde manzana iridiscente",
        "Verde medio","Verde oscuro","Rosa iridiscente","Rosa","Fucsia",
        "Lila iridiscente","Lila","Violeta","Rojo","Naranja","Naranja iridiscente","Amarillo"
      ].map(raw => {
        const irid = /iridiscente/i.test(raw);
        const base = raw.replace(/\s+iridiscente/i,'');
        return {
          code: code("GEG", raw.replace(/\s+/g,'-')),
          name: "Goma Eva Glitter",
          variant: {
            name: irid ? `${base} (iridiscente)` : base,
            hex: COLOR_HEX[base] || COLOR_HEX["Iridiscente"] || "#cccccc",
            variant: irid ? "Iridiscente" : "Glitter"
          }
        };
      })
    },
    {
      category: "Goma Eva Arcoíris",
      prefix: "GEA",
      spec: { medida: "40x60 cm", espesor: "2 mm", pack: "Pack x10u" },
      items: [
        { code: code("GEA","ARCOIRIS"), name:"Goma Eva Arcoíris", variant:{ name:"Arcoíris", hex:"#ffe27a", variant:"Arcoíris" } }
      ]
    },
    {
      category: "Goma Eva Toalla",
      prefix: "GET",
      spec: { medida: "40x60 cm", espesor: "2 mm", pack: "Pack x10u" },
      items: [
        "Amarillo","Naranja","Rojo","Rosa","Fucsia","Lila","Violeta",
        "Celeste","Azul","Verde manzana","Verde oscuro","Piel","Marrón","Negro","Blanco"
      ].map(c => ({
        code: code("GET", c.replace(/\s+/g,'-')),
        name: "Goma Eva Toalla",
        variant: color(c)
      }))
    },
    {
      category: "Papel Crepé",
      prefix: "PCR",
      spec: { medida: "50x200 cm", espesor: null, pack: "Pack x10u" },
      items: [
        "Amarillo","Naranja","Rojo","Rosa","Fucsia","Lila","Violeta",
        "Celeste","Azul","Verde manzana","Verde medio","Verde oscuro",
        "Marrón","Negro","Blanco"
      ].map(c => ({
        code: code("PCR", c.replace(/\s+/g,'-')),
        name: "Papel Crepé",
        variant: color(c)
      }))
    }
  ];

  function getAll() { return CATALOG; }
  function getCategories() { return CATALOG.map(c => c.category); }

  return { getAll, getCategories };
})();
