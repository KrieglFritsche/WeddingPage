import { DEAD_ROW, DOG_H, DOG_W, FH, FW, GRAVITY, HIT_H, HIT_W, HIT_X, HIT_Y, JUMP_VEL, RUN_FRAMES, RUN_ROW } from './game-constants';

export class Dog {
  readonly x = 80;
  y: number;
  onGround = true;

  private vy      = 0;
  private frame   = 0;
  private frameTick = 0;

  constructor(private restY: number) {
    this.y = restY;
  }

  jump() {
    if (!this.onGround) return;
    this.vy = JUMP_VEL;
    this.onGround = false;
  }

  reset() {
    this.y = this.restY;
    this.vy = 0;
    this.onGround = true;
    this.frame = 0;
    this.frameTick = 0;
  }

  update() {
    if (!this.onGround) {
      this.vy += GRAVITY;
      this.y  += this.vy;
      if (this.y >= this.restY) { this.y = this.restY; this.vy = 0; this.onGround = true; }
    }
    if (++this.frameTick >= 6) { this.frameTick = 0; this.frame = (this.frame + 1) % RUN_FRAMES; }
  }

  render(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dead: boolean) {
    const srcX = dead ? 0 : (this.onGround ? this.frame : 4) * FW;
    const srcY = dead ? DEAD_ROW * FH : RUN_ROW * FH;
    ctx.drawImage(img, srcX, srcY, FW, FH, this.x, this.y, DOG_W, DOG_H);
  }

  get hitbox() {
    return { x: this.x + HIT_X, y: this.y + HIT_Y, w: HIT_W, h: HIT_H };
  }
}
