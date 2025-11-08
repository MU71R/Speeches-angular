import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ArchiveService } from 'src/app/service/archive.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-archive-detail',
  templateUrl: './archive-detail.component.html',
  styleUrls: ['./archive-detail.component.css']
})
export class ArchiveDetailComponent implements OnInit {
  
  type = '';
  letters: any[] = [];
  loading = true;
  showUploadModal = false;
  uploading = false;

  // نموذج الأرشيف الجديد
  newArchive = {
    title: '',
    description: '',
    date: '',
    letterType: '',
    file: null as File | null
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private archiveService: ArchiveService
  ) {}

  ngOnInit(): void {
    // استرجاع نوع الأرشيف من الـ query params أو localStorage
    this.route.queryParams.subscribe(params => {
      this.type = params['type'] || localStorage.getItem('archiveType') || '';
      if (this.type) localStorage.setItem('archiveType', this.type);

      // جلب البيانات حسب النوع
      if (this.type === 'شخصي') {
        this.getPersonalArchive();
      } else {
        this.getArchivedLettersByType(this.type);
      }
    });
  }

  // جلب الأرشيف الشخصي
  getPersonalArchive() {
    this.loading = true;
    this.archiveService.getPersonalArchive().subscribe({
      next: (res: any) => {
        this.letters = res?.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ أثناء جلب الأرشيف الشخصي:', err);
        this.loading = false;
      }
    });
  }

  // جلب الرسائل المؤرشفة حسب النوع
  getArchivedLettersByType(type: string) {
    this.loading = true;
    this.archiveService.getArchivedLettersByType(type).subscribe({
      next: (res: any) => {
        this.letters = res?.data?.filter((l: any) => l.letterType === type) || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ أثناء جلب الأرشيف:', err);
        this.loading = false;
      }
    });
  }

  // التحقق من الأنواع الخاصة فقط
  isSpecialArchive(): boolean {
    const allowed = [
      'رئاسة الوزراء', 
      'رئاسة الجمهورية', 
      'وزارة التعليم العالي', 
      'رئيس الجمهورية', 
      'رئيس الوزراء'
    ];
    return allowed.includes(this.type);
  }

  // فتح/إغلاق نافذة رفع الأرشيف
  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  // التعامل مع الملف عند اختياره
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.newArchive.file = file;
  }

  // رفع الأرشيف
  uploadArchive() {
    if (!this.newArchive.title || !this.newArchive.date) {
      return alert('الرجاء إدخال العنوان والتاريخ');
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
        Swal.fire({
          icon: 'success',
          title: 'تم رفع الأرشيف بنجاح',
          showConfirmButton: false,
          timer: 1500
        });
        this.getArchivedLettersByType(this.type);
      },
      error: (err) => {
        this.uploading = false;
        console.error('خطأ أثناء الرفع:', err);
        Swal.fire({
          icon: 'error',
          title: 'حدث خطأ أثناء رفع الأرشيف',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  }

  // الانتقال لعرض تفاصيل الرسالة
  viewLetter(id: string) {
    this.router.navigate(['/letter-detail', id]);
  }

  // الحصول على رابط المرفقات
  getAttachmentUrl(fileName: string): string {
    return `http://localhost:5000/${fileName}`;
  }
}
