import React, { useEffect } from 'react';
import { ArrowLeft, FileText, ShieldAlert, Scale, CreditCard, AlertTriangle, Info } from 'lucide-react';

interface TermsViewProps {
  onBackToLanding: () => void;
  onNavigateToPrivacy?: () => void;
}

export const TermsView: React.FC<TermsViewProps> = ({
  onBackToLanding,
  onNavigateToPrivacy,
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-300 selection:bg-blue-600 selection:text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Top Bar: Volver al inicio */}
        <div className="flex items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-800/80">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>Volver al inicio</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              N
            </div>
            <span className="font-bold text-white tracking-tight">Nixi</span>
          </div>
        </div>

        {/* Document Header */}
        <header className="mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Scale className="w-3.5 h-3.5" />
            <span>Documento Legal · SaaS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Términos y Condiciones de Uso
          </h1>

          <p className="text-sm text-slate-400">
            Última actualización: 14 de noviembre de 2026 · Aplicable en la República Bolivariana de Venezuela
          </p>
        </header>

        {/* Early-stage notice banner */}
        <div className="mb-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-5 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-bold text-white">
              Nota sobre Etapa Temprana y Naturaleza del Proyecto
            </p>
            <p className="text-slate-300 leading-relaxed">
              Actualmente, <strong className="text-white">Nixi</strong> es un emprendimiento tecnológico independiente en etapa de desarrollo activo y <strong className="text-white">no constituye una compañía anónima (C.A.) ni una persona jurídica registrada</strong>. El uso de la plataforma implica la comprensión y aceptación expresa de esta condición.
            </p>
          </div>
        </div>

        {/* Legal Sections */}
        <article className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-300">
          {/* 1. Identificación del Servicio */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <FileText className="w-5 h-5 text-blue-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                1. Identificación y Objeto del Servicio
              </h2>
            </div>
            <p>
              <strong className="text-white">Nixi</strong> es una plataforma de software como servicio (SaaS) diseñada para la gestión administrativa de facturación, control de cuentas por cobrar, seguimiento de cartera de clientes, cálculo referencial en doble moneda (USD / VES conforme a la tasa del Banco Central de Venezuela) y envío de recordatorios de cobro.
            </p>
            <p>
              Al crear una cuenta, acceder o utilizar cualquier módulo de Nixi, usted (en adelante, el <strong className="text-white">&ldquo;Usuario&rdquo;</strong>) declara haber leído, comprendido y aceptado íntegramente estos Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, deberá abstenerse de utilizar el servicio.
            </p>
          </section>

          {/* 2. Plan, Prueba Gratuita y Precios */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                2. Plan Emprendedor, Prueba Gratuita y Facturación
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Periodo de Prueba Gratuita:</strong> Toda cuenta nueva incluye <strong className="text-white">7 días calendario de prueba gratuita</strong> para evaluar las funcionalidades de la plataforma sin obligación de compra previa.
              </li>
              <li>
                <strong className="text-white">Plan Emprendedor:</strong> Finalizado el periodo de prueba, el acceso continuo a la plataforma requiere la suscripción al <strong className="text-white">Plan Emprendedor por un monto de $5 USD mensuales</strong> (o su equivalente en Bolívares calculado a la tasa oficial del BCV vigente al momento de reportar el Pago Móvil).
              </li>
              <li>
                <strong className="text-white">Activación y Verificación:</strong> Los pagos realizados mediante Pago Móvil están sujetos a verificación de referencia bancaria antes de la renovación o activación definitiva del ciclo mensual de 30 días.
              </li>
            </ul>
          </section>

          {/* 3. Naturaleza del Servicio y Cumplimiento Fiscal (SENIAT) */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                3. Naturaleza de la Herramienta y Responsabilidad ante el SENIAT
              </h2>
            </div>
            <p>
              Nixi es estrictamente una <strong className="text-white">herramienta tecnológica de apoyo administrativo y gestión de cobros</strong>. Nixi no actúa como imprenta digital autorizada, proveedor de máquina fiscal, asesor tributario ni contador público certificado.
            </p>
            <p>
              En consecuencia, la <strong className="text-white">veracidad, exactitud e integridad de los datos fiscales</strong> ingresados (tales como RIF, razón social, alícuotas de IVA, montos, fechas y numeración de control), así como el <strong className="text-white">cumplimiento final de las obligaciones tributarias y deberes formales ante el SENIAT</strong>, son única y exclusiva responsabilidad del Usuario y su equipo contable.
            </p>
          </section>

          {/* 4. Cancelación y Política de No Reembolso */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              4. Cancelación de Suscripción y Política de Reembolsos
            </h2>
            <p>
              El Usuario es libre de cancelar su suscripción o dejar de utilizar Nixi en cualquier momento, sin penalizaciones ni contratos de permanencia forzosa, directamente desde su panel de perfil o dejando vencer su ciclo mensual sin renovar el pago.
            </p>
            <p>
              Dado que el servicio se habilita de forma inmediata tras la confirmación del pago y ofrece un periodo de prueba gratuita de 7 días para su evaluación previa, <strong className="text-white">no se realizan reembolsos totales ni parciales por meses ya pagados o periodos no utilizados</strong>.
            </p>
          </section>

          {/* 5. Limitación de Responsabilidad */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                5. Limitación de Responsabilidad
              </h2>
            </div>
            <p>
              El servicio se proporciona &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;, acorde con su condición de emprendimiento en desarrollo continuo. En la máxima medida permitida por la legislación aplicable, Nixi y sus desarrolladores <strong className="text-white">no serán responsables</strong> en ningún caso por:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Interrupciones temporales, latencias, mantenimientos o caídas del sistema o de proveedores externos de infraestructura en la nube.
              </li>
              <li>
                Pérdida parcial o total de información derivada de casos fortuitos, causas de fuerza mayor, fallas eléctricas, cortes de telecomunicaciones o ataques informáticos imprevisibles.
              </li>
              <li>
                Multas, sanciones, cierres, reparos fiscales o intereses impuestos por el <strong className="text-white">SENIAT</strong> u otros organismos públicos derivados del mal uso de la herramienta, errores de carga del Usuario o falta de emisión por medios fiscales homologados cuando la ley así lo exija.
              </li>
              <li>
                Lucro cesante, pérdida de ingresos o conflictos comerciales entre el Usuario y sus propios clientes.
              </li>
            </ul>
          </section>

          {/* 6. Etapa Temprana y Evolución de la Plataforma */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              6. Condición de Emprendimiento en Desarrollo y Modificaciones
            </h2>
            <p>
              El Usuario reconoce expresamente que Nixi se encuentra operado como un <strong className="text-white">emprendimiento en desarrollo y no como una compañía anónima (C.A.) constituida</strong>. Durante esta etapa, las funcionalidades, interfaz y capacidades técnicas pueden recibir mejoras, ajustes o cambios continuos para optimizar la experiencia.
            </p>
            <p>
              Nixi podrá actualizar estos Términos y Condiciones cuando resulte necesario para reflejar cambios legales, operativos o comerciales. El uso continuado de la plataforma tras dichas actualizaciones constituirá la aceptación de las mismas.
            </p>
          </section>

          {/* 7. Contacto */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              7. Contacto y Consultas
            </h2>
            <p>
              Para cualquier duda relacionada con estos Términos y Condiciones, facturación de tu plan o soporte técnico, puedes comunicarte directamente con el equipo fundador a través del correo electrónico{' '}
              <a
                href="mailto:egabriel79@gmail.com"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                egabriel79@gmail.com
              </a>.
            </p>
          </section>
        </article>

        {/* Bottom navigation footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>© 2026 Nixi · Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackToLanding}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Volver al inicio
            </button>
            {onNavigateToPrivacy && (
              <>
                <span className="text-slate-700">•</span>
                <button
                  type="button"
                  onClick={onNavigateToPrivacy}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                >
                  Ver Política de Privacidad
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
