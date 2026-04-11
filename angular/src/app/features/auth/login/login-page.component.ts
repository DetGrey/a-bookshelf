import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login-page',
  standalone: true,
  template: '<section><h1>Login</h1><p>Route placeholder.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {}
