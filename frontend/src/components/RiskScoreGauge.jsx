import React, { useEffect, useState } from 'react';

export default function RiskScoreGauge({ score }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Use a 270 degree arc
  const arcLength = (270 / 360) * circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * arcLength;

  let color = '#10b981';
  let label = 'LOW';
  if (score >= 40) { color = '#f59e0b'; label = 'MEDIUM'; }
  if (score >= 70) { color = '#ef4444'; label = 'HIGH'; }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg height="100%" width="100%" className="transform -rotate-[135deg]">
          {/* Background circle */}
          <circle
            stroke="#e0f2fe"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            r={normalizedRadius}
            cx="50%"
            cy="50%"
            strokeLinecap="round"
          />
          {/* Foreground circle */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            r={normalizedRadius}
            cx="50%"
            cy="50%"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center pt-4">
          <span className="text-4xl font-bold text-[#002b49]">{animatedScore}</span>
          <span className="text-sm font-bold tracking-wide" style={{ color }}>{label}</span>
        </div>
      </div>
    </div>
  );
}
