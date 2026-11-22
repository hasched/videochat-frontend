import { Component, inject } from '@angular/core';
import { Chat } from './chat';
import { ChatService } from './chat.service';
import { Join } from './join';

@Component({
  selector: 'app-root',
  imports: [Join, Chat],
  template: `
    @if (chat.status() === 'idle') {
      <app-join />
    } @else {
      <app-chat />
    }
  `,
  styles: `
    :host { display: block; height: 100%; }
  `,
})
export class App {
  protected readonly chat = inject(ChatService);
}
