import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ArchiveService } from 'src/app/service/archive.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-archive-detail',
  templateUrl: './archive-detail.component.html',
  styleUrls: ['./archive-detail.component.css'],
})
export class ArchiveDetailComponent implements OnInit {
  type = '';
  letters: any[] = [];
  loading = true;
  showUploadModal = false;
  uploading = false;

  newArchive = {
    title: '',
    description: '',
    date: '',
    letterType: 'رئاسة الجمهورية',
    file: null as File | null,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private archiveService: ArchiveService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.type = params['type'] || localStorage.getItem('archiveType') || '';
      if (this.type) {
        localStorage.setItem('archiveType', this.type);
      }

      if (this.type === 'شخصي') {
        this.getPersonalArchive();
      } else if (this.type === 'مراجع') {
        this.getArchivedSupervisor();
      } else {
        this.getArchivedLettersByType(this.type);
      }
    });
  }

  trackByLetterId(index: number, letter: any): string {
    return letter._id;
  }

  getPersonalArchive(): void {
    this.loading = true;
    this.archiveService.getPersonalArchive().subscribe({
      next: (res: any) => {
        this.letters = res?.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('خطأ أثناء جلب الأرشيف الشخصي:', err);
        this.loading = false;
        this.showError('حدث خطأ أثناء جلب الأرشيف الشخصي');
      },
    });
  }

  getArchivedSupervisor(): void {
    this.loading = true;
    this.archiveService.getArchivedsupervisor().subscribe({
      next: (res: any) => {
        this.letters = res?.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('خطأ أثناء جلب أرشيف المراجع:', err);
        this.loading = false;
        this.showError('حدث خطأ أثناء جلب أرشيف المراجع');
      },
    });
  }

  getArchivedLettersByType(type: string): void {
    this.loading = true;
    this.archiveService.getArchivedLettersByType(type).subscribe({
      next: (res: any) => {
        this.letters = res?.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('خطأ أثناء جلب الأرشيف:', err);
        this.loading = false;
        this.showError('حدث خطأ أثناء جلب الأرشيف');
      },
    });
  }

  viewLetterDetails(letterId: string): void {
    this.router.navigate(['/letter-detail', letterId]);
  }

  getArchiveTitle(): string {
    const titles: { [key: string]: string } = {
      شخصي: 'الأرشيف الشخصي',
      مراجع: 'أرشيف المراجع',
      'رئاسة الجمهورية': 'أرشيف رئاسة الجمهورية',
      'وزارة التعليم العالي': 'أرشيف وزارة التعليم العالي',
      'رئاسة الوزراء': 'أرشيف رئاسة الوزراء',
      عامة: 'الأرشيف العام',
    };
    return titles[this.type] || `أرشيف ${this.type}`;
  }

  getArchiveSubtitle(): string {
    const subtitles: { [key: string]: string } = {
      شخصي: 'الخطابات والقرارات التي أرسلتها أو استلمتها',
      مراجع: 'القرارات التي وافق عليها المراجع الخاص بك',
      'رئاسة الجمهورية': 'مراسيم وقرارات رئاسية',
      'وزارة التعليم العالي': 'قرارات ووثائق وزارة التعليم العالي',
      'رئاسة الوزراء': 'قرارات مجلس الوزراء الرسمية',
      عامة: 'قرارات ووثائق الجامعة الرسمية',
    };
    return (
      subtitles[this.type] || 'قائمة الخطابات والأوامر المعتمدة ضمن هذا التصنيف'
    );
  }

  getFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeFile(): void {
    this.newArchive.file = null;
  }

  isSpecialArchive(): boolean {
    const allowed = [
      'رئاسة الوزراء',
      'رئاسة الجمهورية',
      'وزارة التعليم العالي',
    ];
    return allowed.includes(this.type);
  }

  openUploadModal(): void {
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.newArchive.file = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.showError('حجم الملف يجب أن يكون أقل من 10MB');
        return;
      }
      this.newArchive.file = file;
    }
  }

  uploadArchive(): void {
    if (!this.newArchive.title || !this.newArchive.date) {
      this.showError('الرجاء إدخال العنوان والتاريخ');
      return;
    }

    this.uploading = true;

    const formData = new FormData();
    formData.append('title', this.newArchive.title);
    formData.append('breeif', this.newArchive.description || '');
    formData.append('date', this.newArchive.date);
    formData.append('letterType', this.newArchive.letterType);
    if (this.newArchive.file) {
      formData.append('file', this.newArchive.file);
    }

    this.archiveService.addArchive(formData).subscribe({
      next: (res: any) => {
        this.uploading = false;
        this.showUploadModal = false;
        this.showSuccess('تم رفع الأرشيف بنجاح');
        this.resetForm();
        this.reloadData();
      },
      error: (err: any) => {
        this.uploading = false;
        console.error('خطأ أثناء الرفع:', err);
        this.showError('حدث خطأ أثناء رفع الأرشيف');
      },
    });
  }

  private reloadData(): void {
    if (this.type === 'شخصي') {
      this.getPersonalArchive();
    } else if (this.type === 'مراجع') {
      this.getArchivedSupervisor();
    } else {
      this.getArchivedLettersByType(this.type);
    }
  }

  private resetForm(): void {
    this.newArchive = {
      title: '',
      description: '',
      date: '',
      letterType: 'رئاسة الجمهورية',
      file: null,
    };
  }

  private showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 2000,
      position: 'top-start',
    });
  }

  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      position: 'top-start',
    });
  }
}
