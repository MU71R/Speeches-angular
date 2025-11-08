import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = true; // افتراضي مفتوح على الشاشات الكبيرة

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (window.innerWidth >= 993) {
      // على الشاشات الكبيرة، الشريط مفتوح افتراضياً
      this.isSidebarOpen = true;
    } else {
      // على الجوال، الشريط مغلق افتراضياً
      this.isSidebarOpen = false;
    }
  }

  onSidebarToggle(isOpen: boolean): void {
    this.isSidebarOpen = isOpen;
  }

  getLayoutClass(): string {
    return this.isSidebarOpen ? 'sidebar-open' : 'sidebar-closed';
  }
}
