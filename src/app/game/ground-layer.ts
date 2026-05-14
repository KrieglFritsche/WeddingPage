import { GROUND_SPEED, TILE_H, TILE_SRC_H, TILE_SRC_W, TILE_VARIANTS, TILE_W } from './game-constants';

interface GroundTile { x: number; variant: number; }

export class GroundLayer {
  private img = new Image();
  private ok  = false;
  private tiles: GroundTile[] = [];

  constructor() {
    this.img.src = '/game/ground.png';
    this.img.onload = () => (this.ok = true);
  }

  fill(cw: number) {
    this.tiles = [];
    for (let x = 0; x < cw + TILE_W; x += TILE_W)
      this.tiles.push({ x, variant: Math.floor(Math.random() * TILE_VARIANTS) });
  }

  update(cw: number) {
    for (const t of this.tiles) t.x -= GROUND_SPEED;
    this.tiles = this.tiles.filter(t => t.x + TILE_W > 0);
    const last = this.tiles[this.tiles.length - 1];
    if (last.x + TILE_W < cw + TILE_W)
      this.tiles.push({ x: last.x + TILE_W, variant: Math.floor(Math.random() * TILE_VARIANTS) });
  }

  render(ctx: CanvasRenderingContext2D, groundY: number) {
    if (!this.ok) return;
    for (const t of this.tiles)
      ctx.drawImage(this.img, t.variant * TILE_SRC_W, 0, TILE_SRC_W, TILE_SRC_H, t.x, groundY - TILE_H, TILE_W, TILE_H);
  }
}
