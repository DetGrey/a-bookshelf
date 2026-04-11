import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BookGridComponent } from './book-grid.component';
import { BookCardComponent } from '../book-card/book-card.component';

const sampleBook = {
  id: 'book-1',
  userId: 'user-1',
  title: 'Sample',
  description: 'desc',
  score: null,
  status: 'reading' as const,
  genres: ['action'],
  language: null,
  chapterCount: null,
  latestChapter: null,
  lastUploadedAt: null,
  lastFetchedAt: null,
  notes: null,
  timesRead: 1,
  lastRead: null,
  originalLanguage: null,
  coverUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('BookGridComponent', () => {
  it('forwards compact input to each rendered BookCardComponent', () => {
    TestBed.configureTestingModule({
      imports: [BookGridComponent],
    });

    const fixture = TestBed.createComponent(BookGridComponent);
    fixture.componentRef.setInput('books', [sampleBook]);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    const cardDebugEl = fixture.debugElement.query(By.directive(BookCardComponent));
    expect(cardDebugEl).not.toBeNull();

    const card = cardDebugEl.componentInstance as BookCardComponent;
    expect(card.compact()).toBe(true);
  });
});
