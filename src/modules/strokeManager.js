export class StrokeManager {
  constructor() {
    this.strokes = [];
    this.redoStack = [];
    this._nextId = 1;
    this.globalTransformVersion = 0;
  }

  addStroke(points, color, lineWidth, glowIntensity) {
    const newStroke = {
      id: this._nextId++,
      points: [...points],
      color,
      lineWidth,
      glowIntensity,
      transform: { tx: 0, ty: 0, scale: 1, rotation: 0 },
      transformDirty: true,
      transformPointsCache: null,
    };
    this.strokes.push(newStroke);
    this.redoStack = [];
    this.globalTransformVersion++;
    return newStroke;
  }

  removeStroke(id) {
    this.strokes = this.strokes.filter(s => s.id !== id);
    this.globalTransformVersion++;
  }

  undo() {
    if (this.strokes.length > 0) {
      this.redoStack.push(this.strokes.pop());
      this.globalTransformVersion++;
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      this.strokes.push(this.redoStack.pop());
      this.globalTransformVersion++;
    }
  }

  clear() {
    this.strokes = [];
    this.redoStack = [];
    this.globalTransformVersion++;
  }

  markTransformDirty(strokeId) {
    const stroke = this.getStroke(strokeId);
    if (stroke) {
      stroke.transformDirty = true;
      this.globalTransformVersion++;
    }
  }

  getStroke(id) {
    return this.strokes.find(s => s.id === id);
  }

  getAllStrokes() {
    return this.strokes;
  }

  // Optimisation : échantillonnage pour les tests d'intersection
  findIntersectingStrokes(x, y, radius) {
    const hits = [];
    for (const stroke of this.strokes) {
      if (this._doesStrokeIntersectCircleFast(stroke, x, y, radius)) {
        hits.push(stroke.id);
      }
    }
    return hits;
  }

  findNearestStroke(x, y, threshold) {
    let nearestId = null;
    let minDistance = threshold;

    for (const stroke of this.strokes) {
      const step = Math.max(1, Math.floor(stroke.points.length / 50));
      for (let i = 0; i < stroke.points.length - 1; i += step) {
        const dist = this._distanceToSegment(
          x, y,
          stroke.points[i].x, stroke.points[i].y,
          stroke.points[i+1].x, stroke.points[i+1].y
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestId = stroke.id;
        }
      }
      if (stroke.points.length === 1) {
        const dx = x - stroke.points[0].x;
        const dy = y - stroke.points[0].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDistance) {
          minDistance = dist;
          nearestId = stroke.id;
        }
      }
    }
    return nearestId;
  }

  _doesStrokeIntersectCircleFast(stroke, cx, cy, radius) {
    const step = Math.max(1, Math.floor(stroke.points.length / 30));
    for (let i = 0; i < stroke.points.length - 1; i += step) {
      const dist = this._distanceToSegment(
        cx, cy,
        stroke.points[i].x, stroke.points[i].y,
        stroke.points[i+1].x, stroke.points[i+1].y
      );
      if (dist <= radius + (stroke.lineWidth / 2)) return true;
    }
    if (stroke.points.length === 1) {
      const dx = cx - stroke.points[0].x;
      const dy = cy - stroke.points[0].y;
      if (Math.sqrt(dx*dx + dy*dy) <= radius + (stroke.lineWidth/2)) return true;
    }
    return false;
  }

  _distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      const ddx = px - x1, ddy = py - y1;
      return Math.sqrt(ddx*ddx + ddy*ddy);
    }
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx*dx + dy*dy);
    if (t < 0) {
      const ddx = px - x1, ddy = py - y1;
      return Math.sqrt(ddx*ddx + ddy*ddy);
    } else if (t > 1) {
      const ddx = px - x2, ddy = py - y2;
      return Math.sqrt(ddx*ddx + ddy*ddy);
    }
    const nx = x1 + t * dx, ny = y1 + t * dy;
    const ddx = px - nx, ddy = py - ny;
    return Math.sqrt(ddx*ddx + ddy*ddy);
  }
}