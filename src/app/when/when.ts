import { Component, inject } from '@angular/core';
import { GameService } from '../game/game.service';

@Component({
  selector: 'app-when',
  imports: [],
  templateUrl: './when.html',
  styleUrl: './when.scss',
})
export class When {
  private game = inject(GameService);
  private lastTap = 0;

  onPartyTap() {
    const now = Date.now();
    if (now - this.lastTap < 400) {
      this.game.open();
      this.lastTap = 0;
    } else {
      this.lastTap = now;
    }
  }
}
