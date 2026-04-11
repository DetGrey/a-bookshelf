import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { bookDetailResolver } from './features/book-details/book-details.resolver';

export const routes: Routes = [
	{ path: '', redirectTo: 'bookshelf', pathMatch: 'full' },
	{ path: 'login', loadComponent: () => import('./features/auth/login/login-page.component').then((module) => module.LoginPageComponent) },
	{ path: 'signup', loadComponent: () => import('./features/auth/signup/signup-page.component').then((module) => module.SignupPageComponent) },
	{
		path: '',
		canActivate: [authGuard],
		children: [
			{ path: 'bookshelf', loadComponent: () => import('./features/bookshelf/bookshelf-page.component').then((module) => module.BookshelfPageComponent) },
			{ path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard-page.component').then((module) => module.DashboardPageComponent) },
			{ path: 'add', loadComponent: () => import('./features/add-book/add-book-page.component').then((module) => module.AddBookPageComponent) },
			{
				path: 'book/:bookId',
				resolve: { book: bookDetailResolver },
				loadComponent: () => import('./features/book-details/book-details-page.component').then((module) => module.BookDetailsPageComponent),
			},
		],
	},
	{ path: '**', redirectTo: '' },
];
