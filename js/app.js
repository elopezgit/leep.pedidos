// Número de WhatsApp del vendedor
const WHATSAPP_NUMBER = "5493815542592";

// Estado: guardamos por catId -> { name, items: { [colorName]: qty } }
const state = {
  current: { catId: null, catName: "", colorHex: null, colorName: null, measure: "", espesor: "", pack: "" },
  cart: {} // cart[catId] = { name: "Goma EVA Lisa", items: { "Blanco": 10, "Azul": 5 } }
};

const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// Utils
const pad2 = n => String(n).padStart(2,"0");
const fmtDate = d => `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

// Helpers de carrito (set / get / delete)
function ensureCat(catId, catName){
  if (!state.cart[catId]) state.cart[catId] = { name: catName, items: {} };
  return state.cart[catId];
}
function getQty(catId, colorName){
  return state.cart[catId]?.items?.[colorName] ?? 0;
}
function setQty(catId, catName, colorName, qty){
  const cat = ensureCat(catId, catName);
  if (qty <= 0) {
    delete cat.items[colorName];
    if (Object.keys(cat.items).length === 0) delete state.cart[catId];
  } else {
    cat.items[colorName] = qty;
  }
}

// ---------- Badges en los swatches ----------
function createOrUpdateBadge(container, qty){
  // container es el botón .color; el círculo es .dot
  let badge = container.querySelector(".qty-badge");
  if (!badge) {
    badge = document.createElement("em");
    badge.className = "qty-badge";
    // anclar sobre el dot
    const dot = container.querySelector(".dot");
    dot.style.position = "relative";
    dot.appendChild(badge);
  }
  if (qty > 0) {
    badge.textContent = qty;
    badge.style.visibility = "visible";
  } else {
    badge.textContent = "";
    badge.style.visibility = "hidden";
  }
}

function updateColorBadges(catId){
  // Revisa todos los .color visibles (grid actual) y actualiza su badge con la qty guardada
  $$("#colorsGrid .color").forEach(node=>{
    const colorName = node.querySelector("span")?.textContent?.trim() || "";
    const qty = getQty(catId, colorName);
    createOrUpdateBadge(node, qty);
    // si hay qty, marcamos seleccionado “suave”
    node.dataset.selected = qty > 0 ? "true" : node.dataset.selected;
  });
}

// ---------- Render de colores desde el botón de categoría ----------
function renderColorsFromButton(btn){
  const catId   = btn.dataset.catId;
  const catName = btn.dataset.catName;
  const measure = btn.dataset.measure || "";
  const espesor = btn.dataset.espesor || "";
  const pack    = btn.dataset.pack || "";

  const colorsRaw = (btn.dataset.colors || "").split(",").map(s=>s.trim()).filter(Boolean);
  const colors = colorsRaw.map(pair=>{
    const [hex,name] = pair.split(":");
    return {hex: (hex||"").trim(), name: (name||hex||"").trim()};
  });

  state.current = { catId, catName, colorHex:null, colorName:null, measure, espesor, pack };

  const grid = $("#colorsGrid");
  grid.innerHTML = "";

  colors.forEach(c=>{
    // Botón contenedor
    const node = document.createElement("button");
    node.className = "color";
    node.type = "button";
    node.setAttribute("aria-label", `${catName} - ${c.name}`);
    node.dataset.selected = "false";

    // Círculo de color
    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.background = c.hex || "#d0d6e0";

    // Etiqueta debajo
    const tag = document.createElement("span");
    tag.textContent = c.name;

    node.append(dot, tag);

    node.addEventListener("click", ()=>{
      // Deselecciona los demás
      $$(".color").forEach(n=>n.dataset.selected="false");
      node.dataset.selected = "true";

      // Estado actual
      state.current.colorHex = c.hex;
      state.current.colorName = c.name;

      // Prefill con lo guardado
      const prev = getQty(catId, c.name);
      $("#qty").value = Math.max(1, Number(prev || 1));

      $("#btnAdd").disabled = false;

      // Hint con especificaciones
      const parts = [];
      if (measure) parts.push(`Medida: ${measure}`);
      if (espesor) parts.push(`Espesor: ${espesor}`);
      if (pack)    parts.push(`Pack: ${pack}`);
      const meta = parts.length ? ` (${parts.join(" · ")})` : "";
      $("#hint").textContent = `Seleccionado: ${catName}${meta} / ${c.name}. Modificá la cantidad y presioná “Agregar”.`;
    });

    grid.appendChild(node);
  });

  // Mostrar especificaciones generales, si existen
  const parts = [];
  if (measure) parts.push(`Medida: ${measure}`);
  if (espesor) parts.push(`Espesor: ${espesor}`);
  if (pack)    parts.push(`Pack: ${pack}`);
  const meta = parts.length ? ` (${parts.join(" · ")})` : "";

  // Reset de la UI del panel
  $("#btnAdd").disabled = true;
  $("#hint").textContent = `Categoría: ${catName}${meta}. Elegí un color/variante.`;
  $("#qty").value = 1;

  // Inicializar badges con cantidades ya guardadas (si el usuario vuelve a esta categoría)
  updateColorBadges(catId);
}

// Reemplaza la cantidad (no suma)
function addCurrentToCart(){
  const { catId, catName, colorName } = state.current;
  if (!catId || !colorName) return;

  const qty = Math.max(0, Number($("#qty").value || 0)); // 0 elimina
  setQty(catId, catName, colorName, qty);

  // Mantener seleccionado el color y dejar el input con el valor guardado
  const saved = getQty(catId, colorName);
  $("#qty").value = saved ? saved : 1;

  if (saved === 0) {
    $("#hint").textContent = `Se eliminó ${catName} / ${colorName} de la consulta.`;
    // Quitar highlight visual si se borró
    $$("#colorsGrid .color").forEach(n=>{
      if (n.querySelector("span")?.textContent?.trim() === colorName) n.dataset.selected="false";
    });
    $("#btnAdd").disabled = true;
  } else {
    $("#hint").textContent = `Guardado: ${catName} / ${colorName} = ${saved} u.`;
  }

  // Actualizar badges en los swatches
  updateColorBadges(catId);

  // Reconstruir resumen
  rebuildResume();
}

// Construye el texto del presupuesto desde el estado
function rebuildResume(){
  const lines = [];
  lines.push("*Consulta de presupuesto* 🧾");
  lines.push(`Fecha: ${fmtDate(new Date())}`);
  lines.push("");
  lines.push("*Pedido detallado (por categoría):*");

  let total = 0;
  // Ordenar por nombre de categoría
  const cats = Object.entries(state.cart)
    .map(([catId, data]) => ({ catId, name: data.name, items: data.items }))
    .sort((a,b)=> a.name.localeCompare(b.name));

  cats.forEach(({name, items})=>{
    lines.push(`- ${name}`);
    // Ordenar ítems por nombre (variante)
    const itemPairs = Object.entries(items).sort((a,b)=> a[0].localeCompare(b[0]));
    itemPairs.forEach(([colorName, qty])=>{
      total += Number(qty||0);
      lines.push(`  • ${colorName}: ${qty} u.`);
    });
    lines.push("");
  });

  lines.push(`*Total de ítems:* ${total}`);
  lines.push("");
  lines.push("Datos del solicitante:");
  lines.push(`Nombre y apellido: {completar}`);
  lines.push(`Correo: {opcional}`);

  $("#resumeText").value = lines.join("\n");
}

// Enviar por WhatsApp
function sendWhatsApp(){
  if (!Object.keys(state.cart).length){
    alert("Tu consulta está vacía. Agregá al menos un producto."); 
    return;
  }
  const name = ($("#inpName").value||"").trim();
  if (!name){ alert("Completá tu nombre y apellido."); return; }
  const email = ($("#inpEmail").value||"").trim();

  const base = $("#resumeText").value
    .replace("Nombre y apellido: {completar}", `Nombre y apellido: ${name}`)
    .replace("Correo: {opcional}", `Correo: ${email || "-"}`);

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(base)}`;
  window.open(url, "_blank");
}

