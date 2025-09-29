// waBuilder.js
(function (global) {
  const WHATSAPP_NUMBER = "5493815542592";

  function pad2(n){ return String(n).padStart(2,"0"); }
  function formatDate(d){
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth()+1);
    const yyyy = d.getFullYear();
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }

  function buildMessage(cartSummary, form) {
    const lines = [];
    lines.push(`*Consulta de presupuesto* 🧾`);
    lines.push(`Solicitante: ${form.nombre || "-"} | Email: ${form.correo || "-"}`);
    lines.push(`Fecha: ${formatDate(new Date())}`);
    lines.push("");
    lines.push(`*Forma de envío:* ${form.envio || "-"}`);
    lines.push(`*Forma de pago:* ${form.pago || "-"}`);
    lines.push("");
    lines.push(`*Pedido detallado (por categoría):*`);

    cartSummary.groups.forEach(g => {
      lines.push(`- ${g.name}`);
      g.items.forEach(it => lines.push(`  • ${it.name}: ${it.qty} u.`));
      lines.push("");
    });

    lines.push(`*Total de ítems:* ${cartSummary.totalQty}`);
    lines.push("");
    lines.push(`Gracias. Quedo atento/a a su respuesta.`);

    return lines.join("\n");
  }

  function openWhatsApp(message) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  global.WABuilder = { buildMessage, openWhatsApp };
})(window);
