import React from 'react';

// Generate random snowflake data once at module level (keeps React render pure)
const generateSnowflakes = () => {
  const flakes = [];
  for (let i = 0; i < 50; i++) {
    flakes.push({
      id: i,
      left: (i * 2.1 + 7) % 100,
      top: (i * 0.4) % 20,
      size: 3 + (i % 5),
      opacity: 0.6 + ((i % 4) * 0.1),
      duration: 4 + (i % 4),
      delay: (i * 0.1) % 5,
    });
  }
  return flakes;
};
const SNOWFLAKES = generateSnowflakes();

const Snowfall = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
    {SNOWFLAKES.map((flake) => (
      <div
        key={flake.id}
        className="absolute rounded-full bg-white snowflake-particle"
        style={{
          left: `${flake.left}%`,
          top: `-${flake.top}px`,
          width: `${flake.size}px`,
          height: `${flake.size}px`,
          opacity: flake.opacity,
          animationDuration: `${flake.duration}s`,
          animationDelay: `${flake.delay}s`,
        }}
      />
    ))}
    <style>{`
      .snowflake-particle { animation: snowfall-anim 5s linear infinite; }
      @keyframes snowfall-anim {
        0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.8; }
        100% { transform: translateY(700px) translateX(30px) rotate(360deg); opacity: 0; }
      }
    `}</style>
  </div>
);

export default Snowfall;
