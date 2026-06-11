import React, { useEffect, useRef } from "react";

// Constellation particle canvas. Sits absolutely inside a relative parent.
// Pauses when offscreen or when the tab is hidden; disabled entirely for
// users who prefer reduced motion. Zero dependencies.
function ParticleField({ density = 14000, maxSpeed = 0.22, linkDist = 130 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    let raf = 0;
    let running = true;
    let particles = [];
    const mouse = { x: -9999, y: -9999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const sizeUp = () => {
      const { offsetWidth: w, offsetHeight: h } = canvas.parentElement;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(Math.floor((w * h) / density), 110);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * maxSpeed * 2,
        vy: (Math.random() - 0.5) * maxSpeed * 2,
        r: Math.random() * 1.6 + 0.6,
      }));
    };

    const tick = () => {
      if (!running) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // gentle pull toward the cursor
        const dxm = mouse.x - p.x;
        const dym = mouse.y - p.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 220 && dm > 0.001) {
          p.vx += (dxm / dm) * 0.012;
          p.vy += (dym / dm) * 0.012;
        }
        // speed cap
        const sp = Math.hypot(p.vx, p.vy);
        const cap = maxSpeed * 3;
        if (sp > cap) {
          p.vx = (p.vx / sp) * cap;
          p.vy = (p.vy / sp) * cap;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(122,140,255,0.55)";
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < linkDist) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(79,110,247,${(1 - d / linkDist) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onVisibility = () => {
      running = !document.hidden && inView;
      if (running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      }
    };

    let inView = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        onVisibility();
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    sizeUp();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", sizeUp);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mouseout", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", sizeUp);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseout", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, maxSpeed, linkDist]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none" }}
    />
  );
}

export default ParticleField;
