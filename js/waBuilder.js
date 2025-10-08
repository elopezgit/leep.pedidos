// Número centralizado (formato internacional sin +, ejemplo Argentina 54)
const WHATSAPP_NUMBER = "5493815542592";

const WABuilder = (() => {
  function buildMessage({ name, email, notes, items }){
    const head = [
      `*CONSULTA DE PEDIDO*`,
      `Nombre: ${name}`,
      `Correo: ${email || "-"}`,
      notes ? `Observaciones: ${notes}` : null,
      ``
    ].filter(Boolean).join("\n");

    const body = items.map((it, idx) => {
      const spec = [];
      if (it.spec?.medida) spec.push(`Medida ${it.spec.medida}`);
      if (it.spec?.espesor) spec.push(`Espesor ${it.spec.espesor}`);
      if (it.spec?.pack) spec.push(it.spec.pack);

      return [
        `*${idx+1}.* ${it.name} – ${it.variantName}`,
        `Código: ${it.code}`,
        spec.length ? spec.join(" • ") : null,
        `Cantidad: ${it.qty}`,
        ``
      ].filter(Boolean).join("\n");
    }).join("");

    const footer = `Total de ítems: ${items.reduce((a,b)=>a+b.qty,0)}`;

    return `${head}${body}${footer}`;
  }

  function openWhatsApp(message){
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  }

  return { buildMessage, openWhatsApp };
})();
