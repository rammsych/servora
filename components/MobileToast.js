'use client';

export default function MobileToast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-slate-900',
  };

  return (
    <div className="fixed bottom-5 left-4 right-4 z-50">
      <div
        className={`${styles[type] || styles.info} text-white rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3`}
      >
        <span className="text-sm font-medium">{message}</span>

        <button
          type="button"
          onClick={onClose}
          className="text-white/80 text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}