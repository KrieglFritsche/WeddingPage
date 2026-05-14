import {
  Component, ElementRef, HostListener, OnDestroy,
  ViewChild, inject, signal, effect,
} from '@angular/core';
import { GameService } from './game.service';

// Spritesheet layout: 432×192, 9 columns × 6 rows → 48×32 per frame
const FW = 48, FH = 32, SCALE = 3;
const DOG_W = FW * SCALE, DOG_H = FH * SCALE;
const RUN_ROW = 0, RUN_FRAMES = 8;
const DEAD_ROW = 3;
const GRAVITY = 0.35, JUMP_VEL = -9, GROUND_SPEED = 3;

// Ground spritesheet: 160×16, 5 variants each 32×16
const TILE_SRC_W = 32, TILE_SRC_H = 16, TILE_VARIANTS = 5;
const TILE_SCALE = 2;
const TILE_W = TILE_SRC_W * TILE_SCALE, TILE_H = TILE_SRC_H * TILE_SCALE;

interface GroundTile { x: number; variant: number; }

// Hitbox within the drawn sprite — tweak these to match the dog body
const HIT_X = 37;  // px from left edge of sprite
const HIT_Y = 40;   // px from top edge of sprite
const HIT_W = 83; // hitbox width
const HIT_H = 56;  // hitbox height

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl:    './game.scss',
})
export class Game implements OnDestroy {
  private svc = inject(GameService);

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  isOpen    = this.svc.isOpen;
  score     = signal(0);
  highScore = signal(0);
  state     = signal<'idle' | 'running' | 'gameover'>('idle');

  private ctx!: CanvasRenderingContext2D;
  private sprite    = new Image();
  private spriteOk  = false;
  private ground    = new Image();
  private groundOk  = false;
  private tiles: GroundTile[] = [];
  private rafId     = 0;

  // dog
  private dogX = 0; private dogY = 0; private dogVY = 0;
  private onGround = true; private runFrame = 0; private frameTick = 0;

  // world
  private groundY = 0; private dogRestY = 0; private ticks = 0;

