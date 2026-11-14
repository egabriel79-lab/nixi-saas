import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Database, Lock, EyeOff, Smartphone, UserCheck } from 'lucide-react';

interface PrivacyViewProps {
  onBackToLanding: () => void;
  onNavigateToTerms?: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  onBackToLanding,
  onNavigateToTerms,
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protección de Datos · LOPD Venezuela</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Política de Privacidad
          </h1>

          <p className="text-sm text-slate-400">
            Última actualización: 14 de noviembre de 2026 · Adaptada a la Ley Orgánica de Protección de Datos Personales (LOPD) de la República Bolivariana de Venezuela
          </p>
        </header>

        {/* Commitment Banner */}
        <div className="mb-10 rounded-2xl bg-blue-500/10 border border-blue-500/25 p-5 flex items-start gap-3.5">
          <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-bold text-white">
              Compromiso de Confidencialidad y Soberanía de tus Datos
            </p>
            <p className="text-slate-300 leading-relaxed">
              En <strong className="text-white">Nixi</strong> tratamos la información financiera y personal de tu negocio bajo los principios de licitud, consentimiento informado, finalidad, proporcionalidad y seguridad establecidos en la <strong className="text-white">Ley Orgánica de Protección de Datos Personales (LOPD) de Venezuela</strong> y el artículo 60 de la Constitución Nacional.
            </p>
          </div>
        </div>

        {/* Legal Sections */}
        <article className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-300">
          {/* 1. Datos Recopilados */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <Database className="w-5 h-5 text-blue-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                1. Datos Personales y Empresariales que Recopilamos
              </h2>
            </div>
            <p>
              Para prestarte el servicio de facturación, gestión de cobranzas y control administrativo, recopilamos exclusivamente los datos estrictamente necesarios:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Datos de Identificación y Cuenta:</strong> Nombre completo, dirección de correo electrónico y rol dentro de la cuenta.
              </li>
              <li>
                <strong className="text-white">Datos Fiscales de tu Empresa:</strong> Razón social o nombre comercial y Registro de Información Fiscal (<strong className="text-white">RIF</strong>).
              </li>
              <li>
                <strong className="text-white">Datos de Facturación:</strong> Números de factura, fechas de emisión y vencimiento, montos en USD y Bolívares (VES), tasa BCV aplicada, alícuotas de IVA y estatus de cobro.
              </li>
              <li>
                <strong className="text-white">Información de Clientes:</strong> Nombre o razón social, RIF o cédula de identidad, límites de crédito, historial de saldos y datos de contacto que registres en tu cartera para emitir facturas o enviar recordatorios.
              </li>
            </ul>
          </section>

          {/* 2. Finalidad del Tratamiento */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              2. Finalidad del Tratamiento de los Datos
            </h2>
            <p>
              Conforme a la LOPD, tus datos son utilizados únicamente para:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Habilitar y mantener operativa tu cuenta, tus facturas y tu directorio de clientes dentro de Nixi.</li>
              <li>Calcular métricas financieras en tiempo real, reportes de cartera y conciliación de pagos.</li>
              <li>Gestionar la activación, periodo de prueba (7 días) y renovación mensual de tu suscripción al Plan Emprendedor.</li>
              <li>Brindarte soporte técnico y notificaciones operativas esenciales sobre el servicio.</li>
            </ul>
          </section>

          {/* 3. Almacenamiento y Seguridad en Supabase */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                3. Almacenamiento en la Nube y Seguridad (Supabase)
              </h2>
            </div>
            <p>
              La información de cuentas, empresas y registros de facturación se almacena en servidores en la nube proporcionados por <strong className="text-white">Supabase</strong> (infraestructura respaldada por PostgreSQL de grado empresarial).
            </p>
            <p>
              Implementamos medidas técnicas y organizativas orientadas a garantizar la integridad y confidencialidad de tu información:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Cifrado en tránsito:</strong> Todas las comunicaciones entre tu navegador y los servidores se transmiten mediante protocolos seguros <strong className="text-white">HTTPS / TLS</strong>.
              </li>
              <li>
                <strong className="text-white">Cifrado en reposo:</strong> Las bases de datos y respaldos en la nube cuentan con <strong className="text-white">cifrado en reposo (AES-256)</strong> para proteger la información almacenada frente a accesos no autorizados.
              </li>
            </ul>
          </section>

          {/* 4. No Compartición ni Venta a Terceros */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <EyeOff className="w-5 h-5 text-blue-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                4. Prohibición de Venta o Cesión a Terceros
              </h2>
            </div>
            <p>
              Nixi <strong className="text-white">NO vende, alquila, comercializa ni comparte tus datos personales, fiscales o la cartera de tus clientes con terceros</strong> con fines publicitarios, comerciales o de perfilamiento.
            </p>
            <p>
              Tu información solo podrá ser revelada en caso de requerimiento expreso y debidamente motivado por una autoridad judicial o administrativa competente conforme a las leyes de la República Bolivariana de Venezuela.
            </p>
          </section>

          {/* 5. Procesamiento de Pagos vía Pago Móvil */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                5. Pagos vía Pago Móvil y Datos Bancarios
              </h2>
            </div>
            <p>
              Los pagos correspondientes al Plan Emprendedor ($5 USD/mes) se procesan a través de <strong className="text-white">Pago Móvil interbancario</strong>. Para validar tu suscripción, únicamente solicitamos el número de referencia del comprobante, fecha, monto y datos básicos de confirmación.
            </p>
            <p>
              Nixi <strong className="text-white">nunca solicita ni almacena claves bancarias, PINes, coordenadas ni credenciales de acceso a tu banca en línea</strong>. Todos los datos asociados a la verificación de comprobantes se manejan de forma segura y confidencial exclusivamente para conciliar tu pago.
            </p>
          </section>

          {/* 6. Derechos del Titular (LOPD Venezuela) */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <UserCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                6. Derechos del Titular de los Datos (LOPD)
              </h2>
            </div>
            <p>
              De acuerdo con la Ley Orgánica de Protección de Datos Personales (LOPD) de Venezuela, como titular de los datos tienes derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Acceso:</strong> Conocer qué datos personales y fiscales se encuentran almacenados en tu cuenta.</li>
              <li><strong className="text-white">Rectificación y Actualización:</strong> Corregir o actualizar en cualquier momento tu nombre, correo, RIF o registros de clientes directamente desde el módulo de Perfil o solicitándolo al soporte.</li>
              <li><strong className="text-white">Supresión / Cancelación:</strong> Eliminar facturas específicas o solicitar la eliminación definitiva de tu cuenta y sus datos asociados.</li>
              <li><strong className="text-white">Revocación del Consentimiento y Oposición:</strong> Dejar de utilizar el servicio y solicitar la baja de tus registros cuando lo consideres oportuno.</li>
            </ul>
          </section>

          {/* 7. Contacto */}
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              7. Responsable del Tratamiento y Contacto
            </h2>
            <p>
              Para ejercer tus derechos de acceso, rectificación o eliminación conforme a la LOPD, o ante cualquier inquietud sobre privacidad y seguridad de datos en Nixi (emprendimiento en desarrollo), escríbenos a{' '}
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
            {onNavigateToTerms && (
              <>
                <span className="text-slate-700">•</span>
                <button
                  type="button"
                  onClick={onNavigateToTerms}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                >
                  Ver Términos y Condiciones
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
