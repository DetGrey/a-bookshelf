import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  template: '<section><h1>Dashboard</h1><p>Route placeholder.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {}
