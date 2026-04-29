import React, { useState, useRef, useCallback, useMemo } from 'react';
import CameraView from './components/CameraView';
import DrawingCanvas from './components/DrawingCanvas';
import HelpPanel from './components/HelpPanel';
import ControlPanel from './components/ControlPanel';
import { GestureInterpreter, CONTROL_GESTURES } from './modules/gestureInterpreter';
import { GESTURES } from './modules/gestureController';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [settings, setSettings] = useState({
    color: '#00ffff',
    lineWidth: 8,
    glowIntensity: 20,
  });

  // États UI (indicateurs)
  const [gesture, setGesture] = useState(GESTURES.IDLE);
  const [landmark, setLandmark] = useState(null);
  const [fingertips, setFingertips] = useState([]);
  const [controlGesture, setControlGesture] = useState(CONTROL_GESTURES.IDLE);
  const [controlLandmark, setControlLandmark] = useState(null);
  const [controlFingertips, setControlFingertips] = useState([]);
  const [controlPinchDelta, setControlPinchDelta] = useState(0);
  const [controlAngleDelta, setControlAngleDelta] = useState(0);

  const [cameraVisible, setCameraVisible] = useState(true);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const canvasRef = useRef(null);
  const interpreter = useMemo(() => new GestureInterpreter(), []);
  const drawingActiveRef = useRef(false); // pour éviter les appels redondants

  const onResults = useCallback((results) => {
    if (!gesturesEnabled || !canvasRef.current) return;

    const { primary, secondary } = interpreter.interpret(results);

    // Mise à jour UI (pas critique pour la latence)
    setGesture(primary.gesture);
    setLandmark(primary.landmark);
    setFingertips(primary.fingertips);
    setControlGesture(secondary.gesture);
    setControlLandmark(secondary.landmark);
    setControlFingertips(secondary.fingertips);
    setControlPinchDelta(secondary.pinchDelta);
    setControlAngleDelta(secondary.angleDelta);

    // --- DESSIN IMMÉDIAT (sans attendre le geste) ---
    // On utilise directement la position de l'index primaire
    const primaryLandmark = primary.landmark;
    if (primaryLandmark) {
      const x = (1 - primaryLandmark.x) * window.innerWidth;
      const y = primaryLandmark.y * window.innerHeight;

      // Condition de dessin : si le geste détecté est DRAW OU si l'index est levé (via un calcul brut)
      // On peut aussi se fier au geste DRAW qui a été rendu plus réactif
      const shouldDraw = (primary.gesture === GESTURES.DRAW);
      if (shouldDraw) {
        canvasRef.current.addDrawPoint(x, y);
        drawingActiveRef.current = true;
      } else {
        if (drawingActiveRef.current) {
          canvasRef.current.endDrawStroke();
          drawingActiveRef.current = false;
        }
      }

      // Effacement
      if (primary.gesture === GESTURES.ERASE) {
        canvasRef.current.eraseAt(x, y);
      }
      // Clear
      if (primary.gesture === GESTURES.CLEAR) {
        canvasRef.current.clearAll();
      }
    } else {
      if (drawingActiveRef.current) {
        canvasRef.current.endDrawStroke();
        drawingActiveRef.current = false;
      }
    }

    // --- Contrôle (main gauche) ---
    canvasRef.current.setControlGesture(secondary.gesture);
    if (secondary.landmark) {
      const x = (1 - secondary.landmark.x) * window.innerWidth;
      const y = secondary.landmark.y * window.innerHeight;
      switch (secondary.gesture) {
        case CONTROL_GESTURES.MOVE:
          canvasRef.current.moveControl(x, y);
          break;
        case CONTROL_GESTURES.SCALE:
          canvasRef.current.scaleControl(secondary.pinchDelta);
          break;
        case CONTROL_GESTURES.ROTATE:
          canvasRef.current.rotateControl(secondary.angleDelta);
          break;
        default:
          canvasRef.current.releaseControl();
      }
    } else {
      canvasRef.current.releaseControl();
    }
  }, [interpreter, gesturesEnabled]);

  const handleSave = () => {
    const dataUrl = canvasRef.current?.save();
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `air-drawing-${Date.now()}.png`;
      link.click();
    }
  };

  const activeMode = controlGesture !== CONTROL_GESTURES.IDLE
    ? controlGesture.replace('CTRL_', '')
    : gesture;

  return (
    <div className="app-container">
      {cameraVisible && <CameraView onResults={onResults} />}
      <DrawingCanvas ref={canvasRef} settings={settings} />
      <ControlPanel
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        onClear={() => canvasRef.current?.clearAll()}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onSave={handleSave}
        onToggleCamera={() => setCameraVisible(!cameraVisible)}
        cameraVisible={cameraVisible}
        gestureVisible={gesturesEnabled}
        onToggleGestures={() => setGesturesEnabled(!gesturesEnabled)}
        onHelp={() => setIsHelpOpen(true)}
      />
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <AnimatePresence>
        {activeMode !== 'IDLE' && activeMode !== CONTROL_GESTURES.IDLE && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="gesture-status glass-meta"
          >
            {activeMode} MODE
          </motion.div>
        )}
      </AnimatePresence>

      {/* Affichage des points de repère (identique à avant) */}
      {fingertips.map((tip, i) => { /* ... votre code existant ... */ })}
      {controlFingertips.map((tip, i) => { /* ... votre code existant ... */ })}
      {!landmark && !controlLandmark && (
        <div className="overlay-message">👋 Raise your hand to start drawing</div>
      )}
    </div>
  );
}

export default App;