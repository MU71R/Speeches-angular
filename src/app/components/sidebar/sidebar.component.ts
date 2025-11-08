import {
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/service/login.service';
import { User } from 'src/app/model/user';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  user: User | null = null;
  private resizeObserver: ResizeObserver | null = null;

  @Output() sidebarToggled = new EventEmitter<boolean>();

  constructor(private router: Router, private loginService: LoginService) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadUserData();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          this.checkScreenSize();
        }
      });

      this.resizeObserver.observe(document.body);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  @HostListener('window:orientationchange')
  onOrientationChange(): void {
    setTimeout(() => this.checkScreenSize(), 100);
  }

  private checkScreenSize(): void {
    if (window.innerWidth >= 992) {
      // على الشاشات الكبيرة، الشريط مفتوح دائماً
      this.isSidebarOpen = true;
    } else {
      // على الجوال، الشريط مغلق افتراضياً
      this.isSidebarOpen = false;
    }
    this.sidebarToggled.emit(this.isSidebarOpen);
  }

  private loadUserData(): void {
    this.user = this.loginService.getUserFromLocalStorage();

    this.loginService.user$.subscribe((user) => {
      this.user = user;
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.sidebarToggled.emit(this.isSidebarOpen);

    if (this.isSidebarOpen) {
      document.body.classList.add('sidebar-open-mobile');
    } else {
      document.body.classList.remove('sidebar-open-mobile');
    }
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    this.sidebarToggled.emit(this.isSidebarOpen);
    document.body.classList.remove('sidebar-open-mobile');
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
