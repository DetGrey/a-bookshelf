import { TestBed } from '@angular/core/testing';
import { CoverImageComponent } from './cover-image.component';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [CoverImageComponent],
  template: `<app-cover-image [src]="src" [alt]="alt" [lazy]="lazy" />`
})
class TestHostComponent {
  src: string | null | undefined = null;
  alt = 'Test Book';
  lazy = false; 
}

describe('CoverImageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();
  });

  describe('Gradient Fallback Logic', () => {
    it('renders fallback gradient containing the alt text when src is null', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.src = null;
      fixture.componentInstance.alt = 'My Awesome Book';
      fixture.detectChanges();

      const fallback = fixture.debugElement.query(By.css('.cover-fallback'));
      expect(fallback).toBeTruthy();
      expect(fallback.nativeElement.textContent).toContain('My Awesome Book');
    });

    it('renders "No cover" if alt text is missing', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.src = null;
      fixture.componentInstance.alt = '';
      fixture.detectChanges();

      const fallback = fixture.debugElement.query(By.css('.cover-fallback'));
      expect(fallback.nativeElement.textContent).toContain('No cover');
    });

    it('computes deterministic gradient hue based on alt text', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      
      fixture.componentInstance.alt = 'Book A';
      fixture.detectChanges();
      const fallback1 = fixture.debugElement.query(By.css('.cover-fallback')).nativeElement;
      const style1 = fallback1.style.background;

      fixture.componentInstance.alt = 'Totally Different Book';
      fixture.detectChanges();
      const fallback2 = fixture.debugElement.query(By.css('.cover-fallback')).nativeElement;
      const style2 = fallback2.style.background;

      expect(style1).toBeTruthy();
      expect(style2).toBeTruthy();
      expect(style1).not.toBe(style2); 
    });
  });

  describe('Lazy Loading Logic', () => {
    let originalIntersectionObserver: any;
    let observeMock: jest.Mock;
    let disconnectMock: jest.Mock;
    let triggerIntersect: (entries: any[]) => void;

    beforeEach(() => {
      originalIntersectionObserver = window.IntersectionObserver;
      observeMock = jest.fn();
      disconnectMock = jest.fn();

      window.IntersectionObserver = jest.fn().mockImplementation((callback) => {
        triggerIntersect = callback;
        return { observe: observeMock, disconnect: disconnectMock };
      }) as any;
    });

    afterEach(() => {
      window.IntersectionObserver = originalIntersectionObserver;
    });

    it('defers loading if lazy is true until intersected', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.src = 'https://example.com/cover.jpg';
      fixture.componentInstance.lazy = true;
      fixture.detectChanges();

      // Initially no image, but observer should be setup
      expect(fixture.debugElement.query(By.css('img'))).toBeFalsy();
      expect(observeMock).toHaveBeenCalled();

      // Trigger intersection
      triggerIntersect([{ isIntersecting: true }]);
      fixture.detectChanges();

      // Image should now be rendered and observer disconnected
      expect(fixture.debugElement.query(By.css('img'))).toBeTruthy();
      expect(disconnectMock).toHaveBeenCalled();
    });

    it('loads immediately if lazy is false', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.src = 'https://example.com/cover.jpg';
      fixture.componentInstance.lazy = false;
      fixture.detectChanges(); // Initial render

      // afterNextRender runs here... we need another detectChanges
      fixture.detectChanges(); 

      const img = fixture.debugElement.query(By.css('img'));
      expect(img).toBeTruthy();
      expect(observeMock).not.toHaveBeenCalled();
    });

    it('loads immediately if IntersectionObserver is missing', () => {
      delete (window as any).IntersectionObserver;
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.src = 'https://example.com/cover.jpg';
      fixture.componentInstance.lazy = true;
      fixture.detectChanges(); // Initial render

      // afterNextRender runs here... we need another detectChanges
      fixture.detectChanges();

      const img = fixture.debugElement.query(By.css('img'));
      expect(img).toBeTruthy();
    });
  });
  describe('Error and Timeout Logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('shows fallback if image fails to load (error event)', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.src = 'https://example.com/broken.jpg';
      fixture.componentInstance.lazy = false;
      fixture.detectChanges();
      fixture.detectChanges(); // afterNextRender

      const img = fixture.debugElement.query(By.css('img'));
      img.triggerEventHandler('error', null);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('img'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.cover-fallback'))).toBeTruthy();
    });

    it('shows fallback if image takes more than 3 seconds to load (timeout)', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.src = 'https://example.com/slow.jpg';
      fixture.componentInstance.lazy = false;
      fixture.detectChanges();
      fixture.detectChanges(); // afterNextRender

      // At 2 seconds, image is still there
      jest.advanceTimersByTime(2000);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('img'))).toBeTruthy();

      // At 3 seconds, timeout fires
      jest.advanceTimersByTime(1000);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('img'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.cover-fallback'))).toBeTruthy();
    });

    it('resets state when src changes', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.src = 'https://example.com/broken.jpg';
      fixture.componentInstance.lazy = false;
      fixture.detectChanges();
      fixture.detectChanges();

      // Trigger error
      fixture.debugElement.query(By.css('img')).triggerEventHandler('error', null);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('img'))).toBeFalsy();

      // Change src
      fixture.componentInstance.src = 'https://example.com/new.jpg';
      fixture.detectChanges();

      // Should try loading again
      expect(fixture.debugElement.query(By.css('img'))).toBeTruthy();
    });
  });
});