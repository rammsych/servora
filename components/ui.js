export function Card({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl shadow-lg ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-400/5 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function ButtonPrimary({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-5 py-3 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] font-semibold ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonSecondary({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`border border-white/10 text-gray-300 px-5 py-3 rounded-xl hover:bg-white/5 font-semibold ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}