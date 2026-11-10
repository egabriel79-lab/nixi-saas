import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  CheckCircle,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Calendar,
  Building,
  Hash,
  AlertCircle,
  TrendingUp,
  UploadCloud,
  Camera,
  FileText,
  X,
} from 'lucide-react';
import { useBcv } from '../context/BcvContext';

interface CheckoutViewProps {
  onConfirmSuccess: (paymentData: {
    reference: string;
    date: string;
    bank: string;
    amountUsd: number;
    amountVes: number;
    bcvRate: number;
  }) => void;
  onBackToLanding: () => void;
  onShowToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

const VENEZUELAN_BANKS = [
  'Banesco Banco Universal (0134)',
  'Banco de Venezuela (0102)',
  'Banco Mercantil (0105)',
  'BBVA Provincial (0108)',
  'Bancamiga Banco Universal (0172)',
  'Banco Nacional de Crédito BNC (0191)',
  'Bancaribe (0114)',
  'Banco Bicentenario (0175)',
  'Banco Exterior (0115)',
  'Banco Plaza (0138)',
  '100% Banco (0156)',
  'Banco Caroní (0128)',
  'Banco Activo (0171)',
  'Banplus Banco Universal (0174)',
];

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  onConfirmSuccess,
  onBackToLanding,
  onShowToast,
}) => {
  const { bcvRate, formatVes } = useBcv();

  // Nixi Pago Móvil Destination Data (Datos oficiales)
  const NIXI_PAYMENT_INFO = {
    bank: 'Banco de Venezuela (0102)',
    phone: '0414-4975296',
    rif: '14324186',
    holder: 'Eloy Palma',
  };

  const amountUsd = 5.0;
  const amountVes = amountUsd * bcvRate;

  // Form states
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [issuingBank, setIssuingBank] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation & Loading states
  const [touched, setTouched] = useState({
    issuingBank: false,
    paymentDate: false,
    file: false,
    reference: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Field validation checks (Banco, Fecha, Archivo comprobante y Referencia)
  const isBankValid = Boolean(issuingBank);
  const isDateValid = Boolean(paymentDate);
  const isFileValid = Boolean(receiptFile);
  const isReferenceValid = reference.trim().length >= 4;
  const isFormValid = isBankValid && isDateValid && isFileValid && isReferenceValid;

  // File upload helpers
  const handleFileSelected = (file: File) => {
    setTouched((prev) => ({ ...prev, file: true }));
    setReceiptFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreviewUrl(null);
    }

    if (onShowToast) {
      onShowToast(`Archivo cargado: ${file.name}`, 'info');
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReceiptFile(null);
    setReceiptPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (onShowToast) {
      onShowToast(`Copiado: ${text}`, 'info');
    }
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleCopyAll = () => {
    const fullText = `PAGO MÓVIL NIXI\nBanco: ${NIXI_PAYMENT_INFO.bank}\nTeléfono: ${NIXI_PAYMENT_INFO.phone}\nCédula / RIF: ${NIXI_PAYMENT_INFO.rif}\nTitular: ${NIXI_PAYMENT_INFO.holder}\nMonto: Bs. ${amountVes.toFixed(2)}`;
    navigator.clipboard.writeText(fullText);
    setCopiedField('all');
    if (onShowToast) {
      onShowToast('Datos de Pago Móvil copiados al portapapeles', 'info');
    }
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      issuingBank: true,
      paymentDate: true,
      file: true,
      reference: true,
    });

    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    // Simulate 2s validation as requested
    setTimeout(() => {
      setIsLoading(false);

      const paymentRecord = {
        reference: reference.trim(),
        date: paymentDate,
        bank: issuingBank,
        amountUsd,
        amountVes,
        bcvRate,
        fileName: receiptFile ? receiptFile.name : undefined,
      };

      // Store in localStorage for User Profile inspection
      try {
        localStorage.setItem('nixi_subscription_plan', 'Plan Emprendedor');
        localStorage.setItem('nixi_subscription_status', 'Activo');
        localStorage.setItem('nixi_subscription_payment', JSON.stringify(paymentRecord));
        // Calculate expiration date + 30 days
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 30);
        localStorage.setItem('nixi_subscription_renewal', expDate.toISOString());
      } catch (err) {
        console.error(err);
      }

      if (onShowToast) {
        onShowToast('✅ Pago recibido. ¡Bienvenido a Nixi!', 'success');
      }

      onConfirmSuccess(paymentRecord);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center bg-[#0a0f1c] text-slate-100 relative overflow-x-hidden selection:bg-blue-600 selection:text-white py-10 sm:py-16">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-blue-600/[0.08] blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 -right-24 w-[400px] h-[400px] bg-emerald-600/[0.05] blur-[140px] pointer-events-none rounded-full" />

      {/* Botón 'Volver' en la parte superior izquierda */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al inicio</span>
        </button>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Encabezado Principal */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pago Móvil Exclusivo · Venezuela</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Activa tu Plan Emprendedor
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Suscripción Nixi - $5.00 USD
          </p>
        </div>

        {/* 2. Tarjeta del Monto a Pagar en Bolívares (Resaltado Grande) */}
        <div className="rounded-2xl bg-gradient-to-b from-[#111827] to-[#0d1322] border-2 border-blue-500/40 p-6 sm:p-7 shadow-2xl shadow-blue-600/15 mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total a Transferir por Pago Móvil
          </span>

          <div className="text-3xl sm:text-5xl font-black font-mono text-emerald-400 tracking-tight my-2">
            Bs. {amountVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="font-semibold text-slate-300 font-mono">$5.00 USD</span>
            <span>·</span>
            <span className="flex items-center gap-1 font-mono text-blue-400">
              <TrendingUp className="w-3.5 h-3.5" />
              Tasa Oficial BCV: Bs. {bcvRate.toFixed(2)} / USD
            </span>
          </div>
        </div>

        {/* 3. Datos para realizar el Pago Móvil (Instrucciones de Destino) */}
        <div className="rounded-2xl bg-[#111827]/90 border border-slate-700/80 p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>Datos Destino para Pago Móvil</span>
            </div>
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-500/20 transition-all cursor-pointer"
            >
              {copiedField === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Datos Copiados!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Todos los Datos</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Banco */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Banco Destino</span>
                <span className="font-bold text-white text-sm mt-0.5 block">
                  {NIXI_PAYMENT_INFO.bank}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(NIXI_PAYMENT_INFO.bank, 'bank')}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Copiar banco"
              >
                {copiedField === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Teléfono */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Teléfono Pago Móvil</span>
                <span className="font-bold font-mono text-white text-sm mt-0.5 block">
                  {NIXI_PAYMENT_INFO.phone}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(NIXI_PAYMENT_INFO.phone, 'phone')}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Copiar teléfono"
              >
                {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Cédula / RIF */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Cédula / RIF</span>
                <span className="font-bold font-mono text-white text-sm mt-0.5 block">
                  {NIXI_PAYMENT_INFO.rif}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(NIXI_PAYMENT_INFO.rif, 'rif')}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Copiar Cédula / RIF"
              >
                {copiedField === 'rif' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Titular */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Titular de la Cuenta</span>
                <span className="font-bold text-white text-sm mt-0.5 block truncate">
                  {NIXI_PAYMENT_INFO.holder}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(NIXI_PAYMENT_INFO.holder, 'holder')}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Copiar titular"
              >
                {copiedField === 'holder' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
            <span className="text-blue-400 font-bold shrink-0">ℹ️ Instrucción:</span>
            <span>Realiza el Pago Móvil por el monto exacto en Bolívares y luego coloca la referencia aquí abajo.</span>
          </p>

          {/* Mensaje del Fundador (Transparencia) */}
          <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-3 text-slate-300">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
              <span className="font-bold text-white block text-xs tracking-wide">
                Nota del Fundador:
              </span>
              <p className="text-slate-300 font-normal">
                Nixi actualmente es un emprendimiento en fase de crecimiento y no una empresa registrada. Los pagos se reciben a nombre de nuestro creador, Eloy Palma, garantizando total transparencia. Agradecemos enormemente tu confianza para impulsar este proyecto venezolano.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Formulario de Confirmación (Para el usuario) */}
        <form onSubmit={handleSubmit} className="rounded-2xl bg-[#111827]/90 border border-slate-700/80 p-5 sm:p-7 space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Reportar Comprobante de Pago</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingresa los datos para validar tu transferencia y activar tu espacio inmediatamente.
            </p>
          </div>

          {/* Campo: Banco Emisor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Banco Emisor (Desde dónde pagaste) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={issuingBank}
                onChange={(e) => setIssuingBank(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, issuingBank: true }))}
                className={`w-full pl-10 pr-3.5 py-3 text-sm bg-[#111827] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer ${
                  touched.issuingBank && !isBankValid
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-slate-700'
                }`}
              >
                <option value="" disabled>Selecciona el banco emisor...</option>
                {VENEZUELAN_BANKS.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-white">
                    {b}
                  </option>
                ))}
              </select>
            </div>
            {touched.issuingBank && !isBankValid && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Este campo es requerido. Por favor selecciona tu banco.</span>
              </p>
            )}
          </div>

          {/* 2. Campo: Fecha del Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Fecha del Pago <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, paymentDate: true }))}
                className={`w-full pl-10 pr-3.5 py-3 text-sm bg-[#111827] border rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all ${
                  touched.paymentDate && !isDateValid
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-slate-700'
                }`}
              />
            </div>
            {touched.paymentDate && !isDateValid && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Este campo es requerido.</span>
              </p>
            )}
          </div>

          {/* 3. Zona para subir la imagen (Drag & Drop) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Comprobante de Pago <span className="text-rose-400">*</span>
            </label>

            {/* Input oculto de archivo para abrir galería o selector */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />

            {!receiptFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-6 sm:p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center group ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : touched.file && !isFileValid
                    ? 'border-red-500/80 bg-red-500/5 hover:border-red-400'
                    : 'border-slate-700 hover:border-blue-500/80 bg-slate-900/60 hover:bg-slate-900/90'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Sube tu comprobante de pago (captura de pantalla o PDF)
                </p>

                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Haz clic para abrir tu galería o archivos, o arrastra el comprobante aquí
                </p>

                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-3 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  Formatos: PNG, JPG, JPEG, WEBP o PDF
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/20 p-4 sm:p-5 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                          Comprobante cargado
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs mt-0.5">
                        {receiptFile.name}
                      </p>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        {(receiptFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 rounded-lg transition-colors cursor-pointer"
                    >
                      Cambiar archivo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {touched.file && !isFileValid && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Este campo es requerido. Por favor adjunta el comprobante de tu Pago Móvil.</span>
              </p>
            )}
          </div>

          {/* 4. Campo: Número de Referencia (Justo debajo de la caja de subir comprobante) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Número de Referencia <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Ej: 089234 (el número que aparece en tu comprobante)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, reference: true }))}
                className={`w-full pl-10 pr-3.5 py-3 text-sm bg-[#111827] border rounded-lg text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all ${
                  touched.reference && !isReferenceValid
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-slate-700'
                }`}
              />
            </div>
            {touched.reference && !isReferenceValid && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Este campo es requerido (mínimo 4 dígitos).</span>
              </p>
            )}
          </div>

          {/* Botón Grande: Confirmar Pago y Activar Cuenta */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`w-full py-4 px-6 text-sm sm:text-base font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 ${
                !isFormValid || isLoading
                  ? 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-xl shadow-blue-600/35 hover:shadow-blue-500/50 cursor-pointer hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Validando pago...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Confirmar Pago y Activar Cuenta</span>
                </>
              )}
            </button>
            {!isFormValid && (
              <p className="text-[11px] text-slate-500 text-center mt-2 font-medium">
                Selecciona banco emisor, fecha, sube tu comprobante y escribe la referencia para activar.
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Activación inmediata con conciliación interbancaria</span>
          </div>
        </form>
      </div>
    </div>
  );
};
