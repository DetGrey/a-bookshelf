# ISSUE-000 — Project Scaffold + CI Setup

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§1, §2, §12)

## Slice Metadata
- Type: AFK
- Blocked by: None — must be completed before all other issues
- User stories covered:
  - As a developer, I can run `npm install`, `npm start`, `npm test`, and `npm run build` from `angular/` and have each succeed.
  - As a developer, pushing to `main` deploys the Angular app to GitHub Pages.

## What to build
Scaffold the Angular 19 project inside `angular/` (the project root), replace Karma/Jasmine with Jest, configure environment files for the three runtime secrets, set up the `404.html` SPA routing trick for GitHub Pages, and update the CI deploy workflow to point at the Angular build.

This issue produces no feature code — only project infrastructure.

## Scaffold steps

### 1. Angular project
Run inside `angular/`:
```bash
ng new a-bookshelf --directory . --style scss --routing --standalone
```
Accepts defaults for all other prompts.

### 2. Remove Karma/Jasmine, install Jest
```bash
npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core @types/jasmine
npm install --save-dev jest jest-environment-jsdom jest-preset-angular @testing-library/angular @testing-library/jest-dom @types/jest
```

### 3. Jest config files (all at `angular/` root)

**`jest.config.ts`**
```typescript
export default {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
  },
};
```

**`setup-jest.ts`**
```typescript
import 'jest-preset-angular/setup-jest';
```

**`tsconfig.spec.json`**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "esModuleInterop": true,
    "types": ["jest"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.spec.d.ts", "setup-jest.ts"]
}
```

Remove `test` from `tsconfig.json` `include` (Karma reference). Update `package.json` `test` script to `jest`.

### 4. Environment files

**`src/environments/environment.ts`** (development — safe placeholder values)
```typescript
export const environment = {
  production: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
  imageProxyUrl: '',
};
```

**`src/environments/environment.prod.ts`** (production — values injected by CI)
```typescript
export const environment = {
  production: true,
  supabaseUrl: '',
  supabaseAnonKey: '',
  imageProxyUrl: '',
};
```

Wire file replacements in `angular.json` under `configurations.production.fileReplacements`.

### 5. `angular.json` schematics defaults
Under `projects.a-bookshelf.schematics`:
```json
{
  "@schematics/angular:component": {
    "changeDetection": "OnPush",
    "standalone": true,
    "style": "scss"
  }
}
```

### 6. `404.html` post-build script
Add to `package.json` scripts:
```json
"build": "ng build && cp dist/a-bookshelf/browser/index.html dist/a-bookshelf/browser/404.html"
```

### 7. Update `.github/workflows/deploy.yml`
- Change `working-directory` from `frontend` to `angular`
- Change `cache-dependency-path` from `frontend/package-lock.json` to `angular/package-lock.json`
- Replace `VITE_SUPABASE_URL` → inject into `environment.prod.ts` via sed before build, or rename secrets to `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IMAGE_PROXY_URL`
- Change artifact `path` from `frontend/dist` to `angular/dist/a-bookshelf/browser`

CI pre-build step to inject secrets into `environment.prod.ts`:
```yaml
- name: Set environment variables
  run: |
    sed -i "s|supabaseUrl: ''|supabaseUrl: '${{ secrets.SUPABASE_URL }}'|" src/environments/environment.prod.ts
    sed -i "s|supabaseAnonKey: ''|supabaseAnonKey: '${{ secrets.SUPABASE_ANON_KEY }}'|" src/environments/environment.prod.ts
    sed -i "s|imageProxyUrl: ''|imageProxyUrl: '${{ secrets.IMAGE_PROXY_URL }}'|" src/environments/environment.prod.ts
  working-directory: angular
```

## Acceptance criteria
- [ ] `ng new` has run inside `angular/`; `package.json`, `angular.json`, `tsconfig.json`, and `src/` exist.
- [ ] `npm start` serves the default Angular app without errors.
- [ ] Karma and Jasmine are fully removed; `npm test` runs via Jest and exits cleanly with zero tests (no failures).
- [ ] `jest.config.ts`, `setup-jest.ts`, and `tsconfig.spec.json` exist at `angular/` root.
- [ ] `src/environments/environment.ts` and `src/environments/environment.prod.ts` exist with all three keys present.
- [ ] `angular.json` schematics default all generated components to `OnPush`, standalone, and SCSS.
- [ ] `npm run build` produces output in `dist/` and copies `index.html` to `404.html`.
- [ ] `.github/workflows/deploy.yml` points at `angular/`, injects secrets into `environment.prod.ts`, and uploads from the correct dist path.
- [ ] GitHub secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IMAGE_PROXY_URL` are renamed/added in the repository settings.

## Blocked by
None — start here.
