// Using global MediaPipe from CDN (added in index.html)
const getHandsConstructor = () => {
  if (typeof window !== 'undefined' && window.Hands) return window.Hands;
  return null;
};

export class HandTracker {
  constructor(onResults, options = {}) {
    const HandsConstructor = getHandsConstructor();
    if (!HandsConstructor) {
      console.error('MediaPipe Hands not found. Ensure @mediapipe/hands is installed or CDN is loaded.');
      throw new Error('MediaPipe Hands not found');
    }

    this.hands = new HandsConstructor({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    // Options ultra-rapides pour le tracking
    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,            // le plus rapide (lite)
      minDetectionConfidence: 0.3,
      minTrackingConfidence: 0.4,
      selfieMode: false,             // désactive le miroir si possible
    });

    this.hands.onResults(onResults);

    // Pas de throttling : on traite chaque frame immédiatement
    // (optionnel: vous pouvez garder un champ pour fps limit, mais déconseillé)
  }

  async send(image) {
    // Envoi immédiat pour une latence minimale
    await this.hands.send({ image });
  }

  static getLandmark(results, index) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      return results.multiHandLandmarks[0][index];
    }
    return null;
  }

  static isFingerUp(landmarks, fingerIndex) {
    const tip = landmarks[fingerIndex * 4 + 4];
    const pip = landmarks[fingerIndex * 4 + 2];
    return tip.y < pip.y;
  }
}