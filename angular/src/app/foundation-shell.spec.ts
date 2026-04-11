import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { routes } from './app.routes';

describe('foundation route map and shell', () => {
  it('defines required route skeleton entries', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toEqual(expect.arrayContaining([
      'login',
      'signup',
      'bookshelf',
      'dashboard',
      'add',
      'book/:bookId',
    ]));
  });

  it('renders a minimal shell with nav and outlet placeholders', () => {
    const templatePath = join(process.cwd(), 'src', 'app', 'app.component.html');
    const template = readFileSync(templatePath, 'utf8');

    expect(template).toContain('<nav');
    expect(template).toContain('router-outlet');
    expect(template).not.toContain('Congratulations! Your app is running.');
  });
});
