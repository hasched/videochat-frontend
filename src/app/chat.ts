import { Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  template: `
    <section class="stage">
      <video #remote class="remote" autoplay playsinline></video>
      <video #local class="local" autoplay playsinline muted></video>

      @if (chat.status() !== 'chatting') {
        <div class="overlay">{{ statusText() }}</div>
      } @else if (chat.partnerGender(); as gender) {
        <div class="badge">Stranger · {{ gender }}</div>
      }

      @if (chat.error(); as message) {
        <div class="banner" role="alert">{{ message }}</div>
      }

      <div class="bar">
        <button class="primary" [disabled]="chat.status() !== 'chatting'" (click)="chat.next()">Next</button>
        <button (click)="chat.stop()">Stop</button>
      </div>
    </section>
  `,
  styles: `
    .stage { position: relative; height: 100%; background: #000; overflow: hidden; }
    .remote { width: 100%; height: 100%; object-fit: cover; background: #000; }
    .local {
      position: absolute;
      right: 1rem;
      bottom: 5.5rem;
      width: min(28vw, 11rem);
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: 0.75rem;
      border: 1px solid rgb(255 255 255 / 0.2);
      background: #111;
      transform: scaleX(-1); /* mirror, like a real mirror */
    }
    .overlay {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: var(--muted);
      font-size: 1.1rem;
      pointer-events: none;
    }
    .badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: rgb(0 0 0 / 0.55);
      font-size: 0.875rem;
      text-transform: capitalize;
    }
    .banner {
      position: absolute;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background: var(--danger);
      color: #fff;
    }
    .bar {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 1.25rem;
      display: flex;
      justify-content: center;
      gap: 0.75rem;
    }
    .bar button { min-width: 7rem; }
  `,
})
export class Chat {
  protected readonly chat = inject(ChatService);

  private readonly remote = viewChild<ElementRef<HTMLVideoElement>>('remote');
  private readonly local = viewChild<ElementRef<HTMLVideoElement>>('local');

  protected readonly statusText = computed(() =>
    this.chat.status() === 'connecting' ? 'Starting camera…' : 'Looking for someone…',
  );

  constructor() {
    // A <video> element only accepts a stream through its srcObject property.
    effect(() => {
      const element = this.remote()?.nativeElement;
      if (element) {
        element.srcObject = this.chat.remoteStream();
      }
    });
    effect(() => {
      const element = this.local()?.nativeElement;
      if (element) {
        element.muted = true; // never play your own microphone back
        element.srcObject = this.chat.localStream();
      }
    });
  }
}
