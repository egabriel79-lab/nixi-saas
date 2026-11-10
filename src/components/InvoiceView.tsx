import React, { useEffect, useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Lock,
  Loader2,
} from 'lucide-react';
import { Invoice, ClientRisk } from '../types';
import { useBcv } from '../context/BcvContext';
import { useData } from '../context/DataContext';

interface InvoiceViewProps {
  invoice: Invoice | null;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, onClose, onShowToast }) => {
  const { bcvRate, formatVes, formatUsd, usdToVes } = useBcv();
  const { clientes } = useData();
  const [isPrinting, setIsPrinting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!invoice) return null;

  // Find client details from global collection if available
  const matchedClient: ClientRisk | undefined = clientes.find(
    (c) =>
      c.taxId.trim().toUpperCase() === invoice.clientTaxId.trim().toUpperCase() ||
      c.name.trim().toLowerCase() === invoice.client.trim().toLowerCase()
  );

  const clientAddress =
    matchedClient?.notes && matchedClient.notes.includes('Caracas')
      ? 'Av. Francisco de Miranda, Torre Empresarial Caracas, Piso 6, Chacao, Caracas, Venezuela'
      : matchedClient?.notes && matchedClient.notes.includes('Oriental')
      ? 'Av. Municipal, Edif. Puerto Oriente, Piso 3, Puerto La Cruz, Anzoátegui, Venezuela'
      : 'Av. Francisco de Miranda, Centro Lido, Torre B, Piso 8, Chacao, Caracas, Venezuela';

  const clientPhone = matchedClient?.phone || '+58 (414) 829-1920';
  const clientEmail = matchedClient?.email || `facturacion@${invoice.client.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  // Financial calculations
  const ivaRate = (invoice.ivaPercent ?? 16) / 100;
  // Total is invoice.amount
  const totalUsd = invoice.amount;
  const baseUsd = totalUsd / (1 + ivaRate);
  const ivaUsd = totalUsd - baseUsd;

  const totalVes = usdToVes(totalUsd);
  const baseVes = usdToVes(baseUsd);
  const ivaVes = usdToVes(ivaUsd);

  // Serial/Control Number SENIAT
  const numericOnly = invoice.number.replace(/\D/g, '') || '0891';
  const controlNumber = `00-${numericOnly.padStart(6, '0')}`;
  const sha256Fingerprint = `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.slice(0, 48);

  // Table Concept breakdown
  const itemsCount = Math.max(1, invoice.itemsCount || 1);
  const lineItems = [
    {
      cantidad: 1,
      concepto: 'Licencia Plataforma Nixi Cloud & Módulo de Cobranzas Automatizadas',
      subtext: 'Servicio SaaS empresarial para optimización del ciclo de cuentas por cobrar, gestión de cartera e integración multimoneda.',
      precioUnitarioUsd: baseUsd / itemsCount,
      importeUsd: baseUsd / itemsCount,
    },
  ];

  if (itemsCount >= 2) {
    lineItems.push({
      cantidad: 1,
      concepto: 'Módulo de Conciliación Bancaria y Liquidación Multibanco',
      subtext: 'Emparejamiento automatizado de transferencias nacionales y pagos móviles interbancarios (C2P/P2P).',
      precioUnitarioUsd: (baseUsd / itemsCount) * 0.6,
      importeUsd: (baseUsd / itemsCount) * 0.6,
    });
  }

  if (itemsCount >= 3) {
    lineItems.push({
      cantidad: 1,
      concepto: 'Póliza de Soporte Técnico Especializado y Auditoría SENIAT',
      subtext: 'Trazabilidad inmutable de eventos, respaldo en nube y certificación de libros de ventas.',
      precioUnitarioUsd: baseUsd - lineItems[0].importeUsd - lineItems[1].importeUsd,
      importeUsd: baseUsd - lineItems[0].importeUsd - lineItems[1].importeUsd,
    });
  }

  // Adjust first item if multiple items to ensure exact total match
  if (lineItems.length > 1) {
    const sumOthers = lineItems.slice(1).reduce((acc, curr) => acc + curr.importeUsd, 0);
    lineItems[0].precioUnitarioUsd = baseUsd - sumOthers;
    lineItems[0].importeUsd = baseUsd - sumOthers;
  }

  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      window.print();
      if (onShowToast) {
        onShowToast('✅ Documento listo para guardar o imprimir', 'success');
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:p-8 animate-in fade-in duration-150 print:p-0 print:m-0 print:static print:bg-white print:overflow-visible print:block">
      {/* Estilos CSS específicos para la impresión limpia de la factura en papel blanco */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 32px !important;
            background: white !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            z-index: 999999 !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl my-auto print:max-w-none print:w-full print:m-0 print:block">
        {/* TOP ACTION BAR - HIDDEN ON PRINT */}
        <div className="no-print print:hidden mb-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Comprobante de Factura</span>
                <span className="font-mono text-blue-400 font-semibold">{invoice.number}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Vista previa oficial lista para impresión o exportación a PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isPrinting}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Cerrar vista previa (Esc)"
              aria-label="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE PAPER (Target for @media print) */}
        <div
          id="printable-invoice"
          className="bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-10 md:p-12 border border-slate-200 transition-all font-sans print:block print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0"
        >
          {/* 1. ENCABEZADO */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
            {/* Logo y Datos del Emisor */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                  <span className="font-extrabold text-xl tracking-tight text-blue-500">N</span>
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-slate-900 block leading-none">
                    NIXI
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-blue-700 uppercase">
                    Business Tools & Facturación
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-0.5 leading-relaxed">
                <p className="font-bold text-slate-900">NIXI SOLUCIONES FISCALES Y COBRANZAS C.A.</p>
                <p className="font-mono text-slate-800 font-semibold">RIF: J-50493821-3</p>
                <p>Av. Francisco de Miranda, Centro Lido, Torre B, Piso 12, Ofic. 12-B</p>
                <p>Urb. El Rosal, Chacao, Caracas, Miranda, ZP 1060 · Venezuela</p>
                <p className="text-slate-500">Tel: +58 (212) 905-4321 · Email: facturacion@nixi.app</p>
              </div>
            </div>

            {/* Recuadro Destacado: FACTURA N° y Fechas */}
            <div className="w-full sm:w-72 bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-md shrink-0">
              <div className="text-center sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-0.5">
                  Factura Electrónica
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-wide block">
                  {invoice.number}
                </span>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 text-[11px]">N° Control SENIAT:</span>
                  <span className="font-bold text-blue-300">{controlNumber}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 text-[11px]">Fecha de Emisión:</span>
                  <span className="font-semibold text-white">{invoice.issueDate}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 text-[11px]">Fecha Vencimiento:</span>
                  <span className="font-semibold text-white">{invoice.dueDate}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 text-[11px]">Condición:</span>
                  <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                    invoice.status === 'pagada'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {invoice.status === 'pagada' ? 'Contado / Pagada' : 'Crédito a 15 días'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. DATOS DEL CLIENTE */}
          <div className="my-6">
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Datos del Cliente / Receptor Fiscal</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  {invoice.clientTaxId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Razón Social o Nombre:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{invoice.client}</p>
                  
                  <span className="text-slate-400 text-[11px] block mt-2.5">RIF / Cédula de Identidad:</span>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">{invoice.clientTaxId}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Dirección Fiscal:</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{clientAddress}</p>

                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Teléfono:</span>
                      <p className="font-medium text-slate-700 mt-0.5">{clientPhone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Correo:</span>
                      <p className="font-medium text-slate-700 mt-0.5 truncate" title={clientEmail}>
                        {clientEmail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. TABLA DE CONCEPTOS (Columnas exactas: CANTIDAD, CONCEPTO, PRECIO UNITARIO, IMPORTE) */}
          <div className="my-6">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4 text-center w-20">Cantidad</th>
                    <th className="py-3 px-4">Concepto / Descripción</th>
                    <th className="py-3 px-4 text-right w-36 sm:w-44">Precio Unitario</th>
                    <th className="py-3 px-4 text-right w-36 sm:w-44">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-semibold text-slate-900 align-top">
                        {item.cantidad}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-bold text-slate-900 leading-snug">{item.concepto}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.subtext}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono align-top whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block">
                          {formatUsd(item.precioUnitarioUsd)}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {formatVes(usdToVes(item.precioUnitarioUsd))}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono align-top whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {formatUsd(item.importeUsd)}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {formatVes(usdToVes(item.importeUsd))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. TOTALES (PARTE INFERIOR) */}
          <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Lado Izquierdo: Información Fiscal y Bancaria */}
            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Información Bancaria de Pago (Venezuela)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Depósitos o transferencias a nombre de: <strong>NIXI SOLUCIONES FISCALES C.A.</strong> (RIF: J-50493821-3).
              </p>
              <div className="font-mono text-[11px] space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <p>• <strong>Banesco:</strong> 0134-0982-12-0001234567</p>
                <p>• <strong>Mercantil:</strong> 0105-0012-34-1002345678</p>
                <p>• <strong>Pago Móvil:</strong> 0414-9054321 · J-504938213</p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>Tasa Oficial BCV Aplicada:</span>
                <span className="font-mono font-bold text-blue-800">
                  Bs. {bcvRate.toFixed(2)} / USD
                </span>
              </div>
            </div>

            {/* Lado Derecho: Desglose de Totales y Recuadro Azul Oscuro */}
            <div className="space-y-2">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Total Base Imponible:</span>
                  <div className="text-right font-mono tabular-nums">
                    <span className="font-bold text-slate-900">{formatUsd(baseUsd)}</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">({formatVes(baseVes)})</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">IVA ({invoice.ivaPercent || 16}%):</span>
                  <div className="text-right font-mono tabular-nums">
                    <span className="font-bold text-slate-900">{formatUsd(ivaUsd)}</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">({formatVes(ivaVes)})</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Monto Exento / Exonerado:</span>
                  <span className="font-mono font-semibold">$0.00 USD</span>
                </div>
              </div>

              {/* Recuadro Grande en Azul Oscuro */}
              <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-lg text-right">
                <div className="flex items-center justify-between text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <span>Monto Total a Liquidar</span>
                  <span>TOTAL FACTURA</span>
                </div>

                <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatUsd(totalUsd)}
                </div>

                <div className="font-mono text-sm sm:text-base font-bold text-blue-400 mt-1">
                  Equivalente: {formatVes(totalVes)}
                </div>

                <p className="text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800">
                  Liquidación según Providencia Administrativa SENIAT / Tasa Oficial BCV
                </p>
              </div>
            </div>
          </div>

          {/* 5. PIE DE PÁGINA */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-left font-semibold text-slate-700">
                  Documento emitido bajo las providencias del SENIAT. Representación gráfica digital de factura electrónica autorizada.
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono text-[10px] text-slate-400">
                <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                  SNAT/2024/000042
                </span>
                <span>SHA-256: {sha256Fingerprint.slice(0, 16)}...</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-3">
              Generado a través de Nixi Business Tools · Sistema Certificado de Facturación y Cobranza para la República Bolivariana de Venezuela.
            </p>
          </div>
        </div>

        {/* BOTTOM ACTION BAR - HIDDEN ON PRINT */}
        <div className="no-print print:hidden mt-4 flex items-center justify-between gap-3 px-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            ← Volver al listado
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-lg shadow-blue-900/30 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
