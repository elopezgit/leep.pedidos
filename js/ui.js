const UI = (() => {
  function el(tag, attrs = {}, ...children){
    const $e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (v==null) return;
      if (k === "class") $e.className = v;
      else if (k === "style") Object.assign($e.style, v);
      else if (k.startsWith("on") && typeof v === "function") $e.addEventListener(k.slice(2), v);
      else $e.setAttribute(k, v);
    });
    children.flat().filter(Boolean).forEach(ch=>{
      $e.append(ch.nodeType ? ch : document.createTextNode(ch));
    });
    return $e;
  }

  function swatch({ display, hex, qty, onInc, onDec }){
    const $s = el("button", { class:"swatch", type:"button", "aria-label":`Agregar ${display}` },
      el("span", { class:"dot", style:{ background: hex }}),
      el("span", { class:"name" }, display)
    );
    const renderBadge = () => {
      const old = $s.querySelector(".qty-badge"); if (old) old.remove();
      if (qty() > 0){
        $s.append(el("em", { class:"qty-badge" }, String(qty())));
      }
    };
    $s.addEventListener("click", ()=>{ onInc(); renderBadge(); });
    $s.addEventListener("contextmenu", (e)=>{ e.preventDefault(); onDec(); renderBadge(); });
    renderBadge();
    return $s;
  }

  function productCard({ category, spec, product, cart }){
    const $card = el("article", { class:"card" });
    const $hd = el("div", { class:"card-hd" },
      el("h3", { class:"title" }, `${product.name}`),
      el("div", { class:"meta" },
        spec.medida ? el("span",{}, `Medida ${spec.medida}`) : null,
        spec.espesor ? el("span",{}, `Espesor ${spec.espesor}`) : null,
        spec.pack ? el("span",{}, spec.pack) : null,
        el("span",{}, `Categoría: ${category}`)
      )
    );

    const $sw = el("div", { class:"swatches" });
    product.variants.forEach(v => {
      const item = {
        code: v.code,
        name: product.name,
        category,
        spec,
        variantName: v.name,
        hex: v.hex
      };
      $sw.append(swatch({
        display: v.name,
        hex: v.hex,
        qty: () => cart.get(`${v.code}__${v.name}`)?.qty || 0,
        onInc: () => cart.add(item, +1),
        onDec: () => cart.add(item, -1),
      }));
    });

    const $actions = el("div", { class:"actions" },
      el("button", { class:"btn btn-ghost", type:"button", onClick:()=>alert("Tip: clic suma, clic derecho resta 😊") }, "¿Cómo uso los swatches?")
    );

    $card.append($hd, $sw, $actions);
    return $card;
  }

  function renderCatalog($root, data, cart){
    $root.innerHTML = "";
    data.forEach(block => {
      // Agrupar items por "producto" (misma name, múltiples variantes)
      const grouped = {};
      block.items.forEach(it=>{
        const key = `${block.category}__${it.name}`;
        (grouped[key] ||= { name: it.name, variants: [], base: it });
        grouped[key].variants.push({ code: it.code, name: it.variant.name, hex: it.variant.hex });
      });

      Object.values(grouped).forEach(prod=>{
        $root.append(productCard({
          category: block.category,
          spec: block.spec,
          product: prod,
          cart
        }));
      });
    });
  }

  function renderCart($list, $count, cart){
    const { items, totalQty } = cart.summary();
    $list.innerHTML = "";
    $count.textContent = String(totalQty);

    if (!items.length){
      $list.append(el("div", { class:"cap" }, "Tu consulta está vacía. Agregá productos haciendo clic en los colores."));
      return;
    }

    items.forEach(row=>{
      const id = `${row.code}__${row.variantName}`;
      const $r = el("div", { class:"cart-row" },
        el("div", {},
          el("div", {}, `${row.name} – ${row.variantName}`),
          el("div", { class:"cap" },
            `${row.code} • ${row.spec?.medida || ""}${row.spec?.medida && (row.spec?.espesor||row.spec?.pack) ? " • " : ""}${row.spec?.espesor || ""}${row.spec?.espesor && row.spec?.pack ? " • " : ""}${row.spec?.pack || ""}`
          )
        ),
        el("div", { class:"qty-controls" },
          el("button", { type:"button", onClick:()=>cart.add(row, -1) }, "−"),
          el("span", {}, String(row.qty)),
          el("button", { type:"button", onClick:()=>cart.add(row, +1) }, "+")
        )
      );
      $list.append($r);
    });
  }

  return { renderCatalog, renderCart };
})();
