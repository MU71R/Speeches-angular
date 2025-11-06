import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/service/login.service';
import { User } from 'src/app/model/user';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  user: User | null = null;

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    // نجيب المستخدم من localStorage أول ما الكمبوننت يشتغل
    this.user = this.loginService.getUserFromLocalStorage();

    // ولو حبيت تتابع أي تغييرات تحصل على بيانات المستخدم (observable)
    this.loginService.user$.subscribe((user) => {
      this.user = user;
    });
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
