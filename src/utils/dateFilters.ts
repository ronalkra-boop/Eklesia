// Utility for flexible date range filtering and reporting in Ekklesia Treasury

export type DatePreset = 
  | 'last_7_days' 
  | 'last_15_days' 
  | 'this_month' 
  | 'last_month' 
  | 'last_2_months' 
  | 'last_3_months' 
  | 'this_year' 
  | 'all' 
  | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;   // YYYY-MM-DD or ''
  preset: DatePreset;
  label: string;
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPresetDateRange(preset: DatePreset): DateRange {
  const today = new Date();
  const todayStr = getLocalDateString(today);

  switch (preset) {
    case 'last_7_days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return {
        startDate: getLocalDateString(d),
        endDate: todayStr,
        preset,
        label: 'Última Semana (7 días)'
      };
    }
    case 'last_15_days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 14);
      return {
        startDate: getLocalDateString(d),
        endDate: todayStr,
        preset,
        label: 'Últimos 15 días (Quincena)'
      };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: getLocalDateString(start),
        endDate: todayStr,
        preset,
        label: 'Este Mes'
      };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0); // last day of prev month
      return {
        startDate: getLocalDateString(start),
        endDate: getLocalDateString(end),
        preset,
        label: 'Mes Anterior'
      };
    }
    case 'last_2_months': {
      // 2 months back to today
      const start = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate());
      return {
        startDate: getLocalDateString(start),
        endDate: todayStr,
        preset,
        label: 'Últimos 2 Meses'
      };
    }
    case 'last_3_months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      return {
        startDate: getLocalDateString(start),
        endDate: todayStr,
        preset,
        label: 'Últimos 3 Meses (Trimestre)'
      };
    }
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return {
        startDate: getLocalDateString(start),
        endDate: todayStr,
        preset,
        label: `Año ${today.getFullYear()}`
      };
    }
    case 'all': {
      return {
        startDate: '',
        endDate: '',
        preset,
        label: 'Todo el Histórico'
      };
    }
    case 'custom':
    default: {
      return {
        startDate: getLocalDateString(new Date(today.getFullYear(), today.getMonth() - 2, 1)),
        endDate: todayStr,
        preset: 'custom',
        label: 'Periodo Personalizado'
      };
    }
  }
}

export function filterItemsByDateRange<T extends { date: string }>(
  items: T[],
  startDate: string,
  endDate: string
): T[] {
  return items.filter((item) => {
    if (!item.date) return false;
    const itemDate = item.date.slice(0, 10);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  });
}

export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatPeriodDescription(startDate: string, endDate: string, label?: string): string {
  if (!startDate && !endDate) return 'Histórico Completo';
  if (startDate && endDate) {
    if (startDate === endDate) {
      return `Día: ${formatReadableDate(startDate)}`;
    }
    return `${formatReadableDate(startDate)} al ${formatReadableDate(endDate)}${label ? ` (${label})` : ''}`;
  }
  if (startDate) return `Desde el ${formatReadableDate(startDate)}`;
  if (endDate) return `Hasta el ${formatReadableDate(endDate)}`;
  return 'Periodo Seleccionado';
}

export function calculateDaysBetween(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}
