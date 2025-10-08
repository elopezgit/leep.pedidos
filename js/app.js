// Número de WhatsApp del vendedor
const WHATSAPP_NUMBER = "5493815542592";

// Estado: cart[catId] = { name, spec: { measure, espesor, pack }, items: { "Variante": qty } }
const state = {
  current: { catId: null, catName: "", colorHex: null, colorName: null, measure: "", espesor: "", pack: "" },
  cart: {}
};

const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// Utils
const pad2 = n => String(n).padStart(2,"0");
const fmtDate = d => `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

// Helpers de carrito (set / get / delete)
function ensureCat(catId, catName, measure="", espesor="", pack=""){
  if (!state.cart[catId]) {
    state.cart[catId] = { name: catName, spec: { measure, espesor, pack }, items: {} };
  } else {
    state.cart[catId].name = catName;
    state.cart[catId].spec = { measure, espesor, pack };
  }
  return state.cart[catId];
}
function getQty(catId, colorName){
  return state.cart[catId]?.items?.[colorName] ?? 0;
}
function setQty(catId, catName, colorName, qty, measure="", espesor="", pack=""){
  const cat = ensureCat(catId, catName, measure, espesor, pack);
  if (qty <= 0) {
    delete cat.items[colorName];
    if (Object.keys(cat.items).length === 0) delete state.cart[catId];
  } else {
    cat.items[colorName] = qty;
  }
}

// ---------- Badges en los swatches ----------
function createOrUpdateBadge(container, qty){
  let badge = container.querySelector(".qty-badge");
  if (!badge) {
    badge = document.createElement("em");
    badge.className = "qty-badge";
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
  $$("#colorsGrid .color").forEach(node=>{
    const colorName = node.querySelector("span")?.textContent?.trim() || "";
    const qty = getQty(catId, colorName);
    createOrUpdateBadge(node, qty);
    node.dataset.selected = qty > 0 ? "true" : node.dataset.selected;
  });
}

// ---------- Render de colores desde el botón de categoría ----------
function renderColorsFromButton(btn){
  const catId   = btn.dataset.catId;
  const catName = btn.dataset.catName;
  // ✅ FIX: leer data-medida como dataset.medida
  const measure = btn.dataset.medida || "";
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
    const node = document.createElement("button");
    node.className = "color";
    node.type = "button";
    node.setAttribute("aria-label", `${catName} - ${c.name}`);
    node.dataset.selected = "false";

    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.background = c.hex || "#d0d6e0";

    const tag = document.createElement("span");
    tag.textContent = c.name;

    node.append(dot, tag);

    node.addEventListener("click", ()=>{
      $$(".color").forEach(n=>n.dataset.selected="false");
      node.dataset.selected = "true";

      state.current.colorHex = c.hex;
      state.current.colorName = c.name;

      const prev = getQty(catId, c.name);
      $("#qty").value = Math.max(1, Number(prev || 1));

      $("#btnAdd").disabled = false;

      const parts = [];
      if (measure) parts.push(`Medida: ${measure}`);
      if (espesor) parts.push(`Espesor: ${espesor}`);
      if (pack)    parts.push(pack);
      const meta = parts.length ? ` (${parts.join(" · ")})` : "";
      $("#hint").textContent = `Seleccionado: ${catName}${meta} / ${c.name}. Modificá la cantidad y presioná “Agregar”.`;
    });

    grid.appendChild(node);
  });

  const parts = [];
  if (measure) parts.push(`Medida: ${measure}`);
  if (espesor) parts.push(`Espesor: ${espesor}`);
  if (pack)    parts.push(pack);
  const meta = parts.length ? ` (${parts.join(" · ")})` : "";

  $("#btnAdd").disabled = true;
  $("#hint").textContent = `Categoría: ${catName}${meta}. Elegí un color/variante.`;
  $("#qty").value = 1;

  updateColorBadges(catId);
}

// Reemplaza la cantidad (no suma)
function addCurrentToCart(){
  const { catId, catName, colorName, measure, espesor, pack } = state.current;
  if (!catId || !colorName) return;

  const qty = Math.max(0, Number($("#qty").value || 0)); // 0 elimina
  setQty(catId, catName, colorName, qty, measure, espesor, pack);

  const saved = getQty(catId, colorName);
  $("#qty").value = saved ? saved : 1;

  if (saved === 0) {
    $("#hint").textContent = `Se eliminó ${catName} / ${colorName} de la consulta.`;
    $$("#colorsGrid .color").forEach(n=>{
      if (n.querySelector("span")?.textContent?.trim() === colorName) n.dataset.selected="false";
    });
    $("#btnAdd").disabled = true;
  } else {
    $("#hint").textContent = `Guardado: ${catName} / ${colorName} = ${saved} u.`;
  }

  updateColorBadges(catId);
  rebuildResume();
}

// Construye el texto del presupuesto desde el estado (con Medida/Espesor/Pack)
function rebuildResume(){
  const lines = [];
  lines.push("*Consulta de presupuesto* 🧾");
  lines.push(`Fecha: ${fmtDate(new Date())}`);
  lines.push("");
  lines.push("*Pedido detallado (por categoría):*");

  let total = 0;

  const cats = Object.entries(state.cart)
    .map(([catId, data]) => ({ catId, name: data.name, items: data.items, spec: data.spec || {} }))
    .sort((a,b)=> a.name.localeCompare(b.name));

  cats.forEach(({name, items, spec})=>{
    lines.push(`- ${name}`);

    const specParts = [];
    if (spec.measure) specParts.push(`Medida: ${spec.measure}`);
    if (spec.espesor) specParts.push(`Espesor: ${spec.espesor}`);
    if (spec.pack)    specParts.push(spec.pack);
    if (specParts.length) lines.push(`  ${specParts.join(" • ")}`);

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
  $$("#colorsGrid .color").forEach(n=>n.dataset.selected="false");
  $("#qty").value = 1;
  $("#btnAdd").disabled = true;
  $$("#colorsGrid .color").forEach(n=>createOrUpdateBadge(n, 0));
}

// Eventos
document.addEventListener("DOMContentLoaded", ()=>{
  $("#year").textContent = new Date().getFullYear();

  $$("#categoryButtons .cat-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> renderColorsFromButton(btn));
  });

  $("#btnAdd").addEventListener("click", addCurrentToCart);

  $("#qty").addEventListener("change", ()=>{
    const { catId, catName, colorName, measure, espesor, pack } = state.current;
    if (catId && colorName){
      const q = Math.max(0, Number($("#qty").value||0));
      setQty(catId, catName, colorName, q, measure, espesor, pack);
      updateColorBadges(catId);
      rebuildResume();
    }
  });

  $("#btnWhatsApp").addEventListener("click", sendWhatsApp);
  $("#btnClear").addEventListener("click", clearAll);

  $("#hint").textContent = "Elegí una categoría para ver colores disponibles.";
});
