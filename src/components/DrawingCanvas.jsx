import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DrawingEngine } from '../modules/drawingEngine';
import { StrokeManager } from '../modules/strokeManager';
import { InteractionEngine } from '../modules/interactionEngine';
import { TransformEngine } from '../modules/transformEngine';

const DrawingCanvas = forwardRef(({ settings }, ref) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const managerRef = useRef(null);
  const interactionRef = useRef(null);
  const transformRef = useRef(null);
  const currentPathRef = useRef(null);
  const controlGestureRef = useRef('CTRL_IDLE');

  useImperativeHandle(ref, () => ({
    // --- Dessin ---
    addDrawPoint: (x, y) => {
      if (!currentPathRef.current) {
        currentPathRef.current = {
          points: [{ x, y }],
          color: settings.color,
          lineWidth: settings.lineWidth,
          glowIntensity: settings.glowIntensity,
          transform: { tx: 0, ty: 0, scale: 1, rotation: 0 },
          transformDirty: true,
        };
      } else {
        currentPathRef.current.points.push({ x, y });
      }
    },
    endDrawStroke: () => {
      if (currentPathRef.current && currentPathRef.current.points.length > 0) {
        managerRef.current.addStroke(
          currentPathRef.current.points,
          settings.color,
          settings.lineWidth,
          settings.glowIntensity
        );
        currentPathRef.current = null;
      }
    },
    eraseAt: (x, y) => {
      if (currentPathRef.current) {
        // Terminer le trait en cours avant d'effacer
        if (currentPathRef.current.points.length > 0) {
          managerRef.current.addStroke(
            currentPathRef.current.points,
            settings.color,
            settings.lineWidth,
            settings.glowIntensity
          );
          currentPathRef.current = null;
        }
      }
      interactionRef.current?.handleErase(x, y);
    },
    clearAll: () => managerRef.current?.clear(),
    undo: () => managerRef.current?.undo(),
    redo: () => managerRef.current?.redo(),
    save: () => engineRef.current?.saveAsImage(),

    // --- Contrôle (main gauche) ---
    setControlGesture: (gesture) => { controlGestureRef.current = gesture; },
    moveControl: (x, y) => transformRef.current?.handleMove(x, y),
    scaleControl: (delta) => transformRef.current?.handleScale(delta),
    rotateControl: (delta) => transformRef.current?.handleRotate(delta),
    releaseControl: () => transformRef.current?.releaseAll(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    managerRef.current = new StrokeManager();
    interactionRef.current = new InteractionEngine(managerRef.current);
    transformRef.current = new TransformEngine(managerRef.current);
    engineRef.current = new DrawingEngine(canvas);

    let animationFrameId;
    const renderLoop = () => {
      if (engineRef.current && managerRef.current) {
        const selectedId = transformRef.current?.getSelectedStrokeId() ?? null;
        engineRef.current.draw(
          managerRef.current.getAllStrokes(),
          currentPathRef.current,
          selectedId,
          controlGestureRef.current
        );
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    />
  );
});

export default DrawingCanvas;