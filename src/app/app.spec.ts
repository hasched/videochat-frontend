import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('shows the join screen first', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-join')).toBeTruthy();
    expect(root.querySelector('app-chat')).toBeNull();
  });

  it('only enables Start after choosing a gender and confirming age', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const start = root.querySelector('button.primary') as HTMLButtonElement;
    expect(start.disabled).toBe(true);

    (root.querySelector('input[type=radio]') as HTMLInputElement).click();
    await fixture.whenStable();
    expect(start.disabled).toBe(true);

    (root.querySelector('input[type=checkbox]') as HTMLInputElement).click();
    await fixture.whenStable();
    expect(start.disabled).toBe(false);
  });
});
