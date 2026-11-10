import React, { useState } from 'react';
import { Hammer, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { SECTION_METADATA } from '../../data/mockData';
import { DashboardSection } from '../../types';

interface ConstructionModuleProps {
  sectionId: DashboardSection;
  onBackToBilling: () => void;
  onNotifyToast: (msg: string) => void;
}

export const ConstructionModule: React.FC<ConstructionModuleProps> = ({
  sectionId,
  onBackToBilling,
  onNotifyToast,
}) => {
  const meta = SECTION_METADATA[sectionId] || {
    title: 'Módulo en desarrollo',
    description: 'Esta sección se encuentra en proceso de implementación.',
    features: ['Optimización de flujos de trabajo', 'Integración de servicios financieros'],
    upcomingSprint: 'En desarrollo',
  };

  const [requested, setRequested] = useState(false);

  const handleNotifyMe = () => {
    setRequested(true);
    onNotifyToast(`Has solicitado acceso anticipado a ${meta.title}`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {meta.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {meta.description}
        </p>
      </div>

      {/* Main Construction Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-10 text-center max-w-2xl mx-auto">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4">
          <Hammer className="w-7 h-7" />
        </div>

        <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
          Módulo en construcción
        </span>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-4">
          {meta.title}
        </h2>

        <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
          Estamos afinando este módulo para garantizar la máxima seguridad financiera y cumplimiento normativo.
        </p>

        {/* Feature roadmap preview */}
        <div className="mt-6 text-left bg-slate-50 rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Capacidades incluidas en el próximo despliegue:
          </span>
          <ul className="space-y-2 text-xs text-slate-600">
            {meta.features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleNotifyMe}
            disabled={requested}
            className={`w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
              requested
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {requested ? '✓ Notificación programada' : 'Solicitar acceso a la Beta'}
          </button>

          <button
            onClick={onBackToBilling}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <span>Volver a Facturación</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
