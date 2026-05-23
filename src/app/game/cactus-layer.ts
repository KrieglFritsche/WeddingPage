const SCALE = 2;

// Source rects in cactus.png: [srcX, srcY, srcW, srcH]
const SPRITES = [
  {  srcX:   9, srcY: 23, srcW: 14, srcH: 24 }, // small single A
  {  srcX:  40, srcY: 23, srcW: 14, srcH: 24 }, // small single B
  {  srcX:  67, srcY: 23, srcW: 28, srcH: 24 }, // small double
  {  srcX: 100, srcY:  3, srcW: 23, srcH: 44 }, // tall single A
  {  srcX: 130, srcY:  6, srcW: 24, srcH: 41 }, // tall single B
] as const;

// Hitboxes: 75% of rendered width (centered), 80% of rendered height
// Keeps collision fair — arms and tips don't kill you, only the trunk mass does
const HITBOXES = SPRITES.map(s => {
  const rw = s.srcW * SCALE, rh = s.srcH * SCALE;
  const hitW = Math.round(rw * 0.75);
  const hitH = Math.round(rh * 0.80);
  return { hitX: Math.floor((rw - hitW) / 2), hitW, hitH };
});

type CactusType = 0 | 1 | 2 | 3 | 4;
interface CactusObj { x: number; type: CactusType; }

export class CactusLayer {
  private img = new Image();
  private ok  = false;
  private cacti: CactusObj[] = [];
  private spawnCooldown = 0;

  constructor() {
    this.img.src = '/game/cactus.png';
    this.img.onload = () => (this.ok = true);
  }

  reset() {
    this.cacti = [];
    this.spawnCooldown = 420 + Math.random() * 180;
  }

  update(cw: number, speed: number, dtScale: number) {
    for (const c of this.cacti) c.x -= speed * dtScale;
    this.cacti = this.cacti.filter(c => c.x + 100 > 0);

    this.spawnCooldown -= speed * dtScale;
    if (this.spawnCooldown <= 0) {
      const type = Math.floor(Math.random() * 5) as CactusType;
      this.cacti.push({ x: cw + 10, type });
      this.spawnCooldown = 300 + Math.random() * 320;
    }
  }

  render(ctx: CanvasRenderingContext2D, groundY: number) {
    if (!this.ok) return;
    for (const c of this.cacti) {
      const s = SPRITES[c.type];
      ctx.drawImage(
        this.img,
        s.srcX, s.srcY, s.srcW, s.srcH,
        c.x, groundY - s.srcH * SCALE, s.srcW * SCALE, s.srcH * SCALE,
      );
    }
  }

  renderHitboxes(ctx: CanvasRenderingContext2D, groundY: number) {
    ctx.strokeStyle = 'rgba(255,0,0,0.7)';
    ctx.lineWidth = 1.5;
    for (const c of this.cacti) {
      const hb = HITBOXES[c.type];
      ctx.strokeRect(c.x + hb.hitX, groundY - hb.hitH, hb.hitW, hb.hitH);
    }
  }

  checkCollision(dog: { x: number; y: number; w: number; h: number }, groundY: number): boolean {
    for (const c of this.cacti) {
      const hb = HITBOXES[c.type];
      const cx = c.x + hb.hitX;
      const cy = groundY - hb.hitH;
      if (dog.x < cx + hb.hitW && dog.x + dog.w > cx &&
          dog.y < groundY       && dog.y + dog.h  > cy) {
        return true;
      }
    }
    return false;
  }
}
