import { Component } from '@angular/core';
import { What } from './what/what';
import { Where } from './where/where';
import { When } from './when/when';

@Component({
  selector: 'app-root',
  imports: [What, Where, When],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
