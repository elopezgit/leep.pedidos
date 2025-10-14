// WhatsApp del vendedor
const WHATSAPP_NUMBER = "5493815542592";

// Estado global
const state = {
  current: { catId:null, catName:"", colorHex:null, colorName:null, measure:"", espesor:"", pack:"", image:"" },
  cart: {} // cart[catId] = { name, spec:{measure,espesor,pack}, items:{ variante: qty } }
};

const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

const pad2 = n => String(n).padStart(2,"0");
const fmtDate = d => `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

// ---- Carrito
function ensureCat(catId, catName, measure="", espesor="", pack=""){
  if (!state.cart[catId]) state.cart[catId] = { name:catName, spec:{measure, espesor, pack}, items:{} };
  else { state.cart[catId].name = catName; state.cart[catId].spec = {measure, espesor, pack}; }
  return state.cart[catId];
}
const getQty = (catId, colorName) => state.cart[catId]?.items?.[colorName] ?? 0;
function setQty(catId, catName, colorName, qty, measure="", espesor="", pack=""){
  const cat = ensureCat(catId, catName, measure, espesor, pack);
  if (qty <= 0){ delete cat.items[colorName]; if (!Object.keys(cat.items).length) delete state.cart[catId]; }
  else { cat.items[colorName] = qty; }
}

// ---- Swatch: color o imagen ({img} usa data-image de la categoría)
function setDotBackground(dot, token){
  if (!dot) return;
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(token || "");
  if (isHex){
    dot.style.background = token;
    dot.style.backgroundImage = "none";
    return;
  }
  let url = "";
  if (!token || token === "{img}") url = state.current.image || "";
  else url = token; // también podés poner ruta directa por variante

  dot.style.background = url
    ? `center / cover no-repeat url('${url}')`
    : "#d0d6e0";
}

// ---- Badges
function createOrUpdateBadge(container, qty){
  if (!container) return;
  let badge = container.querySelector(".qty-badge");
  const dot = container.querySelector(".dot");
  if (!dot) return;

  if (!badge){
    badge = document.createElement("em");
    badge.className = "qty-badge";
    dot.appendChild(badge);
  }
  badge.textContent = qty > 0 ? qty : "";
  badge.style.visibility = qty > 0 ? "visible" : "hidden";
}
function updateColorBadges(catId){
  $$("#colorsGrid .color").forEach(n=>{
    const name = n.querySelector("span")?.textContent?.trim() || "";
    const q = getQty(catId, name);
    createOrUpdateBadge(n, q);
    if (q>0) n.dataset.selected="true";
  });
}

// ---- Utils
function parseColorsAttr(str){
  // acepta comas y saltos de línea para separar ítems
  return (str || "")
    .split(/,(?![^"]*")|\n/g)
    .map(s=>s.trim())
    .filter(Boolean)
    .map(pair=>{
      const [token,label] = pair.split(":");
      return { token:(token||"").trim(), label:(label||token||"").trim() };
    });
}

// ---- Render
function renderColorsFromButton(btn){
  if (!btn) return;

  const catId   = btn.dataset.catId;
  const catName = btn.dataset.catName;
  const measure = btn.dataset.medida || "";
  const espesor = btn.dataset.espesor || "";
  const pack    = btn.dataset.pack || "";
  const image   = btn.dataset.image || "";

  state.current = { catId, catName, colorHex:null, colorName:null, measure, espesor, pack, image };

  // Imagen circular en la card
  const card = $("#productCard");
  const img  = $("#productImg");
  if (card && img){
    if (image){ img.src = image; img.alt = catName || ""; card.style.display = "flex"; }
    else { img.removeAttribute("src"); img.alt = ""; card.style.display = "none"; }
  }

  // Construcción de swatches
  const colors = parseColorsAttr(btn.dataset.colors);
  const grid = $("#colorsGrid");
  if (grid) grid.innerHTML = "";

  colors.forEach(c=>{
    const node = document.createElement("button");
    node.type="button"; node.className="color"; node.dataset.selected="false";
    node.setAttribute("aria-label", `${catName} - ${c.label}`);

    const dot = document.createElement("div");
    dot.className = "dot";
    setDotBackground(dot, c.token);

    const tag = document.createElement("span");
    tag.textContent = c.label;

    node.append(dot, tag);

    node.addEventListener("click", ()=>{
      $$(".color").forEach(n=>n.dataset.selected="false");
      node.dataset.selected = "true";
      state.current.colorHex = c.token;
      state.current.colorName = c.label;

      const prev = getQty(catId, c.label);
      const qtyInput = $("#qty");
      if (qtyInput) qtyInput.value = Math.max(1, Number(prev || 1));

      const btnAdd = $("#btnAdd");
      if (btnAdd) btnAdd.disabled = false;

      const p=[]; if (measure) p.push(`Medida: ${measure}`); if (espesor) p.push(`Espesor: ${espesor}`); if (pack) p.push(pack);
      const hint = $("#hint");
      if (hint) hint.textContent = `Seleccionado: ${catName}${p.length?` (${p.join(" · ")})`:""} / ${c.label}. Modificá la cantidad y presioná “Agregar”.`;
    });

    grid.appendChild(node);
  });

  const btnAdd = $("#btnAdd"); if (btnAdd) btnAdd.disabled = true;
  const qtyInput = $("#qty"); if (qtyInput) qtyInput.value = 1;

  const spec=[]; if (measure) spec.push(`Medida: ${measure}`); if (espesor) spec.push(`Espesor: ${espesor}`); if (pack) spec.push(pack);
  const hint = $("#hint");
  if (hint) hint.textContent = `Categoría: ${catName}${spec.length?` (${spec.join(" · ")})`:""}. Elegí un color/variante.`;

  updateColorBadges(catId);
}

// ---- Agregar / actualizar
function addCurrentToCart(){
  const { catId, catName, colorName, measure, espesor, pack } = state.current;
  if (!catId || !colorName) return;
  const qtyInput = $("#qty");
  const qty = Math.max(0, Number(qtyInput?.value || 0));
  setQty(catId, catName, colorName, qty, measure, espesor, pack);

  const saved = getQty(catId, colorName);
  if (qtyInput) qtyInput.value = saved ? saved : 1;

  const hint = $("#hint");
  if (hint){
    hint.textContent = saved === 0
      ? `Se eliminó ${catName} / ${colorName} de la consulta.`
      : `Guardado: ${catName} / ${colorName} = ${saved} u.`;
  }

  if (saved === 0){
    $$("#colorsGrid .color").forEach(n=>{
      if (n.querySelector("span")?.textContent?.trim()===colorName) n.dataset.selected="false";
    });
    const btnAdd = $("#btnAdd");
    if (btnAdd) btnAdd.disabled = true;
  }
  updateColorBadges(catId);
  rebuildResume();
}

// ---- Resumen
function rebuildResume(){
  const lines = [];
  lines.push("*Consulta de presupuesto* 🧾");
  lines.push(`Fecha: ${fmtDate(new Date())}`);
  lines.push("");
  lines.push("*Pedido detallado (por categoría):*");

  let total = 0;
  const cats = Object.entries(state.cart)
    .map(([_, data])=>({name:data.name, items:data.items, spec:data.spec||{}}))
    .sort((a,b)=>a.name.localeCompare(b.name));

  cats.forEach(({name, items, spec})=>{
    lines.push(`- ${name}`);
    const sp=[]; if (spec.measure) sp.push(`Medida: ${spec.measure}`); if (spec.espesor) sp.push(`Espesor: ${spec.espesor}`); if (spec.pack) sp.push(spec.pack);
    if (sp.length) lines.push(`  ${sp.join(" • ")}`);
    Object.entries(items).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([v,q])=>{
      total += Number(q||0);
      lines.push(`  • ${v}: ${q} u.`);
    });
    lines.push("");
  });

  lines.push(`*Total de ítems:* ${total}`);
  lines.push("");
  lines.push("Datos del solicitante:");
  lines.push("Nombre y apellido: {completar}");
  lines.push("Correo: {opcional}");

  const ta = $("#resumeText");
  if (ta) ta.value = lines.join("\n");
}

// ---- WhatsApp
function sendWhatsApp(){
  if (!Object.keys(state.cart).length){ alert("Tu consulta está vacía. Agregá al menos un producto."); return; }
  const name = ($("#inpName").value||"").trim();
  if (!name){ alert("Completá tu nombre y apellido."); return; }
  const email = ($("#inpEmail").value||"").trim();

  const msg = $("#resumeText").value
    .replace("Nombre y apellido: {completar}", `Nombre y apellido: ${name}`)
    .replace("Correo: {opcional}", `Correo: ${email || "-"}`);

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank");
}

// ---- Limpiar
function clearAll(){
  state.cart = {};
  const ta = $("#resumeText"); if (ta) ta.value = "";
  $("#inpName").value = "";
  $("#inpEmail").value = "";
  const hint = $("#hint");
  if (hint) hint.textContent = "Elegí una categoría y luego un color para comenzar.";
  $$("#colorsGrid .color").forEach(n=>n.dataset.selected="false");
  const qtyInput = $("#qty"); if (qtyInput) qtyInput.value = 1;
  const btnAdd = $("#btnAdd"); if (btnAdd) btnAdd.disabled = true;
  $$("#colorsGrid .color").forEach(n=>createOrUpdateBadge(n, 0));

  // Ocultar imagen
  const card  = $("#productCard");  const img  = $("#productImg");
  if (card && img){ card.style.display = "none"; img.removeAttribute("src"); img.alt=""; }
}

// ---- Eventos
document.addEventListener("DOMContentLoaded", ()=>{
  const year = $("#year"); if (year) year.textContent = new Date().getFullYear();

  $$("#categoryButtons .cat-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>renderColorsFromButton(btn));
  });

  const btnAdd = $("#btnAdd");
  if (btnAdd) btnAdd.addEventListener("click", addCurrentToCart);

  const qtyInput = $("#qty");
  if (qtyInput) qtyInput.addEventListener("change", ()=>{
    const { catId, catName, colorName, measure, espesor, pack } = state.current;
    if (catId && colorName){
      const q = Math.max(0, Number(qtyInput.value||0));
      setQty(catId, catName, colorName, q, measure, espesor, pack);
      updateColorBadges(catId);
      rebuildResume();
    }
  });

  const btnWA = $("#btnWhatsApp"); if (btnWA) btnWA.addEventListener("click", sendWhatsApp);
  const btnClr = $("#btnClear");   if (btnClr) btnClr.addEventListener("click", clearAll);

  const hint = $("#hint");
  if (hint) hint.textContent = "Elegí una categoría para ver colores disponibles.";
});
