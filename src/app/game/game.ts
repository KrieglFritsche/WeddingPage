import {
  Component, ElementRef, HostListener, OnDestroy,
  ViewChild, inject, signal, effect,
} from '@angular/core';
import { GameService } from './game.service';
import { DOG_H, GROUND_SPEED, MAX_SPEED, SPEED_RAMP } from './game-constants';
import { Dog } from './dog';
import { GroundLayer } from './ground-layer';
import { CloudLayer } from './cloud-layer';
import { CactusLayer } from './cactus-layer';

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
  highScore = this.svc.highScore;
  score     = signal(0);
  state     = signal<'idle' | 'running' | 'gameover'>('idle');

  private ctx!: CanvasRenderingContext2D;
  private dogImg  = new Image();
  private dogImgOk = false;
  private dog!: Dog;
  private ground  = new GroundLayer();
  private clouds  = new CloudLayer();
  private cacti   = new CactusLayer();
  private rafId   = 0;
  private groundY = 0;
  private ticks   = 0;
  private speed   = GROUND_SPEED;
  private lastTime = 0;

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
    this.speed = GROUND_SPEED;
    this.lastTime = 0;
    this.ground.fill(c.width);
    this.clouds.fill(c.width, c.height);
    this.cacti.reset();
    this.score.set(0);
    this.state.set('running');
    this.tick();
  }

  private tick() {
    this.rafId = requestAnimationFrame((time) => {
      if (this.state() !== 'running') return;
      const dt = this.lastTime ? Math.min(time - this.lastTime, 50) : 16.667;
      this.lastTime = time;
      this.update(dt / 16.667);
      this.render();
      this.tick();
    });
  }

  private stop() { cancelAnimationFrame(this.rafId); }

  // ── update ─────────────────────────────────────────────────────────────────

  private update(dtScale: number) {
    this.ticks += dtScale;
    this.score.update(s => s + dtScale);
    this.speed = Math.min(MAX_SPEED, GROUND_SPEED + this.ticks * SPEED_RAMP);

    const c = this.canvasRef.nativeElement;
    this.dog.update(dtScale);
    this.ground.update(c.width, this.speed, dtScale);
    this.clouds.update(c.width, c.height, dtScale);
    this.cacti.update(c.width, this.speed, dtScale);

    if (this.cacti.checkCollision(this.dog.hitbox, this.groundY)) {
      this.gameOver();
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  private render() {
    const c   = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const dead = this.state() === 'gameover';
    ctx.clearRect(0, 0, c.width, c.height);

    this.clouds.render(ctx);
    this.ground.render(ctx, this.groundY);
    this.cacti.render(ctx, this.groundY);
    if (this.dogImgOk) this.dog.render(ctx, this.dogImg, dead);

    // score
    const display = Math.floor(this.score() / 10).toString().padStart(5, '0');
    const hi      = Math.floor(this.highScore() / 10).toString().padStart(5, '0');  // highScore stores raw ticks like score
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
    if (this.score() > this.highScore()) this.svc.saveHighScore(this.score());
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
