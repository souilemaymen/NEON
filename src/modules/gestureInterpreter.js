import { GestureController, GESTURES } from './gestureController';

export const CONTROL_GESTURES = {
  IDLE: 'CTRL_IDLE',
  MOVE: 'CTRL_MOVE',
  SCALE: 'CTRL_SCALE',
  ROTATE: 'CTRL_ROTATE',
};

export class GestureInterpreter {
  constructor() {
    this.primaryController = new GestureController();
    this.controlGesture = CONTROL_GESTURES.IDLE;
    this.lastPinchDistance = null;
    this.lastHandAngle = null;
    this._lastControlGesture = CONTROL_GESTURES.IDLE;
    this._idleFrameCount = 0;
    this._idleFramesRequired = 4;
    this.MIN_PINCH_DELTA = 0.002;
    this.MIN_ANGLE_DELTA = 0.01;
  }

  interpret(results) {
    const output = {
      primary: { gesture: GESTURES.IDLE, landmark: null, fingertips: [] },
      secondary: { gesture: CONTROL_GESTURES.IDLE, landmark: null, fingertips: [], pinchDelta: 0, angleDelta: 0 },
    };

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.lastPinchDistance = null;
      this.lastHandAngle = null;
      return output;
    }

    let primaryLandmarks = null;
    let secondaryLandmarks = null;

    if (results.multiHandLandmarks.length === 1) {
      primaryLandmarks = results.multiHandLandmarks[0];
    } else if (results.multiHandLandmarks.length >= 2) {
      const handedness = results.multiHandedness || [];
      let primaryIdx = 0, secondaryIdx = 1;
      if (handedness.length >= 2 && handedness[0]?.label === 'Right') {
        primaryIdx = 1; secondaryIdx = 0;
      }
      primaryLandmarks = results.multiHandLandmarks[primaryIdx];
      secondaryLandmarks = results.multiHandLandmarks[secondaryIdx];
    }

    if (primaryLandmarks) {
      output.primary.gesture = this.primaryController.update(primaryLandmarks);
      output.primary.landmark = primaryLandmarks[8];
      output.primary.fingertips = [4,8,12,16,20].map(i => primaryLandmarks[i]);
    }

    if (secondaryLandmarks) {
      const result = this._detectControlGesture(secondaryLandmarks);
      let rawGesture = result.gesture;

      if (rawGesture === CONTROL_GESTURES.IDLE) {
        this._idleFrameCount++;
        if (this._idleFrameCount < this._idleFramesRequired && this._lastControlGesture !== CONTROL_GESTURES.IDLE) {
          rawGesture = this._lastControlGesture;
        } else {
          this._lastControlGesture = CONTROL_GESTURES.IDLE;
        }
      } else {
        this._idleFrameCount = 0;
        this._lastControlGesture = rawGesture;
      }

      output.secondary.gesture = rawGesture;
      output.secondary.landmark = secondaryLandmarks[8];
      output.secondary.fingertips = [4,8,12,16,20].map(i => secondaryLandmarks[i]);
      output.secondary.pinchDelta = Math.abs(result.pinchDelta) < this.MIN_PINCH_DELTA ? 0 : result.pinchDelta;
      output.secondary.angleDelta = Math.abs(result.angleDelta) < this.MIN_ANGLE_DELTA ? 0 : result.angleDelta;
    } else {
      this.lastPinchDistance = null;
      this.lastHandAngle = null;
      this._lastControlGesture = CONTROL_GESTURES.IDLE;
      this._idleFrameCount = 0;
    }

    return output;
  }

  _detectControlGesture(landmarks) {
    const result = { gesture: CONTROL_GESTURES.IDLE, pinchDelta: 0, angleDelta: 0 };

    const isFingerUp = (fingerIdx) => {
      const tip = landmarks[fingerIdx*4+4];
      const pip = landmarks[fingerIdx*4+2];
      return tip.y < pip.y;
    };

    const indexUp = isFingerUp(1);
    const middleUp = isFingerUp(2);
    const ringUp = isFingerUp(3);
    const pinkyUp = isFingerUp(4);
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const wrist = landmarks[0];
    const middleBase = landmarks[9];

    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const handAngle = Math.atan2(middleBase.y - wrist.y, middleBase.x - wrist.x);

    if (pinchDist < 0.06) {
      result.gesture = CONTROL_GESTURES.SCALE;
      if (this.lastPinchDistance !== null) {
        result.pinchDelta = pinchDist - this.lastPinchDistance;
      }
      this.lastPinchDistance = pinchDist;
      this.lastHandAngle = null;
      return result;
    }
    this.lastPinchDistance = null;

    if (indexUp && middleUp && ringUp && pinkyUp) {
      result.gesture = CONTROL_GESTURES.ROTATE;
      if (this.lastHandAngle !== null) {
        let delta = handAngle - this.lastHandAngle;
        if (Math.abs(delta) > Math.PI) delta = 0;
        result.angleDelta = delta;
      }
      this.lastHandAngle = handAngle;
      return result;
    }
    this.lastHandAngle = null;

    if (indexUp && middleUp && !ringUp && !pinkyUp) {
      result.gesture = CONTROL_GESTURES.MOVE;
    }

    return result;
  }
}