"use client";

import { cn } from "@/utilities/shadcn";
import React, { useEffect, useMemo, useRef } from "react";

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
  baseOpacity?: number;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  baseOpacity = 0,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store all animated props in refs so the animation loop reads live values
  // without causing effect rebuilds (rerender-use-ref-transient-values)
  const propsRef = useRef({ flickerChance, maxOpacity, baseOpacity });
  propsRef.current = { flickerChance, maxOpacity, baseOpacity };

  // Parse color once (js-cache-function-results)
  const colorRGB = useMemo(() => {
    if (typeof window === "undefined") return [0, 0, 0] as const;
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    const ctx = c.getContext("2d");
    if (!ctx) return [0, 0, 0] as const;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    return [r, g, b] as const;
  }, [color]);

  // Single stable effect — no state, no callback deps, no rebuilds
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [r, g, b] = colorRGB;
    const dpr = window.devicePixelRatio || 1;
    const sz = Math.round(squareSize * dpr);
    const step = Math.round((squareSize + gridGap) * dpr);

    let cols = 0;
    let rows = 0;
    let squares: Float32Array;
    let imageData: ImageData;
    let isInView = false;
    let animationFrameId = 0;
    let lastTime = 0;

    function resize() {
      const w = width || container!.clientWidth;
      const h = height || container!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;

      cols = Math.floor(w / (squareSize + gridGap));
      rows = Math.floor(h / (squareSize + gridGap));
      squares = new Float32Array(cols * rows);

      // Allocate ImageData once, reuse every frame
      imageData = ctx!.createImageData(canvas!.width, canvas!.height);

      draw();
    }

    function update(dt: number) {
      const { flickerChance: chance, maxOpacity: max, baseOpacity: base } = propsRef.current;
      const decay = dt * 3;
      const len = squares.length;
      const chanceDt = chance * dt;
      const range = max - base;

      for (let i = 0; i < len; i++) {
        const sq = squares[i];
        if (max > 0 && Math.random() < chanceDt) {
          squares[i] = base + Math.random() * range;
        } else if (sq > base) {
          const next = sq - decay * (sq - base);
          squares[i] = next - base < 0.005 ? base : next;
        } else if (sq < base) {
          squares[i] = Math.min(base, sq + dt * 0.5);
        }
      }
    }

    function draw() {
      const data = imageData.data;
      const cw = canvas!.width;

      // Zero out the buffer
      data.fill(0);

      for (let i = 0; i < cols; i++) {
        const px = i * step;
        for (let j = 0; j < rows; j++) {
          const opacity = squares[i * rows + j];
          if (opacity < 0.005) continue;
          const py = j * step;
          const a = (opacity * 255 + 0.5) | 0; // fast round
          const pxEnd = px + sz;
          const pyEnd = py + sz;
          for (let y = py; y < pyEnd; y++) {
            const rowOffset = y * cw;
            for (let x = px; x < pxEnd; x++) {
              const idx = (rowOffset + x) << 2;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = a;
            }
          }
        }
      }

      ctx!.putImageData(imageData, 0, 0);
    }

    function animate(time: number) {
      if (!isInView) return;
      const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;
      update(dt);
      draw();
      animationFrameId = requestAnimationFrame(animate);
    }

    function startLoop() {
      if (!isInView) return;
      lastTime = 0;
      animationFrameId = requestAnimationFrame(animate);
    }

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        if (isInView) startLoop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [colorRGB, squareSize, gridGap, width, height]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
      />
    </div>
  );
};
