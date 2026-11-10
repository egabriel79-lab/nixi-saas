import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === 'ELIMINAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-base font-bold">
              Zona de Riesgo: Eliminar Cuenta
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-rose-500 hover:text-rose-800 hover:bg-rose-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700">
            Esta acción es irreversible. Se eliminará permanentemente la empresa,
            todos los folios fiscales emitidos, el historial de cobranzas y los registros de auditoría de <strong>Nixi</strong>.
          </p>

          <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100 text-xs text-rose-800">
            Para confirmar, escribe la palabra <strong>ELIMINAR</strong> a continuación:
          </div>

          <input
            type="text"
            placeholder="ELIMINAR"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
          />

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!isConfirmed}
              onClick={() => {
                onConfirmDelete();
                onClose();
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                isConfirmed
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer'
                  : 'bg-rose-200 text-rose-400 cursor-not-allowed'
              }`}
            >
              Confirmar y Borrar Cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
