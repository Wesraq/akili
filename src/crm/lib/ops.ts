/** Shared helpers for LIMS enhancements (TAT parsing, VAT maths). */

export function parseTurnaroundHours(turnaround: string | null | undefined): number | null {
  if (!turnaround?.trim()) return null;
  const text = turnaround.trim().toLowerCase();
  const range = text.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|d|day|days)/);
  if (range) {
    const high = Number(range[2]);
    const unit = range[3]!;
    if (!Number.isFinite(high)) return null;
    return unit.startsWith("d") ? high * 24 : high;
  }
  const single = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|d|day|days)/);
  if (single) {
    const value = Number(single[1]);
    const unit = single[2]!;
    if (!Number.isFinite(value)) return null;
    return unit.startsWith("d") ? value * 24 : value;
  }
  return null;
}

export function addHoursIso(iso: string, hours: number) {
  const date = new Date(iso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

export function computeVat({
  cashSubtotal,
  vatInclusiveSubtotal,
  vatRatePercent,
}: {
  cashSubtotal: number;
  vatInclusiveSubtotal: number;
  vatRatePercent: number;
}) {
  const cash = Math.max(0, cashSubtotal);
  const vatIncl = Math.max(0, vatInclusiveSubtotal);
  if (vatIncl > cash + 0.0001) {
    const tax = Math.round((vatIncl - cash) * 100) / 100;
    return { subtotal: Math.round(cash * 100) / 100, tax, total: Math.round(vatIncl * 100) / 100 };
  }
  const rate = Math.max(0, vatRatePercent) / 100;
  const tax = Math.round(cash * rate * 100) / 100;
  const total = Math.round((cash + tax) * 100) / 100;
  return { subtotal: Math.round(cash * 100) / 100, tax, total };
}

export function entityHref(entityType: string, entityId: string): string | null {
  const id = entityId;
  switch (entityType) {
    case "lead":
      return `/crm/leads/${id}`;
    case "client":
      return `/crm/clients/${id}`;
    case "appointment":
      return `/crm/appointments`;
    case "lab_order":
      return `/crm/lab-orders/${id}`;
    case "equipment_order":
      return `/crm/equipment-orders/${id}`;
    case "invoice":
      return `/crm/invoices/${id}`;
    case "staff_user":
      return `/crm/settings/users`;
    case "clinical_test":
      return `/crm/settings/tests`;
    case "lab_settings":
      return `/crm/settings/organisation`;
    default:
      return null;
  }
}
