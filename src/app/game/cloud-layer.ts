import { CLOUD_SRC_H, CLOUD_SRC_W, CLOUD_VARIANTS, GROUND_SPEED } from './game-constants';

interface Cloud { x: number; y: number; variant: number; speed: number; scale: number; }

export class CloudLayer {
  private img = new Image();
  private ok  = false;
  private clouds: Cloud[] = [];

  constructor() {
    this.img.src = '/game/clouds.png';
    this.img.onload = () => (this.ok = true);
  }

  fill(cw: number, ch: number) {
    this.clouds = [];
    let x = 0;
    while (x < cw + CLOUD_SRC_W * 3) {
      this.clouds.push(this.make(x, ch));
      x += 140 + Math.random() * 180;
    }
  }

  update(cw: number, ch: number) {
    for (const cl of this.clouds) cl.x -= cl.speed;
    this.clouds = this.clouds.filter(cl => cl.x + CLOUD_SRC_W * 3 > 0);
    const last = this.clouds[this.clouds.length - 1];
    if (!last || last.x < cw + 100) {
      const spawnX = last ? last.x + 140 + Math.random() * 180 : cw;
      this.clouds.push(this.make(spawnX, ch));
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.ok) return;
    for (const cl of this.clouds)
      ctx.drawImage(this.img, cl.variant * CLOUD_SRC_W, 0, CLOUD_SRC_W, CLOUD_SRC_H, cl.x, cl.y, CLOUD_SRC_W * cl.scale, CLOUD_SRC_H * cl.scale);
  }

  private make(x: number, ch: number): Cloud {
    const far = Math.random() < 0.55;
    return {
      x,
      y: ch * (far ? 0.04 + Math.random() * 0.22 : 0.15 + Math.random() * 0.3),
      variant: Math.floor(Math.random() * CLOUD_VARIANTS),
      speed: far ? GROUND_SPEED * 0.12 : GROUND_SPEED * 0.28,
      scale: far ? 1.5 : 2.5,
    };
  }
}
