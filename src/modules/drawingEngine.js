export class DrawingEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw(strokes, currentPath = null, selectedStrokeId = null, controlGesture = 'CTRL_IDLE') {
    this.clearCanvas();
    const ctx = this.ctx;

    const allStrokes = [...strokes];
    if (currentPath) allStrokes.push(currentPath);

    for (const stroke of allStrokes) {
      if (!stroke.points || stroke.points.length === 0) continue;

      if (!stroke.transform) {
        stroke.transform = { tx: 0, ty: 0, scale: 1, rotation: 0 };
        stroke.transformDirty = true;
      }

      let points;
      if (!stroke.transformDirty && stroke.transformPointsCache) {
        points = stroke.transformPointsCache;
      } else {
        points = this._getTransformedPoints(stroke);
        stroke.transformPointsCache = points;
        stroke.transformDirty = false;
      }

      const isSelected = (selectedStrokeId !== null && stroke.id === selectedStrokeId);

      ctx.save();

      if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, stroke.lineWidth / 2, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? '#ffffff' : stroke.color;
        ctx.fill();
        ctx.restore();
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.lineWidth = stroke.lineWidth * (stroke.transform.scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = (stroke.glowIntensity || 15) * 2.5;
        ctx.shadowColor = '#ffffff';
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      if (isSelected) {
        this._drawSelectionGuides(ctx, points, stroke, controlGesture);
      }

      ctx.restore();
    }
  }

  _getTransformedPoints(stroke) {
    const { tx, ty, scale, rotation } = stroke.transform;
    let cx = 0, cy = 0;
    for (const p of stroke.points) {
      cx += p.x;
      cy += p.y;
    }
    cx /= stroke.points.length;
    cy /= stroke.points.length;

    return stroke.points.map(p => {
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
  }

  _drawSelectionGuides(ctx, points, stroke, controlGesture) {
    let cx = 0, cy = 0;
    for (const p of points) { cx += p.x; cy += p.y; }
    cx /= points.length;
    cy /= points.length;

    let maxR = 0;
    for (const p of points) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d > maxR) maxR = d;
    }
    const guideRadius = maxR + 20;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, guideRadius, 0, 2 * Math.PI);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    if (controlGesture === 'CTRL_ROTATE') {
      const angle = stroke.transform?.rotation || 0;
      ctx.beginPath();
      ctx.arc(cx, cy, guideRadius + 8, -Math.PI/2, -Math.PI/2 + angle, angle < 0);
      ctx.strokeStyle = 'rgba(255,165,0,0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      const endAngle = -Math.PI/2 + angle;
      const ax = cx + (guideRadius+8)*Math.cos(endAngle);
      const ay = cy + (guideRadius+8)*Math.sin(endAngle);
      ctx.beginPath();
      ctx.arc(ax, ay, 5, 0, 2*Math.PI);
      ctx.fillStyle = 'rgba(255,165,0,0.9)';
      ctx.fill();
    } else if (controlGesture === 'CTRL_SCALE') {
      const scale = stroke.transform?.scale || 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, guideRadius * (0.5 + i*0.2), 0, 2*Math.PI);
        ctx.strokeStyle = `rgba(0,255,200,${0.15*(4-i)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,255,200,0.8)';
      ctx.font = '12px monospace';
      ctx.fillText(`${(scale*100).toFixed(0)}%`, cx-15, cy-guideRadius-12);
    } else if (controlGesture === 'CTRL_MOVE') {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, 2*Math.PI);
      ctx.fillStyle = 'rgba(100,180,255,0.6)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx-12, cy); ctx.lineTo(cx+12, cy);
      ctx.moveTo(cx, cy-12); ctx.lineTo(cx, cy+12);
      ctx.strokeStyle = 'rgba(100,180,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  saveAsImage() {
    return this.canvas.toDataURL('image/png');
  }
}