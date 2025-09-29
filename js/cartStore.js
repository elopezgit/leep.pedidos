// cartStore.js
(function (global) {
  const LS_KEY = "leep.cart.v1";

  class CartStore {
    constructor() {
      this.state = { groups: {} }; // groups[categoryId] = { name, items: { itemId: { name, qty } } }
      this._load();
    }

    _load() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) this.state = JSON.parse(raw);
      } catch { /* noop */ }
    }
    _save() {
      localStorage.setItem(LS_KEY, JSON.stringify(this.state));
      this.onChange?.(this.getSummary());
    }

    add(categoryId, categoryName, itemId, itemName, qty = 1) {
      if (qty <= 0) return;
      const g = (this.state.groups[categoryId] ??= { name: categoryName, items: {} });
      const it = (g.items[itemId] ??= { name: itemName, qty: 0 });
      it.qty += qty;
      this._save();
    }

    setQty(categoryId, categoryName, itemId, itemName, qty) {
      const g = (this.state.groups[categoryId] ??= { name: categoryName, items: {} });
      if (qty <= 0) {
        delete g.items[itemId];
        if (!Object.keys(g.items).length) delete this.state.groups[categoryId];
      } else {
        g.items[itemId] = { name: itemName, qty };
      }
      this._save();
    }

    remove(categoryId, itemId) {
      const g = this.state.groups[categoryId];
      if (!g) return;
      delete g.items[itemId];
      if (!Object.keys(g.items).length) delete this.state.groups[categoryId];
      this._save();
    }

    clear() {
      this.state = { groups: {} };
      this._save();
    }

    totalQty() {
      let n = 0;
      for (const g of Object.values(this.state.groups))
        for (const it of Object.values(g.items)) n += Number(it.qty || 0);
      return n;
    }

    getSummary() {
      // array friendly para render
      const groups = [];
      for (const [catId, g] of Object.entries(this.state.groups)) {
        const items = Object.entries(g.items).map(([itemId, it]) => ({ itemId, ...it }));
        groups.push({ categoryId: catId, name: g.name, items });
      }
      return { groups, totalQty: this.totalQty() };
    }
  }

  global.CartStore = CartStore;
})(window);
