import { Component, computed, inject, signal } from '@angular/core';
import { ChatService, Gender } from './chat.service';

@Component({
  selector: 'app-join',
  templateUrl: './join.html',
  styleUrl: './join.css',
})
export class Join {
  protected readonly chat = inject(ChatService);

  protected readonly genders: readonly { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  protected readonly gender = signal<Gender | null>(null);
  protected readonly over21 = signal(false);
  protected readonly canStart = computed(() => this.gender() !== null && this.over21());

  protected start(): void {
    const gender = this.gender();
    if (gender && this.over21()) {
      void this.chat.start(gender, true);
    }
  }
}
