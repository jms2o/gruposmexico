// Generate a contract as a downloadable PDF using browser print
export interface ContractData {
  id: string;
  client_name: string;
  group_name: string;
  event_date: string;
  event_city: string;
  event_type: string;
  duration_hours: number;
  deposit_amount: number;
  remaining_amount: number;
  total_amount: number;
  service_conditions: string;
  created_at: string;
}

export function downloadContractPdf(contract: ContractData) {
  const formattedDate = new Date(contract.event_date).toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const createdDate = new Date(contract.created_at).toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato - ${contract.group_name}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 40px; color: #1a1a1a; line-height: 1.6; }
  .header { text-align: center; border-bottom: 3px solid #DAA520; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; color: #DAA520; margin: 0; letter-spacing: 2px; }
  .header p { color: #666; font-size: 12px; margin: 5px 0 0; }
  .contract-id { font-size: 11px; color: #999; text-align: center; margin-bottom: 20px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #DAA520; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .row .label { color: #666; }
  .row .value { font-weight: 600; }
  .total-row { background: #f9f6ef; padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; margin-top: 8px; }
  .conditions { font-size: 12px; color: #666; background: #fafafa; padding: 16px; border-radius: 8px; border: 1px solid #eee; }
  .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
  .sig-block { text-align: center; width: 45%; }
  .sig-line { border-top: 1px solid #333; padding-top: 8px; font-size: 13px; margin-top: 50px; }
  .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
  @media print { body { margin: 0; padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <h1> CONTRATO DE SERVICIO MUSICAL</h1>
    <p>Grupos México · Plataforma de contratación musical</p>
  </div>
  <div class="contract-id">Contrato No. ${contract.id.slice(0, 8).toUpperCase()}</div>

  <div class="section">
    <h2>Partes del contrato</h2>
    <div class="row"><span class="label">Cliente:</span><span class="value">${contract.client_name}</span></div>
    <div class="row"><span class="label">Grupo musical:</span><span class="value">${contract.group_name}</span></div>
  </div>

  <div class="section">
    <h2>Detalles del evento</h2>
    <div class="row"><span class="label">Tipo de evento:</span><span class="value">${contract.event_type}</span></div>
    <div class="row"><span class="label">Fecha:</span><span class="value">${formattedDate}</span></div>
    <div class="row"><span class="label">Ciudad:</span><span class="value">${contract.event_city}</span></div>
    <div class="row"><span class="label">Duración:</span><span class="value">${contract.duration_hours} horas</span></div>
  </div>

  <div class="section">
    <h2>Detalles de pago</h2>
    <div class="row"><span class="label">Anticipo pagado:</span><span class="value" style="color: #16a34a;">$${contract.deposit_amount.toLocaleString()} MXN</span></div>
    <div class="row"><span class="label">Saldo restante:</span><span class="value">$${contract.remaining_amount.toLocaleString()} MXN</span></div>
    <div class="total-row"><span>Total del servicio:</span><span>$${contract.total_amount.toLocaleString()} MXN</span></div>
  </div>

  <div class="section">
    <h2>Condiciones del servicio</h2>
    <div class="conditions">${contract.service_conditions}</div>
  </div>

  <div class="signatures">
    <div class="sig-block"><div class="sig-line">${contract.client_name}<br><small>Cliente</small></div></div>
    <div class="sig-block"><div class="sig-line">${contract.group_name}<br><small>Grupo musical</small></div></div>
  </div>

  <div class="footer">
    Fecha de emisión: ${createdDate}<br>
    Este contrato fue generado automáticamente por Grupos México.
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => { win.print(); }, 500);
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
