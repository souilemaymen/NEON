export class TransformEngine {
  constructor(strokeManager) {
    this.strokeManager = strokeManager;
    this.selectedStrokeId = null;
    this.lastX = null;
    this.lastY = null;
    this.moveThreshold = 60;

    this.velocityX = 0;
    this.velocityY = 0;
    this.inertiaDecay = 0.92;
    this.inertiaActive = false;
    this._inertiaFrame = null;
  }

  selectNearest(x, y) {
    if (this.selectedStrokeId !== null) return;
    let closestId = null;
    let closestDist = this.moveThreshold;
    const strokes = this.strokeManager.getAllStrokes();

    for (const stroke of strokes) {
      const tPoints = this._getTransformedPoints(stroke);
      for (let i = 0; i < tPoints.length - 1; i++) {
        const dist = this._distToSegment(x, y, tPoints[i].x, tPoints[i].y, tPoints[i+1].x, tPoints[i+1].y);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = stroke.id;
        }
      }
      if (tPoints.length === 1) {
        const dx = x - tPoints[0].x, dy = y - tPoints[0].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < closestDist) { closestDist = dist; closestId = stroke.id; }
      }
    }

    if (closestId !== null) {
      this.selectedStrokeId = closestId;
      this.lastX = x;
      this.lastY = y;
      this._stopInertia();
    }
  }

  getSelectedStrokeId() {
    return this.selectedStrokeId;
  }

  handleMove(x, y) {
    if (this.selectedStrokeId === null) {
      this.selectNearest(x, y);
      return;
    }
    const stroke = this.strokeManager.getStroke(this.selectedStrokeId);
    if (!stroke) return;

    if (this.lastX !== null && this.lastY !== null) {
      const dx = x - this.lastX;
      const dy = y - this.lastY;
      stroke.transform.tx += dx;
      stroke.transform.ty += dy;
      this.velocityX = dx;
      this.velocityY = dy;
      this.strokeManager.markTransformDirty(this.selectedStrokeId);
    }
    this.lastX = x;
    this.lastY = y;
  }

  handleScale(pinchDelta) {
    if (this.selectedStrokeId === null) return;
    const stroke = this.strokeManager.getStroke(this.selectedStrokeId);
    if (!stroke) return;
    const scaleFactor = 1 + (pinchDelta * 8);
    stroke.transform.scale *= scaleFactor;
    stroke.transform.scale = Math.max(0.1, Math.min(5, stroke.transform.scale));
    this.strokeManager.markTransformDirty(this.selectedStrokeId);
  }

  handleRotate(angleDelta) {
    if (this.selectedStrokeId === null) return;
    const stroke = this.strokeManager.getStroke(this.selectedStrokeId);
    if (!stroke) return;
    stroke.transform.rotation += angleDelta;
    this.strokeManager.markTransformDirty(this.selectedStrokeId);
  }

  snapRotation() {
    if (this.selectedStrokeId === null) return;
    const stroke = this.strokeManager.getStroke(this.selectedStrokeId);
    if (!stroke) return;
    const snap = Math.PI / 4;
    stroke.transform.rotation = Math.round(stroke.transform.rotation / snap) * snap;
    this.strokeManager.markTransformDirty(this.selectedStrokeId);
  }

  releaseAll() {
    if (this.selectedStrokeId !== null) {
      this.snapRotation();
      if (Math.abs(this.velocityX) > 0.5 || Math.abs(this.velocityY) > 0.5) {
        this._startInertia();
      }
    }
    this.selectedStrokeId = null;
    this.lastX = null;
    this.lastY = null;
  }

  _getTransformedPoints(stroke) {
    if (!stroke.transformDirty && stroke.transformPointsCache) {
      return stroke.transformPointsCache;
    }
    const { tx, ty, scale, rotation } = stroke.transform;
    let cx = 0, cy = 0;
    for (const p of stroke.points) {
      cx += p.x;
      cy += p.y;
    }
    cx /= stroke.points.length;
    cy /= stroke.points.length;
    const result = stroke.points.map(p => {
      let x = p.x - cx;
      let y = p.y - cy;
      x *= scale;
      y *= scale;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      return { x: rx + cx + tx, y: ry + cy + ty };
    });
    stroke.transformPointsCache = result;
    stroke.transformDirty = false;
    return result;
  }

  _distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.sqrt((px-x1)**2 + (py-y1)**2);
    const t = Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy) / (dx*dx + dy*dy)));
    const nx = x1 + t*dx, ny = y1 + t*dy;
    return Math.sqrt((px-nx)**2 + (py-ny)**2);
  }

  _startInertia() {
    const strokeId = this.selectedStrokeId;
    this.inertiaActive = true;
    const tick = () => {
      const stroke = this.strokeManager.getStroke(strokeId);
      if (!stroke || !this.inertiaActive) {
        this.inertiaActive = false;
        return;
      }
      this.velocityX *= this.inertiaDecay;
      this.velocityY *= this.inertiaDecay;
      stroke.transform.tx += this.velocityX;
      stroke.transform.ty += this.velocityY;
      this.strokeManager.markTransformDirty(strokeId);
      if (Math.abs(this.velocityX) < 0.1 && Math.abs(this.velocityY) < 0.1) {
        this.inertiaActive = false;
        return;
      }
      this._inertiaFrame = requestAnimationFrame(tick);
    };
    this._inertiaFrame = requestAnimationFrame(tick);
  }

  _stopInertia() {
    this.inertiaActive = false;
    if (this._inertiaFrame) {
      cancelAnimationFrame(this._inertiaFrame);
      this._inertiaFrame = null;
    }
    this.velocityX = 0;
    this.velocityY = 0;
  }
}