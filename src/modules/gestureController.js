export const GESTURES = {
  IDLE: 'IDLE',
  DRAW: 'DRAW',
  ERASE: 'ERASE',
  CLEAR: 'CLEAR',
  MOVE: 'MOVE',
};

export class GestureController {
  constructor() {
    this.currentGesture = GESTURES.IDLE;
    this.lastGesture = GESTURES.IDLE;
    this.gestureStartTime = Date.now();
  }

  detectGesture(landmarks) {
    if (!landmarks) return GESTURES.IDLE;

    // helpers
    const tipY = (idx) => landmarks[idx * 4 + 4]?.y;
    const pipY = (idx) => landmarks[idx * 4 + 2]?.y;
    const isFingerUp = (idx) => tipY(idx) < pipY(idx);

    const indexUp = isFingerUp(1);
    const middleUp = isFingerUp(2);
    const ringUp = isFingerUp(3);
    const pinkyUp = isFingerUp(4);
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    // 1) Pinch → ERASE
    if (distance < 0.05) return GESTURES.ERASE;

    // 2) Fist → CLEAR
    if (!indexUp && !middleUp && !ringUp && !pinkyUp) return GESTURES.CLEAR;

    // 3) Deux doigts → MOVE
    if (indexUp && middleUp && !ringUp && !pinkyUp) return GESTURES.MOVE;

    // 4) Index seul → DRAW (même si d'autres doigts sont un peu levés, on priorise DRAW)
    //    On assouplit la condition : si index est levé et que ce n'est ni pinch, ni fist, ni deux doigts
    if (indexUp) return GESTURES.DRAW;

    return GESTURES.IDLE;
  }

  update(landmarks) {
    const detected = this.detectGesture(landmarks);
    if (detected !== this.currentGesture) {
      this.lastGesture = this.currentGesture;
      this.currentGesture = detected;
      this.gestureStartTime = Date.now();
    }
    return this.currentGesture;
  }
}