// catalogStore.js
// Dataset de ejemplo. Reemplazalo cuando tengas el catálogo final.
(function (global) {
  const catalog = {
    categories: [
      {
        id: "goma-eva-lisa",
        name: "Goma EVA Lisa",
        meta: { medida: "40x60 cm", espesor: "1.5 mm", pack: "x10u" },
        items: [
          { id: "gel-amarillo", name: "Amarillo" },
          { id: "gel-rojo", name: "Rojo" },
          { id: "gel-azul", name: "Azul" },
          { id: "gel-verde-manzana", name: "Verde manzana" },
          { id: "gel-negro", name: "Negro" },
          { id: "gel-blanco", name: "Blanco" }
        ]
      },
      {
        id: "goma-eva-glitter",
        name: "Goma EVA Glitter",
        meta: { medida: "40x60 cm", espesor: "1.7 mm", pack: "x10u" },
        items: [
          { id: "geg-plata", name: "Plata" },
          { id: "geg-dorado", name: "Dorado" },
          { id: "geg-rosa", name: "Rosa" },
          { id: "geg-fucsia", name: "Fucsia" },
          { id: "geg-negro", name: "Negro" }
        ]
      },
      {
        id: "papel-crepe",
        name: "Papel Crepé",
        meta: { medida: "50x200 cm", pack: "x10u" },
        items: [
          { id: "pc-amarillo", name: "Amarillo" },
          { id: "pc-naranja", name: "Naranja" },
          { id: "pc-azul", name: "Azul" },
          { id: "pc-celeste", name: "Celeste" },
          { id: "pc-violeta", name: "Violeta" }
        ]
      }
    ]
  };

  function getCatalog() { return catalog; }

  global.CatalogStore = { getCatalog };
})(window);
