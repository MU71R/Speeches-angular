import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DepartmentComponent } from './components/department/department.component';
import { AddadecisionComponent } from './components/add-a-decision/addadecision.component';
import { DeclarationComponent } from './components/declaration/declaration.component';
import { LayoutComponent } from './components/layout/layout.component';
import { PendingReviewsComponent } from './components/pending-reviews/pending-reviews.component';
import { LetterDetailComponent } from './components/letter-detail/letter-detail.component';
import { ArchiveComponent } from './components/archive/archive.component';
import { ArchiveDetailComponent } from './components/archive-detail/archive-detail.component';
import { HomeComponent } from './components/home/home.component';
import { LetterDetailsComponent } from './components/archived-letter-details/archived-letter-details.component';
import { PdfListComponent } from './components/pdf-list/pdf-list.component';


const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { path: 'department', component: DepartmentComponent },
      { path: 'add-decision', component: AddadecisionComponent },
      { path: 'declaration', component: DeclarationComponent },
      { path: 'pending-reviews', component: PendingReviewsComponent },
      { path: 'letter-details/:id', component: LetterDetailComponent },
      { path: 'letter-detail/:id', component: LetterDetailsComponent },
      { path: 'archive', component: ArchiveComponent },
      { path: 'archive-detail', component: ArchiveDetailComponent },
      {path: 'pdf-list', component: PdfListComponent},
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