// Vaciar todo
function clearAll(){
  state.cart = {};
  $("#resumeText").value = "";
  $("#inpName").value = "";
  $("#inpEmail").value = "";
  $("#hint").textContent = "Elegí una categoría y luego un color para comenzar.";
  // Reset visual del panel
  $$("#colorsGrid .color").forEach(n=>n.dataset.selected="false");
  $("#qty").value = 1;
  $("#btnAdd").disabled = true;
  // Borro badges visibles
  $$("#colorsGrid .color").forEach(n=>createOrUpdateBadge(n, 0));
}

// Eventos
document.addEventListener("DOMContentLoaded", ()=>{
  $("#year").textContent = new Date().getFullYear();

  // Botones de categoría
  $$("#categoryButtons .cat-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> renderColorsFromButton(btn));
  });

  // Agregar (reemplaza)
  $("#btnAdd").addEventListener("click", addCurrentToCart);

  // Si cambia cantidad y hay color seleccionado, guardamos al vuelo y refrescamos badge
  $("#qty").addEventListener("change", ()=>{
    const { catId, catName, colorName } = state.current;
    if (catId && colorName){
      const q = Math.max(0, Number($("#qty").value||0));
      setQty(catId, catName, colorName, q);
      updateColorBadges(catId);
      rebuildResume();
    }
  });

  // WhatsApp y Vaciar
  $("#btnWhatsApp").addEventListener("click", sendWhatsApp);
  $("#btnClear").addEventListener("click", clearAll);

  // Hint inicial
  $("#hint").textContent = "Elegí una categoría para ver colores disponibles.";
});
