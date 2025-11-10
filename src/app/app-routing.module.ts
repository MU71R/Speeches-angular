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



const routes: Routes = [
  // صفحة تسجيل الدخول مستقلة
  { path: 'login', component: LoginComponent },

  // الصفحات الداخلية كلها داخل الـ Layout
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
      // الصفحة الرئيسية داخل النظام
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  // أي رابط مش معروف يرجع للصفحة الرئيسية
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