  constructor() {
    this.sprite.src = '/game/dog.png';
    this.sprite.onload = () => (this.spriteOk = true);
    this.ground.src = '/game/ground.png';
    this.ground.onload = () => (this.groundOk = true);

    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this.boot(), 50);
      } else {
        this.stop();
      }
    });
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────

  ngOnDestroy() { this.stop(); }

  // ── canvas bootstrap ───────────────────────────────────────────────────────

  private boot() {
    const c = this.canvasRef?.nativeElement;
    if (!c) return;
    c.width  = c.offsetWidth;
    c.height = c.offsetHeight;
    this.ctx     = c.getContext('2d')!;
    this.groundY  = c.height * 0.88;
    this.dogRestY = this.groundY - DOG_H;
    this.dogX     = 80;
    this.dogY     = this.dogRestY;
    this.fillTiles(c.width);
    this.state.set('idle');
    this.render();
  }

  // ── game loop ──────────────────────────────────────────────────────────────

  private startGame() {
    this.dogY = this.dogRestY;
    this.dogVY = 0; this.onGround = true;
    this.ticks = 0;
    this.fillTiles(this.canvasRef.nativeElement.width);
    this.score.set(0); this.runFrame = 0; this.frameTick = 0;
    this.state.set('running');
    this.tick();
  }

  private tick() {
    this.rafId = requestAnimationFrame(() => {
      if (this.state() !== 'running') return;
      this.update();
      this.render();
      this.tick();
    });
  }

  private stop() { cancelAnimationFrame(this.rafId); }

  private fillTiles(canvasWidth: number) {
    this.tiles = [];
    for (let x = 0; x < canvasWidth + TILE_W; x += TILE_W) {
      this.tiles.push({ x, variant: Math.floor(Math.random() * TILE_VARIANTS) });
    }
  }

  // ── update ─────────────────────────────────────────────────────────────────

  private update() {
    this.ticks++;
    this.score.update(s => s + 1);

    // physics
    if (!this.onGround) {
      this.dogVY += GRAVITY;
      this.dogY  += this.dogVY;
      if (this.dogY >= this.dogRestY) {
        this.dogY = this.dogRestY;
        this.dogVY = 0; this.onGround = true;
      }
    }

    // scroll ground tiles
    const cw = this.canvasRef.nativeElement.width;
    for (const t of this.tiles) t.x -= GROUND_SPEED;
    this.tiles = this.tiles.filter(t => t.x + TILE_W > 0);
    const last = this.tiles[this.tiles.length - 1];
    if (last.x + TILE_W < cw + TILE_W) {
      this.tiles.push({ x: last.x + TILE_W, variant: Math.floor(Math.random() * TILE_VARIANTS) });
    }

    // sprite animation
    if (++this.frameTick >= 6) {
      this.frameTick = 0;
      this.runFrame = (this.runFrame + 1) % RUN_FRAMES;
    }

  }

  // ── render ─────────────────────────────────────────────────────────────────

  private render() {
    const c = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, c.width, c.height);

    // ground tiles
    if (this.groundOk) {
      for (const t of this.tiles) {
        ctx.drawImage(
          this.ground,
          t.variant * TILE_SRC_W, 0, TILE_SRC_W, TILE_SRC_H,
          t.x, this.groundY - TILE_H, TILE_W, TILE_H,
        );
      }
    }

    // dog sprite
    if (this.spriteOk) {
      const st = this.state();
      const srcX = st === 'gameover'
        ? 0
        : (this.onGround ? this.runFrame : 4) * FW;
      const srcY = st === 'gameover' ? DEAD_ROW * FH : RUN_ROW * FH;
      ctx.drawImage(this.sprite, srcX, srcY, FW, FH, this.dogX, this.dogY, DOG_W, DOG_H);
    }

    // hitbox debug
    ctx.strokeStyle = 'rgba(255,0,0,0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.dogX + HIT_X, this.dogY + HIT_Y, HIT_W, HIT_H);

    // score
    const display = Math.floor(this.score() / 10).toString().padStart(5, '0');
    const hi      = Math.floor(this.highScore() / 10).toString().padStart(5, '0');
    ctx.fillStyle = '#58614d';
    ctx.font = `600 16px "Be Vietnam Pro", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${hi}  ${display}`, c.width - 16, 32);

    // overlays
    ctx.textAlign = 'center';
    if (this.state() === 'idle') {
      ctx.fillStyle = 'rgba(88,97,77,0.75)';
      ctx.font = `italic 1.4rem "Noto Serif", serif`;
      ctx.fillText('Tippen zum Starten', c.width / 2, c.height * 0.42);
    }
    if (this.state() === 'gameover') {
      ctx.fillStyle = 'rgba(88,97,77,0.9)';
      ctx.font = `italic 1.75rem "Noto Serif", serif`;
      ctx.fillText('Game Over', c.width / 2, c.height * 0.38);
      ctx.font = `600 0.95rem "Be Vietnam Pro", sans-serif`;
      ctx.fillText(`Score: ${Math.floor(this.score() / 10)}`, c.width / 2, c.height * 0.38 + 42);
      ctx.font = `italic 1rem "Noto Serif", serif`;
      ctx.fillText('Nochmal tippen', c.width / 2, c.height * 0.38 + 82);
    }
  }

  // ── actions ────────────────────────────────────────────────────────────────

  private gameOver() {
    const s = Math.floor(this.score() / 10);
    if (s > this.highScore()) this.highScore.set(s);
    this.state.set('gameover');
    this.stop();
    this.render();
  }

  tap() {
    if (this.state() === 'idle' || this.state() === 'gameover') {
      this.startGame(); return;
    }
    if (this.onGround) {
      this.dogVY = JUMP_VEL; this.onGround = false;
    }
  }

  close() {
    this.stop();
    this.svc.close();
  }

  @HostListener('document:keydown.space', ['$event'])
  @HostListener('document:keydown.arrowup', ['$event'])
  onKey(e: Event) {
    if (this.isOpen()) { e.preventDefault(); this.tap(); }
  }
}
