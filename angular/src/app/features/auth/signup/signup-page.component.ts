import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  template: '<section><h1>Signup</h1><p>Route placeholder.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupPageComponent {}
