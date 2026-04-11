import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-add-book-page',
  standalone: true,
  template: '<section><h1>Add Book</h1><p>Route placeholder.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBookPageComponent {}
