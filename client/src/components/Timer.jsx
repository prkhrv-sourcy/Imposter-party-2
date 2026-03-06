import React, { useState, useEffect } from 'react';

export default function Timer({ endTime }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(left);
    }, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime) return null;

  const isLow = remaining <= 5;

  return (
    <div className={`
      inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg
      ${isLow ? 'bg-red-500/20 text-red-400 animate-shake' : 'bg-indigo-500/20 text-indigo-300'}
      transition-colors duration-300
    `}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {remaining}s
    </div>
  );
}
