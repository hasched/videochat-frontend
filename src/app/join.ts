import { Component, computed, inject, signal } from '@angular/core';
import { ChatService, Gender } from './chat.service';

@Component({
  selector: 'app-join',
  template: `
    <main class="join">
      <h1>Random video chat</h1>
      <p class="muted">Meet someone new. Skip whenever you like.</p>

      <fieldset>
        <legend>I am</legend>
        <div class="options">
          @for (option of genders; track option.value) {
            <label class="pill" [class.selected]="gender() === option.value">
              <input
                type="radio"
                name="gender"
                [value]="option.value"
                [checked]="gender() === option.value"
                (change)="gender.set(option.value)"
              />
              {{ option.label }}
            </label>
          }
        </div>
      </fieldset>

      <label class="check">
        <input type="checkbox" [checked]="over21()" (change)="over21.set($any($event.target).checked)" />
        I am over 21
      </label>

      <button class="primary" [disabled]="!canStart()" (click)="start()">Start</button>

      @if (chat.error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
    </main>
  `,
  styles: `
    .join {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      padding: 2rem 1rem;
      text-align: center;
    }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 650; letter-spacing: -0.02em; }
    .muted { margin: 0; color: var(--muted); }
    fieldset { border: 0; padding: 0; margin: 0.5rem 0 0; }
    legend { color: var(--muted); font-size: 0.875rem; margin: 0 auto 0.5rem; }
    .options { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
    .pill {
      border: 1px solid #2a2d35;
      border-radius: 999px;
      padding: 0.5rem 1.1rem;
      cursor: pointer;
      user-select: none;
    }
    .pill.selected { border-color: var(--accent); background: rgb(79 140 255 / 0.15); }
    .pill input { position: absolute; opacity: 0; pointer-events: none; }
    .check { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .error { color: var(--danger); margin: 0; max-width: 24rem; }
  `,
})
export class Join {
  protected readonly chat = inject(ChatService);

  protected readonly genders: { value: Gender; label: string }[] = [
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
