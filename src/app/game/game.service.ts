import { Injectable, signal } from '@angular/core';

const HS_KEY = 'wedding-game-hi';

@Injectable({ providedIn: 'root' })
export class GameService {
  readonly isOpen    = signal(false);
  readonly highScore = signal(+(localStorage.getItem(HS_KEY) ?? 0));

  open()  { this.isOpen.set(true);  }
  close() { this.isOpen.set(false); }

  saveHighScore(raw: number) {
    this.highScore.set(raw);
    localStorage.setItem(HS_KEY, String(raw));
  }
}
