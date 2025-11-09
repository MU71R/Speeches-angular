import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ArchiveService } from 'src/app/service/archive.service';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.css'],
})
export class ArchiveComponent {
  loading = false;

  constructor(private router: Router, private archiveService: ArchiveService) {}

  // 📂 عند الضغط على أي نوع أرشيف
  getArchivedLettersByType(type: string) {
    this.loading = true;
    // ننتقل إلى صفحة التفاصيل مع النوع المطلوب
    this.router
      .navigate(['/archive-detail'], { queryParams: { type } })
      .then(() => {
        this.loading = false;
      });
  }

  // 👤 للأرشيف الشخصي فقط
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
