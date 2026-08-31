import { Component } from '@angular/core';
import { What } from './what/what';
import { Where } from './where/where';
import { When } from './when/when';
import { Game } from './game/game';

@Component({
  selector: 'app-root',
  imports: [What, Where, When, Game],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
