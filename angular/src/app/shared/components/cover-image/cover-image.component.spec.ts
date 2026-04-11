import { TestBed } from '@angular/core/testing';
import { CoverImageComponent } from './cover-image.component';

describe('CoverImageComponent', () => {
  it('applies cloudflare proxy URL at render time', () => {
    TestBed.configureTestingModule({
      imports: [CoverImageComponent],
    });

    const fixture = TestBed.createComponent(CoverImageComponent);
    fixture.componentRef.setInput('src', 'https://images.example.com/cover.jpg');
    fixture.componentRef.setInput('alt', 'Solo cover');
    fixture.detectChanges();

    const imageElement = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(imageElement).toBeTruthy();
    expect(imageElement.getAttribute('src')).toContain('/cdn-cgi/image/format=auto,quality=85/');
    expect(imageElement.getAttribute('src')).toContain(encodeURIComponent('https://images.example.com/cover.jpg'));
  });
});
