// ui.js
(function (global) {

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function renderCategories(root, catalog, onQtyChange) {
    root.innerHTML = "";
    catalog.categories.forEach(cat => {
      const meta = [
        cat.meta?.medida ? `Medida: ${cat.meta.medida}` : null,
        cat.meta?.espesor ? `Espesor: ${cat.meta.espesor}` : null,
        cat.meta?.pack ? `Pack: ${cat.meta.pack}` : null
      ].filter(Boolean).join(" · ");

      const card = el(`
        <article class="card" data-cat="${cat.id}">
          <header>
            <h3>${cat.name}</h3>
            <p class="meta">${meta}</p>
            <button class="btn btn-ghost btn-toggle">Ver productos</button>
          </header>
          <div class="items"></div>
        </article>
      `);
      const itemsBox = card.querySelector(".items");

      cat.items.forEach(item => {
        const row = el(`
          <div class="item" data-item="${item.id}">
            <div>
              <strong>${item.name}</strong>
            </div>
            <div class="qty">
              <input type="number" inputmode="numeric" min="0" step="1" value="0" aria-label="Cantidad ${item.name}">
              <button class="btn btn-primary btn-add">Agregar</button>
            </div>
          </div>
        `);
        // Eventos
        row.querySelector(".btn-add").addEventListener("click", () => {
          const qty = Number(row.querySelector("input").value || 0);
          onQtyChange(cat, item, qty, /*replace*/ true);
        });
        itemsBox.appendChild(row);
      });

      // Toggle
      card.querySelector(".btn-toggle").addEventListener("click", () => {
        card.classList.toggle("open");
      });

      root.appendChild(card);
    });
  }

  function renderCart(container, summary, handlers) {
    container.innerHTML = "";

    if (!summary.groups.length) {
      container.appendChild(el(`<p class="muted">Aún no agregaste productos.</p>`));
      return;
    }

    summary.groups.forEach(g => {
      const grp = el(`<div class="group"><h4>${g.name}</h4></div>`);
      g.items.forEach(it => {
        const line = el(`
          <div class="line" data-cat="${g.categoryId}" data-item="${it.itemId}">
            <button class="btn btn-ghost btn-del" title="Eliminar">🗑</button>
            <div class="name">${it.name}</div>
            <div class="qty">
              <input type="number" min="0" step="1" value="${it.qty}" inputmode="numeric" aria-label="Cantidad ${it.name}">
            </div>
          </div>
        `);
        // Eliminar
        line.querySelector(".btn-del").addEventListener("click", () => {
          handlers.onDelete(g.categoryId, it.itemId);
        });
        // Cambiar qty
        line.querySelector("input").addEventListener("change", (e) => {
          const v = Number(e.target.value || 0);
          handlers.onUpdate(g.categoryId, g.name, it.itemId, it.name, v);
        });

        grp.appendChild(line);
      });
      container.appendChild(grp);
    });
  }

  function setBagCount(n) {
    document.getElementById("bag-count").textContent = n;
    document.getElementById("total-items").textContent = n;
  }

  function openDrawer() { document.getElementById("drawer").classList.add("open"); document.getElementById("drawer").setAttribute("aria-hidden","false"); }
  function closeDrawer() { document.getElementById("drawer").classList.remove("open"); document.getElementById("drawer").setAttribute("aria-hidden","true"); }

  function openNav() {
    const nav = document.getElementById("main-nav");
    nav.classList.add("open");
    nav.setAttribute("aria-hidden","false");
    document.getElementById("btn-menu").setAttribute("aria-expanded","true");
  }
  function closeNav() {
    const nav = document.getElementById("main-nav");
    nav.classList.remove("open");
    nav.setAttribute("aria-hidden","true");
    document.getElementById("btn-menu").setAttribute("aria-expanded","false");
  }

  global.UI = { el, renderCategories, renderCart, setBagCount, openDrawer, closeDrawer, openNav, closeNav };
})(window);
