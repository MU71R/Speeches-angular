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
  currentYear = new Date().getFullYear();

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
      if (this.type) localStorage.setItem('archiveType', this.type);

      if (this.type === 'شخصي') {
        this.getPersonalArchive();
      } else if (this.type === 'مراجع') {
        this.getArchivedSupervisor();
      } else {
        this.getArchivedLettersByType(this.type);
      }
    });
  }

  // الدوال الأساسية
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
        this.showError('حدث خطأ أثناء جلب الأرشيف الشخصي');
      },
    });
  }

  getArchivedSupervisor() {
    this.loading = true;
    this.archiveService.getArchivedsupervisor().subscribe({
      next: (res: any) => {
        this.letters = res?.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ أثناء جلب أرشيف المراجع:', err);
        this.loading = false;
        this.showError('حدث خطأ أثناء جلب أرشيف المراجع');
      },
    });
  }

  getArchivedLettersByType(type: string) {
    this.loading = true;
    this.archiveService.getArchivedLettersByType(type).subscribe({
      next: (res: any) => {
        // استخدام جميع البيانات بدون تصفية لأن الخادم يعيد البيانات المصفاة بالفعل
        this.letters = res?.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ أثناء جلب الأرشيف:', err);
        this.loading = false;
        this.showError('حدث خطأ أثناء جلب الأرشيف');
      },
    });
  }

  // دوال جديدة للتعامل مع البيانات الفعلية
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

  // تنسيق الوصف لعرض HTML بشكل صحيح
  formatDescription(description: string): string {
    if (!description) return '';

    // تنظيف النص من العلامات غير المرغوب فيها
    let cleanedDescription = description
      .replace(/<br\s*\/?>/gi, '<br>')
      .replace(/data-start="[^"]*"/g, '')
      .replace(/data-end="[^"]*"/g, '')
      .replace(/\\n/g, '<br>');

    return cleanedDescription;
  }

  // الحصول على اسم الملف من المسار
  getFileName(filePath: string): string {
    if (!filePath) return 'ملف مرفق';

    // استخراج اسم الملف من المسار
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1] || 'ملف مرفق';
  }

  // الحصول على نص حالة الخطاب
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      approved: 'معتمد',
      pending: 'قيد المراجعة',
      rejected: 'مرفوض',
      draft: 'مسودة',
    };
    return statusMap[status] || 'غير محدد';
  }

  // الحصول على كلاس الحالة
  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      approved: 'status-approved',
      pending: 'status-pending',
      rejected: 'status-rejected',
      draft: 'status-pending',
    };
    return classMap[status] || 'status-pending';
  }

  // الحصول على نص الدور
  getRoleText(role: string): string {
    const roleMap: { [key: string]: string } = {
      supervisor: 'مراجع',
      UniversityPresident: 'رئيس الجامعة',
      admin: 'مدير نظام',
      user: 'مستخدم',
    };
    return roleMap[role] || role;
  }

  // الدوال الجديدة للإحصائيات
  getCurrentYearDocuments(): number {
    return this.letters.filter((letter) => {
      try {
        const letterYear = new Date(letter.date).getFullYear();
        return letterYear === this.currentYear;
      } catch {
        return false;
      }
    }).length;
  }

  getDocumentsWithAttachments(): number {
    return this.letters.filter((letter) => letter.attachment).length;
  }

  getUniqueUsers(): number {
    const users = new Set(
      this.letters.map((letter) => letter.user?._id).filter((id) => id) // إزالة القيم null/undefined
    );
    return users.size;
  }

  getTypeBadgeClass(type: string): string {
    const badgeMap: { [key: string]: string } = {
      'رئاسة الجمهورية': 'badge-presidential',
      'وزارة التعليم العالي': 'badge-ministerial',
      'رئاسة الوزراء': 'badge-governmental',
      عامة: 'badge-general',
      شخصي: 'badge-personal',
      مراجع: 'badge-review',
    };
    return badgeMap[type] || 'badge-general';
  }

  getFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeFile() {
    this.newArchive.file = null;
  }

  goBack() {
    this.router.navigate(['/archive']);
  }

  isSpecialArchive(): boolean {
    const allowed = [
      'رئاسة الوزراء',
      'رئاسة الجمهورية',
      'وزارة التعليم العالي',
      'رئيس الجمهورية',
      'رئيس الوزراء',
    ];
    return allowed.includes(this.type);
  }

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.newArchive.file = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        this.showError('حجم الملف يجب أن يكون أقل من 10MB');
        return;
      }
      this.newArchive.file = file;
    }
  }

  uploadArchive() {
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

        // إعادة تحميل البيانات حسب النوع
        this.reloadData();
      },
      error: (err) => {
        this.uploading = false;
        console.error('خطأ أثناء الرفع:', err);
        this.showError('حدث خطأ أثناء رفع الأرشيف');
      },
    });
  }

  // دالة مساعدة لإعادة تحميل البيانات
  private reloadData() {
    if (this.type === 'شخصي') {
      this.getPersonalArchive();
    } else if (this.type === 'مراجع') {
      this.getArchivedSupervisor();
    } else {
      this.getArchivedLettersByType(this.type);
    }
  }

  resetForm() {
    this.newArchive = {
      title: '',
      description: '',
      date: '',
      letterType: 'رئاسة الجمهورية',
      file: null,
    };
  }

  viewLetter(id: string) {
    this.router.navigate(['/letter-detail', id]);
  }

  getAttachmentUrl(fileName: string): string {
    if (!fileName) return '';

    // تنظيف مسار الملف إذا كان يحتوي على مسار كامل
    let cleanPath = fileName;
    if (fileName.includes('\\')) {
      const parts = fileName.split('\\');
      cleanPath = parts[parts.length - 1];
    }

    return `http://localhost:5000/${cleanPath}`;
  }

  // دوال المساعدة للتنبيهات
  private showSuccess(message: string) {
    Swal.fire({
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 1500,
    });
  }

  private showError(message: string) {
    Swal.fire({
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 2000,
    });
  }

  // دالة إضافية للتحقق من وجود بيانات المستخدم
  hasUserData(letter: any): boolean {
    return letter.user && letter.user.fullname;
  }

  // دالة إضافية للتحقق من وجود قرار
  hasDecisionData(letter: any): boolean {
    return letter.decision && letter.decision.title;
  }

  // دالة إضافية للتحقق من وجود موافقات
  hasApprovals(letter: any): boolean {
    return letter.approvals && letter.approvals.length > 0;
  }
}
