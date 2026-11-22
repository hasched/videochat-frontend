import { Component, inject } from '@angular/core';
import { Chat } from './chat';
import { ChatService } from './chat.service';
import { Join } from './join';

@Component({
  selector: 'app-root',
  imports: [Join, Chat],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly chat = inject(ChatService);
}
