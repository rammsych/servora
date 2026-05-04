'use client';

export default function Toast({ toast }) {
  if (!toast) return null;

  const styles = {
    success: 'bg-green-500/10 text-green-300 border-green-400/30',
    error: 'bg-red-500/10 text-red-300 border-red-400/30',
    info: 'bg-blue-500/10 text-blue-300 border-blue-400/30',
  };

  return (
    <div className="fixed right-5 top-5 z-50">
      <div
        className={`rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl ${styles[toast.type]}`}
      >
        {toast.message}
      </div>
    </div>
  );
}