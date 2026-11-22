import { Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  protected readonly chat = inject(ChatService);

  private readonly remote = viewChild<ElementRef<HTMLVideoElement>>('remote');
  private readonly local = viewChild<ElementRef<HTMLVideoElement>>('local');

  protected readonly statusText = computed(() =>
    this.chat.status() === 'connecting' ? 'Starting camera…' : 'Looking for someone…',
  );

  constructor() {
    effect(() => {
      const element = this.remote()?.nativeElement;
      if (element) {
        element.srcObject = this.chat.remoteStream();
      }
    });

    effect(() => {
      const element = this.local()?.nativeElement;
      if (element) {
        element.muted = true;
        element.srcObject = this.chat.localStream();
      }
    });
  }
}
