import { Routes } from '@angular/router';
import { AddBookPageComponent } from './features/add-book/add-book-page.component';
import { LoginPageComponent } from './features/auth/login/login-page.component';
import { SignupPageComponent } from './features/auth/signup/signup-page.component';
import { BookDetailsPageComponent } from './features/book-details/book-details-page.component';
import { BookshelfPageComponent } from './features/bookshelf/bookshelf-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';

export const routes: Routes = [
	{ path: '', component: DashboardPageComponent },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'signup', component: SignupPageComponent },
	{ path: 'bookshelf', component: BookshelfPageComponent },
	{ path: 'dashboard', component: DashboardPageComponent },
	{ path: 'add', component: AddBookPageComponent },
	{ path: 'book/:bookId', component: BookDetailsPageComponent },
	{ path: '**', redirectTo: '' },
];
