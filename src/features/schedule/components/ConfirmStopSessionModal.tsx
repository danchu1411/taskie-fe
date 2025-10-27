import { memo } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface ConfirmStopSessionModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmStopSessionModal = memo(function ConfirmStopSessionModal({
  open,
  onConfirm,
  onCancel,
}: ConfirmStopSessionModalProps) {
  const { t } = useLanguage();
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{t('today.modals.confirmStop.title')}</h3>
        <p className="mt-2 text-sm text-slate-500">
          {t('today.modals.confirmStop.message')}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            {t('today.modals.confirmStop.continue')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
          >
            {t('today.modals.confirmStop.stopSession')}
          </button>
        </div>
      </div>
    </div>
  );
});