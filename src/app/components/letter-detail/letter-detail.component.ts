import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LetterService } from '../../service/letter.service';
import { LetterDetail } from 'src/app/model/letter-detail';

@Component({
  selector: 'app-letter-detail',
  templateUrl: './letter-detail.component.html',
  styleUrls: ['./letter-detail.component.css'],
})
export class LetterDetailComponent implements OnInit {
  form!: FormGroup;
  id!: string;
  loading = false;
  processing = false;
  isEditing = false;
  success = '';
  error = '';
  previewHtml?: SafeHtml;
  original?: LetterDetail;
  reviewNotes = '';
  currentUserRole: string = 'supervisor'; // يجب استبدالها بالمستخدم الحقيقي

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: LetterService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();

    if (this.id) {
      this.loadLetter();
    }
  }

  loadLetter() {
    this.loading = true;
    this.svc.getLetter(this.id).subscribe({
      next: (l) => {
        if (l) {
          this.original = l;
          this.form.patchValue({
            title: l.title,
            description: l.description,
            status: l.status || 'in_progress',
            date: l.date ? new Date(l.date).toISOString().substring(0, 10) : '',
          });
          this.updatePreview(l.description || '');
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'فشل جلب الخطاب';
        this.loading = false;
      },
    });
  }

  initForm() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(300)]],
      description: ['', [Validators.required]],
      status: ['in_progress', Validators.required],
      date: [''],
    });
  }

  enableEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    if (this.original) {
      this.form.patchValue({
        title: this.original.title,
        description: this.original.description,
        status: this.original.status || 'in_progress',
        date: this.original.date
          ? new Date(this.original.date).toISOString().substring(0, 10)
          : '',
      });
      this.updatePreview(this.original.description || '');
    }
  }

  onDescriptionChange() {
    const v = this.form.value.description || '';
    this.updatePreview(v);
  }

  updatePreview(html: string) {
    const cleanedHtml = html.replace(/data-[^=]+="[^"]*"/g, '');
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(cleanedHtml);
  }

  saveChanges() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: Partial<LetterDetail> = {
      title: this.form.value.title,
      description: this.form.value.description,
      status: this.form.value.status,
      date: this.form.value.date
        ? new Date(this.form.value.date).toISOString()
        : undefined,
    };

    this.loading = true;
    this.svc.updateLetter(this.id, payload).subscribe({
      next: () => {
        this.original = { ...this.original!, ...payload } as LetterDetail;
        this.isEditing = false;
        this.success = 'تم حفظ التغييرات';
        this.loading = false;
      },
      error: () => {
        this.error = 'فشل الحفظ';
        this.loading = false;
      },
    });
  }

  // إجراءات المراجعة
  approveLetter() {
    this.processing = true;

    if (this.currentUserRole === 'supervisor') {
      this.svc.updateStatusBySupervisor(this.id, 'approved').subscribe({
        next: () => {
          this.handleSuccess('تم الموافقة على الخطاب بنجاح');
        },
        error: () => {
          this.handleError('فشل في الموافقة على الخطاب');
        },
      });
    } else if (this.currentUserRole === 'UniversityPresident') {
      this.svc
        .updateStatusByUniversityPresident(this.id, 'approved')
        .subscribe({
          next: () => {
            this.handleSuccess('تم الموافقة على الخطاب بنجاح');
          },
          error: () => {
            this.handleError('فشل في الموافقة على الخطاب');
          },
        });
    }
  }

  rejectLetter() {
    this.processing = true;

    if (this.currentUserRole === 'supervisor') {
      this.svc.updateStatusBySupervisor(this.id, 'rejected').subscribe({
        next: () => {
          this.handleSuccess('تم رفض الخطاب بنجاح');
        },
        error: () => {
          this.handleError('فشل في رفض الخطاب');
        },
      });
    } else if (this.currentUserRole === 'UniversityPresident') {
      this.svc
        .updateStatusByUniversityPresident(this.id, 'rejected')
        .subscribe({
          next: () => {
            this.handleSuccess('تم رفض الخطاب بنجاح');
          },
          error: () => {
            this.handleError('فشل في رفض الخطاب');
          },
        });
    }
  }

  private handleSuccess(message: string) {
    this.success = message;
    this.processing = false;
    this.loadLetter();
    setTimeout(() => this.router.navigate(['/letters']), 2000);
  }

  private handleError(message: string) {
    this.error = message;
    this.processing = false;
  }

  // دوال مساعدة للعرض
  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'badge bg-warning',
      approved: 'badge bg-success',
      rejected: 'badge bg-danger',
      in_progress: 'badge bg-info',
    };
    return classes[status] || 'badge bg-secondary';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'قيد الانتظار',
      approved: 'مقبول',
      rejected: 'مرفوض',
      in_progress: 'قيد المعالجة',
    };
    return statusMap[status] || status;
  }

  getStepClass(step: number): string {
    const status = this.original?.status;

    if (step === 1) return 'bg-primary text-white';

    if (step === 2) {
      if (
        status === 'pending' ||
        status === 'approved' ||
        status === 'rejected'
      ) {
        return 'bg-primary text-white';
      }
    }

    if (step === 3) {
      if (status === 'approved') {
        return 'bg-success text-white';
      }
    }

    return 'bg-light text-muted';
  }

  showReviewActions(): boolean {
    const status = this.original?.status;

    if (this.currentUserRole === 'supervisor' && status === 'in_progress') {
      return true;
    }

    if (
      this.currentUserRole === 'UniversityPresident' &&
      status === 'pending'
    ) {
      return true;
    }

    return false;
  }

  // دالة للحصول على النص المناسب للزر حسب الصلاحية
  getActionButtonText(): string {
    if (this.currentUserRole === 'supervisor') {
      return 'إرسال لرئيس الجامعة';
    } else if (this.currentUserRole === 'UniversityPresident') {
      return 'إنهاء المعالجة';
    }
    return 'معالجة الخطاب';
  }
}
