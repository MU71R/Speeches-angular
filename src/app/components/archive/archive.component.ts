import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ArchiveService } from 'src/app/service/archive.service';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.css'],
})
export class ArchiveComponent {
  loading = false;

  constructor(private router: Router, private archiveService: ArchiveService, private authService: AuthService) {}

  user = this.authService.currentUserValue;

  getArchivedLettersByType(type: string) {
    this.loading = true;
    this.router
      .navigate(['/archive-detail'], { queryParams: { type } })
      .then(() => {
        this.loading = false;
      });
  }

  openPersonalArchive() {
    this.loading = true;
    this.router
      .navigate(['/archive-detail'], {
        queryParams: { type: 'شخصي' },
      })
      .then(() => {
        this.loading = false;
      });
  }

  getArchivedSupervisor() {
    this.loading = true;
    this.router
      .navigate(['/archive-detail'], {
        queryParams: { type: 'مراجع' },
      })
      .then(() => {
        this.loading = false;
      });
  }
}
