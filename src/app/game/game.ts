import {
  Component, ElementRef, HostListener, OnDestroy,
  ViewChild, inject, signal, effect,
} from '@angular/core';
import { GameService } from './game.service';
import { DOG_H } from './game-constants';
import { Dog } from './dog';
import { GroundLayer } from './ground-layer';
import { CloudLayer } from './cloud-layer';

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
  private dogImg  = new Image();
  private dogImgOk = false;
  private dog!: Dog;
  private ground  = new GroundLayer();
  private clouds  = new CloudLayer();
  private rafId   = 0;
  private groundY = 0;
  private ticks   = 0;

  constructor() {
    this.dogImg.src = '/game/dog.png';
    this.dogImg.onload = () => (this.dogImgOk = true);

    effect(() => {
      if (this.isOpen()) setTimeout(() => this.boot(), 50);
      else this.stop();
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
    this.groundY = c.height * 0.88;
    this.dog     = new Dog(this.groundY - DOG_H);
    this.ground.fill(c.width);
    this.clouds.fill(c.width, c.height);
    this.state.set('idle');
    this.render();
  }

  // ── game loop ──────────────────────────────────────────────────────────────

  private startGame() {
    const c = this.canvasRef.nativeElement;
    this.dog.reset();
    this.ticks = 0;
    this.ground.fill(c.width);
    this.clouds.fill(c.width, c.height);
    this.score.set(0);
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

  // ── update ─────────────────────────────────────────────────────────────────

  private update() {
    this.ticks++;
    this.score.update(s => s + 1);
    const c = this.canvasRef.nativeElement;
    this.dog.update();
    this.ground.update(c.width);
    this.clouds.update(c.width, c.height);
  }

  // ── render ─────────────────────────────────────────────────────────────────

  private render() {
    const c   = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const dead = this.state() === 'gameover';
    ctx.clearRect(0, 0, c.width, c.height);

    this.clouds.render(ctx);
    this.ground.render(ctx, this.groundY);
    if (this.dogImgOk) this.dog.render(ctx, this.dogImg, dead);

    // hitbox debug
    const hb = this.dog.hitbox;
    ctx.strokeStyle = 'rgba(255,0,0,0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);

    // score
    const display = Math.floor(this.score() / 10).toString().padStart(5, '0');
    const hi      = Math.floor(this.highScore() / 10).toString().padStart(5, '0');
    ctx.fillStyle = '#58614d';
    ctx.font      = `600 16px "Be Vietnam Pro", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${hi}  ${display}`, c.width - 16, 32);

    // overlays
    ctx.textAlign = 'center';
    if (this.state() === 'idle') {
      ctx.fillStyle = 'rgba(88,97,77,0.75)';
      ctx.font = `italic 1.4rem "Noto Serif", serif`;
      ctx.fillText('Tippen zum Starten', c.width / 2, c.height * 0.42);
    }
    if (dead) {
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
    this.dog.jump();
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
