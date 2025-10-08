class CartStore {
  constructor(key = "leep.cart.v2"){
    this.key = key;
    /** Mapa: itemId -> { code, name, category, spec, variantName, hex, qty } */
    this.state = this._load();
    this.onChange = null;
  }
  _load(){
    try{
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : {};
    }catch(e){ return {}; }
  }
  _save(){
    localStorage.setItem(this.key, JSON.stringify(this.state));
    if (typeof this.onChange === "function"){
      this.onChange(this.summary());
    }
  }
  _idOf(item){ return `${item.code}__${item.variantName}`; }

  setQty(item, qty){
    const id = this._idOf(item);
    if (qty <= 0){ delete this.state[id]; }
    else {
      this.state[id] = {
        code: item.code,
        name: item.name,
        category: item.category,
        spec: item.spec,
        variantName: item.variantName,
        hex: item.hex,
        qty: qty
      };
    }
    this._save();
  }
  add(item, delta = 1){
    const id = this._idOf(item);
    const cur = this.state[id]?.qty || 0;
    this.setQty(item, cur + delta);
  }
  get(id){ return this.state[id] || null; }
  clear(){ this.state = {}; this._save(); }
  entries(){ return Object.entries(this.state).map(([id, v]) => ({ id, ...v })); }
  count(){ return this.entries().reduce((a,b)=>a+b.qty,0); }
  summary(){
    return {
      items: this.entries(),
      totalQty: this.count(),
      categories: [...new Set(this.entries().map(e=>e.category))]
    };
  }
}
