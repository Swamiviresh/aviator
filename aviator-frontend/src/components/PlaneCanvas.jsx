import React, { useRef, useEffect } from 'react';

const PlaneCanvas = ({ multiplier, status }) => {
  const canvasRef = useRef(null);
  const multiplierRef = useRef(multiplier);
  const statusRef = useRef(status);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  // Keep refs in sync without restarting the RAF loop
  useEffect(() => {
    multiplierRef.current = multiplier;
    statusRef.current = status;

    if (status === 'RUNNING' && startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }
    if (status === 'WAITING' || status === 'CRASHED') {
      startTimeRef.current = null;
    }
  }, [multiplier, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const render = (timestamp) => {
      const width = canvas.width;
      const height = canvas.height;
      const currentStatus = statusRef.current;
      const currentMultiplier = parseFloat(multiplierRef.current);

      // Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0a1a');
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      if (currentStatus === 'RUNNING' || currentStatus === 'CRASHED') {
        // Time-based progress for curve — completely decoupled from multiplier value
        // so force crash doesn't cause a visual jump
        let progress;
        if (currentStatus === 'RUNNING' && startTimeRef.current !== null) {
          const elapsed = timestamp - startTimeRef.current;
          // Curve fills over ~20 seconds for a natural feel
          progress = Math.min(elapsed / 20000, 0.95);
        } else {
          // CRASHED — freeze curve at wherever it was
          progress = Math.min(
            startTimeRef.current ? (performance.now() - startTimeRef.current) / 20000 : 0,
            0.95
          );
        }

        const maxX = width * 0.85;
        const maxY = height * 0.80;
        const currentX = progress * maxX;
        const currentY = height - Math.pow(progress, 1.4) * maxY;

        // Curve line
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(220, 38, 38, 0.7)';
        ctx.strokeStyle = currentStatus === 'CRASHED' ? '#888' : '#dc2626';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i <= progress; i += 0.005) {
          ctx.lineTo(i * maxX, height - Math.pow(i, 1.4) * maxY);
        }
        ctx.stroke();

        // Fill under curve
        ctx.shadowBlur = 0;
        const fill = ctx.createLinearGradient(0, height, 0, currentY);
        fill.addColorStop(0, 'rgba(220,38,38,0)');
        fill.addColorStop(1, currentStatus === 'CRASHED' ? 'rgba(100,100,100,0.12)' : 'rgba(220,38,38,0.15)');
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i <= progress; i += 0.005) {
          ctx.lineTo(i * maxX, height - Math.pow(i, 1.4) * maxY);
        }
        ctx.lineTo(currentX, height);
        ctx.closePath();
        ctx.fill();

        // Plane
        ctx.save();
        ctx.translate(currentX, currentY);
        const angle = -Math.atan2(Math.pow(progress, 0.4) * maxY, maxX * 0.005 * 10);
        ctx.rotate(Math.max(angle, -Math.PI / 3));

        if (currentStatus === 'CRASHED') {
          ctx.fillStyle = '#facc15';
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#facc15';
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffffff';
        }

        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-9, -7);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-9, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // ← empty deps: RAF loop starts once and never restarts

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Multiplier Display */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <h2 className={`text-5xl md:text-6xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] ${
          status === 'CRASHED' ? 'text-red-600' : 'text-white'
        }`}>
          {multiplier}x
        </h2>
        {status === 'CRASHED' && (
          <div className="mt-3 px-5 py-1.5 bg-red-600 text-white font-black text-base uppercase tracking-[0.2em] rounded-lg animate-bounce shadow-2xl">
            Flew Away!
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-4 text-gray-600 font-mono text-[9px] tracking-widest uppercase">
        Live Trajectory
      </div>
    </div>
  );
};

export default PlaneCanvas;
