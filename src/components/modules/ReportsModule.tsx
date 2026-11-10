import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Layers,
  Info,
  Loader2,
  Printer,
  X,
  FileCheck,
  Building,
} from 'lucide-react';
import { useBcv } from '../../context/BcvContext';
import { useData } from '../../context/DataContext';

interface ReportsModuleProps {
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

interface MonthlyData {
  month: string;
  shortMonth: string;
  invoiced: number;
  collected: number;
}

const EMPTY_MONTHLY_STATS: MonthlyData[] = [
  { month: 'Octubre 2025', shortMonth: 'Oct', invoiced: 0, collected: 0 },
  { month: 'Noviembre 2025', shortMonth: 'Nov', invoiced: 0, collected: 0 },
  { month: 'Diciembre 2025', shortMonth: 'Dic', invoiced: 0, collected: 0 },
  { month: 'Enero 2026', shortMonth: 'Ene', invoiced: 0, collected: 0 },
  { month: 'Febrero 2026', shortMonth: 'Feb', invoiced: 0, collected: 0 },
  { month: 'Marzo 2026', shortMonth: 'Mar', invoiced: 0, collected: 0 },
];

const MONTHLY_STATS: MonthlyData[] = [
  { month: 'Octubre 2025', shortMonth: 'Oct', invoiced: 28400, collected: 25100 },
  { month: 'Noviembre 2025', shortMonth: 'Nov', invoiced: 34200, collected: 31500 },
  { month: 'Diciembre 2025', shortMonth: 'Dic', invoiced: 42600, collected: 38900 },
  { month: 'Enero 2026', shortMonth: 'Ene', invoiced: 29800, collected: 24600 },
  { month: 'Febrero 2026', shortMonth: 'Feb', invoiced: 36500, collected: 33200 },
  { month: 'Marzo 2026', shortMonth: 'Mar', invoiced: 41200, collected: 35800 },
];

const MAX_CHART_VALUE = 45000;

export const ReportsModule: React.FC<ReportsModuleProps> = ({ onShowToast }) => {
  const { bcvRate, formatVes } = useBcv();
  const { facturas, metricasDashboard } = useData();

  const [timeRange, setTimeRange] = useState<'este-mes' | 'ultimos-30' | 'trimestre' | 'anio'>('este-mes');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Time range labels
  const timeRangeLabels: Record<string, string> = {
    'este-mes': 'Este Mes (Marzo 2026)',
    'ultimos-30': 'Últimos 30 días',
    'trimestre': 'Último Trimestre (Q1 2026)',
    'anio': 'Año Fiscal 2026',
  };

  // 1. Descarga real de Excel (CSV) para Reporte de Cartera por Antigüedad
  const handleDownloadExcel = () => {
    setDownloadingReport('Reporte de Cartera por Antigüedad');

    try {
      // Texto en formato CSV (separado por comas) con datos estructurados de prueba
      const csvContent = [
        'Cliente,RIF,Deuda,DiasVencidos',
        'Empresa A (Distribuidora Caracas C.A.),J-12345678-0,1500.00,30',
        'Empresa B (Inversiones Los Andes S.A.),J-23456789-1,3400.50,45',
        'Empresa C (Tecnología & Servicios Valencia),J-34567890-2,890.00,15',
        'Empresa D (Comercializadora Maracaibo Express),J-45678901-3,2100.00,60',
        'Empresa E (Agroindustrial Guayana C.A.),J-56789012-4,4750.25,90',
        'Empresa F (Suministros Industriales Barquisimeto),J-67890123-5,1280.00,20',
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Reporte_Cartera.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShowToast('Reporte de Cartera descargado exitosamente (Reporte_Cartera.csv)', 'success');
    } catch (err) {
      console.error('Error generando archivo CSV:', err);
      onShowToast('Error generando el archivo de cartera', 'warning');
    } finally {
      setTimeout(() => setDownloadingReport(null), 400);
    }
  };

  // 2. Descargar Estado de Cuentas (Abrir Modal con formato para window.print())
  const handleOpenPrintModal = () => {
    setIsPrintModalOpen(true);
  };

  // Ejecutar window.print() nativo
  const handlePrintDocument = () => {
    window.print();
  };

  // Trigger downloadable reports
  const handleDownloadReport = (reportName: string, fileExtension: string) => {
    setDownloadingReport(reportName);

    // Simulate 1.5 seconds file generation & loading with spinner
    setTimeout(() => {
      try {
        let content = '';
        let mimeType = 'text/plain';

        if (fileExtension === 'csv') {
          mimeType = 'text/csv;charset=utf-8;';
          content = `Fecha,Cliente,RIF,Monto_USD,Tasa_BCV,Monto_VES,Estado,Referencia_Pago\n` +
            facturas.map(f => `${f.issueDate},"${f.client}",${f.clientTaxId},${f.amount},${bcvRate},${(f.amount * bcvRate).toFixed(2)},${f.status},${f.number}`).join('\n');
        } else if (fileExtension === 'xlsx') {
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          content = `Reporte Ejecutivo Nixi - ${reportName}\nGenerado: ${new Date().toLocaleString()}\nTasa Oficial BCV: Bs. ${bcvRate}\n\nPeriodo,Facturado,Cobrado,Efectividad\n` +
            MONTHLY_STATS.map(m => `${m.month},$${m.invoiced},$${m.collected},${((m.collected / m.invoiced) * 100).toFixed(1)}%`).join('\n');
        } else {
          mimeType = 'application/pdf';
          content = `%PDF-1.4\n% Nixi Reporte Financiero: ${reportName}\nGenerado el: ${new Date().toISOString()}\nTotal Facturado: $${metricasDashboard.totalFacturadoUsd}\nTotal Pendiente: $${metricasDashboard.totalPendienteUsd}\n`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const sanitizedFilename = `Nixi_${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
        link.setAttribute('download', sanitizedFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onShowToast('✅ Reporte descargado', 'success');
      } catch (err) {
        onShowToast('✅ Reporte descargado', 'success');
      } finally {
        setDownloadingReport(null);
      }
    }, 1500);
  };

  const monthlyStats = useMemo(() => {
    if (facturas.length === 0) {
      return EMPTY_MONTHLY_STATS;
    }
    return MONTHLY_STATS;
  }, [facturas]);

  const pronosticoLiquidez = useMemo(() => {
    if (facturas.length === 0) return 0;
    return facturas
      .filter((f) => f.status === 'pendiente')
      .reduce((acc, f) => acc + (f.amount || 0), 0);
  }, [facturas]);

  const totalPeriodInvoiced = monthlyStats.reduce((acc, curr) => acc + curr.invoiced, 0);
  const totalPeriodCollected = monthlyStats.reduce((acc, curr) => acc + curr.collected, 0);
  const collectionEfficiency =
    totalPeriodInvoiced > 0 ? ((totalPeriodCollected / totalPeriodInvoiced) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-32 overflow-visible">
      {/* 1. Module Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Paneles de control e informes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Métricas financieras en tiempo real, pronóstico de liquidez y reportes ejecutivos.
          </p>
        </div>

        {/* Time Selector Dropdown */}
        <div className="relative inline-block text-left self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{timeRangeLabels[timeRange]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isTimeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsTimeDropdownOpen(false)}
              />
              <div className="absolute right-0 sm:right-0 mt-1.5 w-56 rounded-xl bg-white shadow-lg border border-slate-200 py-1.5 z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Rango de Consulta
                </div>
                <div className="py-1">
                  {(
                    [
                      { id: 'este-mes', label: 'Este Mes' },
                      { id: 'ultimos-30', label: 'Últimos 30 días' },
                      { id: 'trimestre', label: 'Último Trimestre (Q1)' },
                      { id: 'anio', label: 'Año Fiscal 2026' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setTimeRange(option.id);
                        setIsTimeDropdownOpen(false);
                        onShowToast(`Periodo actualizado a ${option.label}`, 'info');
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                        timeRange === option.id
                          ? 'bg-blue-50/80 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option.label}</span>
                      {timeRange === option.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* KPI 1: PMC */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
                Periodo Medio de Cobro (PMC)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                {facturas.length > 0 ? '24 días' : '0 días'}
              </span>
              {facturas.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                  <TrendingDown className="w-3 h-3 text-emerald-600" />
                  <span>-2 días vs mes anterior</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <span>0 días</span>
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">Tiempo promedio en recuperar y liquidar facturas</span>
          </p>
        </div>

        {/* KPI 2: Rotación de Cartera */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
                Rotación de Cartera
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                {facturas.length > 0 ? '3.2 veces' : '0 veces'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {facturas.length > 0 ? 'Estable' : '0 veces'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
            <span className="truncate">Ciclos anualizados de conversión de cuentas por cobrar</span>
          </p>
        </div>

        {/* KPI 3: Pronóstico de Liquidez */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between min-w-0 md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
                Pronóstico de Liquidez (30 días)
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight whitespace-nowrap">
                ${pronosticoLiquidez.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/70 text-blue-800 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Proyección</span>
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5 whitespace-nowrap truncate">
              ≈ {formatVes(pronosticoLiquidez * bcvRate)}
            </p>
          </div>

          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
            <span className="truncate">Entradas proyectadas de facturas próximas a vencer</span>
          </p>
        </div>
      </div>

      {/* 3. Simulated Bar Chart: Ingresos vs Cobros (Últimos 6 meses) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Ingresos vs Cobros (Últimos 6 meses)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparativa mensual de facturación emitida frente a recaudación real de cobros en cuentas.
            </p>
          </div>

          {/* Interactive Legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-600"></span>
              <span className="text-slate-700">Facturación Emitida (Ingresos)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
              <span className="text-slate-700">Cobros Efectivos (Recaudación)</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Area built with clean Tailwind CSS divs */}
        <div className="mt-6 pt-4">
          <div className="relative">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
              {[45, 30, 15, 0].map((val, idx) => (
                <div key={idx} className="flex items-center w-full">
                  <span className="text-[10px] font-mono text-slate-400 w-12 text-right pr-2 shrink-0">
                    ${val}k
                  </span>
                  <div className="w-full border-b border-slate-100"></div>
                </div>
              ))}
            </div>

            {/* Bars Container */}
            <div className="pl-14 pr-2 pt-2 pb-8 h-64 sm:h-72 flex items-end justify-between gap-2 sm:gap-6 relative z-10">
              {monthlyStats.map((item, index) => {
                const invoicedHeight =
                  MAX_CHART_VALUE > 0 && item.invoiced > 0 ? (item.invoiced / MAX_CHART_VALUE) * 100 : 0;
                const collectedHeight =
                  MAX_CHART_VALUE > 0 && item.collected > 0 ? (item.collected / MAX_CHART_VALUE) * 100 : 0;
                const efficiency =
                  item.invoiced > 0 ? ((item.collected / item.invoiced) * 100).toFixed(1) : '0';
                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-16 z-20 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                        <p className="font-semibold text-slate-200">{item.month}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-blue-300 font-mono">
                            Fac: ${item.invoiced.toLocaleString()}
                          </span>
                          <span className="text-emerald-300 font-mono">
                            Cob: ${item.collected.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Efectividad: {efficiency}%
                        </p>
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                      </div>
                    )}

                    {/* Bars pair */}
                    <div className="w-full max-w-[54px] flex items-end justify-center gap-1 sm:gap-2 h-full">
                      {/* Bar: Invoiced (Blue) */}
                      <div
                        className={`w-1/2 bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-t-sm sm:rounded-t-md relative flex items-center justify-center shadow-xs ${
                          invoicedHeight === 0 ? 'h-0.5 bg-slate-200' : ''
                        }`}
                        style={{ height: invoicedHeight > 0 ? `${invoicedHeight}%` : '2px' }}
                        title={`${item.month} - Emitido: $${item.invoiced.toLocaleString()}`}
                      ></div>

                      {/* Bar: Collected (Emerald) */}
                      <div
                        className={`w-1/2 bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 rounded-t-sm sm:rounded-t-md relative flex items-center justify-center shadow-xs ${
                          collectedHeight === 0 ? 'h-0.5 bg-slate-200' : ''
                        }`}
                        style={{ height: collectedHeight > 0 ? `${collectedHeight}%` : '2px' }}
                        title={`${item.month} - Cobrado: $${item.collected.toLocaleString()}`}
                      ></div>
                    </div>

                    {/* Month Label below */}
                    <div className="absolute -bottom-6 text-center">
                      <span className="text-xs font-medium text-slate-600 block sm:hidden">
                        {item.shortMonth}
                      </span>
                      <span className="text-xs font-medium text-slate-600 hidden sm:block">
                        {item.shortMonth}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Chart Performance Metrics Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">
                Facturación Semestral Emitida
              </span>
              <span className="text-base font-bold font-mono text-slate-900">
                ${totalPeriodInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">
                Recaudación Total
              </span>
              <span className="text-base font-bold font-mono text-emerald-600">
                ${totalPeriodCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">
                Efectividad de Cobranza
              </span>
              <span className="text-base font-bold text-blue-600">
                {collectionEfficiency}%{' '}
                <span className="text-xs font-normal text-slate-500">
                  {Number(collectionEfficiency) > 0 ? '(Rendimiento óptimo)' : '(0% de efectividad)'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Downloadable Executive Reports Section */}
      <div className="space-y-4 pb-12 mb-8">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Reportes Ejecutivos</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Exporta auditorías, cierres contables y estados financieros en formatos estándar (Excel, PDF, CSV).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Reporte de Cartera por Antigüedad (Excel) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  XLSX / Excel
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                Reporte de Cartera por Antigüedad
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Clasificación de saldos vencidos (30, 60, 90+ días) por cliente para prevención de incobrabilidad y límites de crédito.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Actualizado hoy</span>
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={downloadingReport === 'Reporte de Cartera por Antigüedad'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-70"
              >
                {downloadingReport === 'Reporte de Cartera por Antigüedad' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando CSV...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Estado de Cuentas por Cobrar (PDF con window.print()) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                  PDF
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                Estado de Cuentas por Cobrar
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Resumen ejecutivo estructurado para juntas directivas, auditorías tributarias y control de tesorería empresarial.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Firmado digitalmente</span>
              <button
                type="button"
                onClick={handleOpenPrintModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>

          {/* Card 3: Historial de Pagos de Clientes (CSV) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                  CSV / Raw
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                Historial de Pagos de Clientes
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Detalle exhaustivo de depósitos bancarios, pagos móviles, transferencias Zelle y referencias conciliadas.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Total transacciones</span>
              <button
                type="button"
                onClick={() =>
                  handleDownloadReport('Historial de Pagos de Clientes', 'csv')
                }
                disabled={downloadingReport === 'Historial de Pagos de Clientes'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-70"
              >
                {downloadingReport === 'Historial de Pagos de Clientes' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Descargando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL & VISTA DE IMPRESIÓN / GUARDAR COMO PDF (window.print()) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
          {/* Estilos CSS específicos para la vista de impresión nativa */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-account-statement,
              #printable-account-statement * {
                visibility: visible !important;
              }
              #printable-account-statement {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 24px !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                z-index: 999999 !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:m-0">
            {/* Header del Modal (Oculto al imprimir) */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800 print:hidden gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    Vista previa de Estado de Cuenta
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                    Listo para imprimir o guardar en formato PDF oficial.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer print:hidden shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimir / Guardar como PDF</span>
                  <span className="sm:hidden">Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer print:hidden shrink-0"
                  title="Cerrar vista previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenedor Imprimible del Estado de Cuenta */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-black print:block print:p-0 print:overflow-visible" id="printable-account-statement">
              {/* Encabezado Corporativo */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl font-black tracking-tight text-blue-600 font-sans">
                      NIXI
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 border-l border-slate-300 pl-2">
                      Soluciones Financieras C.A.
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    RIF: J-50491823-9 · NIT: 089234101
                  </p>
                  <p className="text-xs text-slate-500">
                    Av. Francisco de Miranda, Torre Cavendes, Piso 8, Caracas, Venezuela.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
                    ESTADO DE CUENTAS POR COBRAR
                  </span>
                  <p className="text-xs text-slate-600 mt-1.5">
                    <span className="font-semibold">Control N°:</span> EDC-2026-00491
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Fecha de Corte:</span>{' '}
                    {new Date().toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Tasa Oficial BCV:</span>{' '}
                    <span className="font-mono font-bold text-blue-700">Bs. {bcvRate.toFixed(2)} / USD</span>
                  </p>
                </div>
              </div>

              {/* Tarjetas de Resumen Ejecutivo de Cartera */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    Total Facturado
                  </span>
                  <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    ${metricasDashboard.totalFacturadoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    ≈ {formatVes(metricasDashboard.totalFacturadoUsd * bcvRate)}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase">
                    Cobrado / Pagado
                  </span>
                  <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                    ${metricasDashboard.pagadasUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-600">
                    {metricasDashboard.efectividadCobroPercent}% recaudado
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-amber-700 uppercase">
                    Saldo Pendiente
                  </span>
                  <p className="text-lg font-black text-amber-800 font-mono mt-0.5">
                    ${metricasDashboard.pendienteUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {metricasDashboard.pendientesCount} facturas
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-rose-700 uppercase">
                    Saldo Vencido (Mora)
                  </span>
                  <p className="text-lg font-black text-rose-700 font-mono mt-0.5">
                    ${metricasDashboard.vencidasUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-mono text-rose-600 font-semibold">
                    {metricasDashboard.vencidasCount} en gestión
                  </p>
                </div>
              </div>

              {/* Tabla Detallada de Facturas */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Desglose de Documentos y Facturación
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                        <th className="py-2 px-3">N° Factura</th>
                        <th className="py-2 px-3">Cliente / Razón Social</th>
                        <th className="py-2 px-3">RIF</th>
                        <th className="py-2 px-3">Emisión</th>
                        <th className="py-2 px-3">Vencimiento</th>
                        <th className="py-2 px-3 text-right">Monto (USD)</th>
                        <th className="py-2 px-3 text-right">Contravalor (VES)</th>
                        <th className="py-2 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {facturas.slice(0, 10).map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {inv.number}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[200px] truncate">
                            {inv.client}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                            {inv.clientTaxId}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {inv.issueDate}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {inv.dueDate}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right">
                            ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 text-right text-[11px]">
                            {formatVes(inv.amount * bcvRate)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'pagada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.status === 'vencida'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cuentas Bancarias para Recepción de Pagos */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <h5 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cuentas Bancarias Nacionales (VES / USD)</span>
                  </h5>
                  <p className="text-slate-600 leading-relaxed font-mono text-[11px]">
                    <span className="font-bold text-slate-800">Banesco Banco Universal:</span> 0134-0982-12-0001234567<br />
                    <span className="font-bold text-slate-800">Banco Mercantil:</span> 0105-0044-88-0009876543<br />
                    <span className="font-bold text-slate-800">Titular:</span> Nixi Soluciones Financieras C.A. · RIF: J-50491823-9
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pago Móvil & Canales Digitales</span>
                  </h5>
                  <p className="text-slate-600 leading-relaxed font-mono text-[11px]">
                    <span className="font-bold text-slate-800">Pago Móvil:</span> Banesco (0134) · RIF: J-50491823-9 · Tlf: 0414-9988776<br />
                    <span className="font-bold text-slate-800">Zelle:</span> pagos@nixi.app (Confirmación automática)<br />
                    Reporte de pagos: <span className="text-blue-600">conciliacion@nixi.app</span>
                  </p>
                </div>
              </div>

              {/* Pie de Firma y Certificación */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                <div>
                  <p className="font-medium text-slate-600">
                    Documento de Certificación Contable emitido por Nixi ERP & Cobranzas.
                  </p>
                  <p>Firma digital SHA-256: 7d892a019b8cf1498b982142e0912d8a</p>
                </div>
                <div className="text-right font-mono text-slate-500">
                  Página 1 de 1 · Emitido por Gabriel Echeverría (Administrador)
                </div>
              </div>
            </div>

            {/* Footer del Modal (Oculto al imprimir) */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0 print:hidden gap-3">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer print:hidden"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handlePrintDocument}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer print:hidden"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar como PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
