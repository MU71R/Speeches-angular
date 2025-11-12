import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ArchiveService } from 'src/app/service/archive.service';
import { LoginService } from 'src/app/service/login.service';
import { LetterService } from 'src/app/service/letter.service';
import { Letter } from 'src/app/model/Letter';

@Component({
  selector: 'app-letter-detail',
  templateUrl: './letter-detail.component.html',
  styleUrls: ['./letter-detail.component.css'],
})
export class LetterDetailComponent implements OnInit {
  form!: FormGroup;
  original: any = null;
  previewHtml = '';
  reviewNotes = '';
  loading = true;
  processing = false;
  isEditing = false;
  currentUserRole: string = '';
  showPresidentOptions = false;
  showRejectionReason = false;
  rejectionReason = '';
  pdfUrl: string | null = null;
  pdfFilename: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private archiveService: ArchiveService,
    private loginService: LoginService,
    private letterService: LetterService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [''],
      description: [''],
      rationale: [''],
    });
    const user = this.loginService.getUserFromLocalStorage();
    this.currentUserRole =
      user?.role === 'UniversityPresident'
        ? 'UniversityPresident'
        : 'supervisor';
    const letterId = this.route.snapshot.paramMap.get('id');
    if (letterId) this.loadLetter(letterId);
  }

  loadLetter(id: string) {
    this.loading = true;
    this.letterService.getLetter(id).subscribe(
      (res: any) => {
        this.original = res.data || res;
        this.form.patchValue({
          title: this.original?.title || '',
          description: this.original?.description || '',
          rationale: this.original?.Rationale || '',
        });
        this.previewHtml = this.original?.description || '';

        console.log('بيانات الخطاب:', this.original);

        // البحث عن PDF بطرق مختلفة
        this.findAndSetPdfUrl();

        this.loading = false;
      },
      (err) => {
        console.error(err);
        this.loading = false;
      }
    );
  }

  // البحث عن رابط PDF بطرق مختلفة
  private findAndSetPdfUrl() {
    // الطريقة 1: البحث في البيانات المحلية أولاً
    if (this.pdfUrl) {
      this.pdfFilename = this.extractFilenameFromUrl(this.pdfUrl);
      console.log('تم العثور على PDF محلي:', this.pdfUrl);
      return;
    }

    // الطريقة 2: البحث في حقل pdfUrl في البيانات الأصلية
    if (this.original?.pdfUrl) {
      this.pdfUrl = this.original.pdfUrl;
      this.pdfFilename = this.extractFilenameFromUrl(this.original.pdfUrl);
      console.log('تم العثور على PDF في البيانات الأصلية:', this.pdfUrl);
      return;
    }

    // الطريقة 3: البحث في الـ approvals
    if (this.original?.approvals && this.original.approvals.length > 0) {
      const presidentApproval = this.original.approvals.find(
        (approval: any) =>
          approval.role === 'UniversityPresident' && approval.approved === true
      );

      if (presidentApproval) {
        // إذا كان هناك موافقة من الرئيس، نفترض أن هناك PDF
        this.generatePdfFilenameFromLetterData();
        console.log('تم العثور على موافقة رئيس - نفترض وجود PDF');
        return;
      }
    }

    // الطريقة 4: إذا كان الخطاب معتمداً، نبحث عن PDF في الخادم
    if (this.original?.status === 'approved') {
      this.checkForPdfInServer();
    }

    console.log('لم يتم العثور على PDF');
  }

  // توليد اسم ملف PDF من بيانات الخطاب
  private generatePdfFilenameFromLetterData() {
    if (!this.original) return;

    const letterId = this.original._id;
    const title = this.original.title
      ? this.original.title.replace(/[^\w\u0600-\u06FF]/g, '_')
      : 'خطاب';

    this.pdfFilename = `letter_${letterId}_${title}.pdf`;
    console.log('تم توليد اسم PDF:', this.pdfFilename);
  }

  // التحقق من وجود PDF في الخادم
  private checkForPdfInServer() {
    if (!this.original?._id) return;

    // هنا يمكنك إضافة استدعاء للخادم للتحقق من وجود PDF
    // مؤقتاً سنفترض أن الخطاب المعتمد له PDF
    this.generatePdfFilenameFromLetterData();
  }

  // استخراج اسم الملف من الرابط
  private extractFilenameFromUrl(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  // توليد اسم ملف للتنزيل
  private generateDownloadName(): string {
    const title = this.original?.title
      ? this.original.title.replace(/[^\w\u0600-\u06FF]/g, '_')
      : 'خطاب';
    const date = this.original?.date
      ? new Date(this.original.date).toISOString().split('T')[0]
      : '';
    return `خطاب_${title}_${date}.pdf`;
  }

  enableEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.form.patchValue({
      title: this.original?.title,
      description: this.original?.description,
      rationale: this.original?.Rationale,
    });
    this.previewHtml = this.original?.description;
  }

  saveChanges() {
    this.processing = true;
    const updatedData = {
      ...this.form.value,
      Rationale: this.form.value.rationale,
    };

    this.letterService.updateLetter(this.original._id, updatedData).subscribe(
      () => {
        this.original = {
          ...this.original,
          ...this.form.value,
          Rationale: this.form.value.rationale,
        };
        this.previewHtml = this.form.value.description;
        this.isEditing = false;
        this.processing = false;
      },
      (err) => {
        console.error(err);
        this.processing = false;
      }
    );
  }

  onDescriptionChange() {
    this.previewHtml = this.form.value.description;
  }

  showRejectionForm() {
    this.showRejectionReason = true;
    this.rejectionReason = '';
  }

  cancelRejection() {
    this.showRejectionReason = false;
    this.rejectionReason = '';
  }

  confirmRejectionSupervisor() {
    if (!this.rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    this.processing = true;

    this.letterService
      .updateStatusBySupervisor(
        this.original._id,
        'rejected',
        this.rejectionReason
      )
      .subscribe(
        (res: any) => {
          this.original.status = 'rejected';
          this.original.reasonForRejection = this.rejectionReason;
          this.showRejectionReason = false;
          this.rejectionReason = '';
          this.processing = false;
        },
        (err) => {
          console.error(err);
          this.processing = false;
        }
      );
  }

  confirmRejectionPresident() {
    if (!this.rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    this.processing = true;

    this.letterService
      .updateStatusByUniversityPresident(
        this.original._id,
        'rejected',
        this.rejectionReason
      )
      .subscribe(
        (res: any) => {
          this.original.status = 'rejected';
          this.original.reasonForRejection = this.rejectionReason;
          this.showRejectionReason = false;
          this.rejectionReason = '';
          this.processing = false;
        },
        (err) => {
          console.error(err);
          this.processing = false;
        }
      );
  }

  confirmRejection() {
    if (this.currentUserRole === 'supervisor') {
      this.confirmRejectionSupervisor();
    } else {
      this.confirmRejectionPresident();
    }
  }

  approveLetter(option?: 'حقيقية' | 'الممسوحة ضوئيا') {
    if (!this.original?._id) return;

    this.processing = true;

    if (this.currentUserRole === 'supervisor') {
      this.letterService
        .updateStatusBySupervisor(this.original._id, 'pending')
        .subscribe({
          next: () => {
            this.original.status = 'pending';
            this.processing = false;
          },
          error: (err) => {
            console.error(err);
            this.processing = false;
          },
        });
    } else if (this.currentUserRole === 'UniversityPresident') {
      if (!option) {
        this.letterService
          .updateStatusByUniversityPresident(
            this.original._id,
            'approved',
            'حقيقية'
          )
          .subscribe({
            next: () => {
              this.original.status = 'approved';
              this.processing = false;
              // بعد الموافقة، إنشاء PDF تلقائياً
              this.generateAndSavePdf();
            },
            error: (err) => {
              console.error(err);
              this.processing = false;
            },
          });
      } else {
        this.letterService
          .updateStatusByUniversityPresident(
            this.original._id,
            'approved',
            option
          )
          .subscribe({
            next: () => {
              this.original.status = 'approved';
              this.letterService
                .printLetterByType(this.original._id, option)
                .subscribe({
                  next: (letter) => {
                    this.processing = false;
                    this.showPresidentOptions = false;

                    if (letter.pdfUrl) {
                      this.pdfUrl = letter.pdfUrl;
                      this.pdfFilename = this.extractFilenameFromUrl(
                        letter.pdfUrl
                      );
                      // حفظ PDF في قاعدة البيانات
                      this.savePdfUrlToDatabase(letter.pdfUrl);
                      console.log('تم إنشاء PDF جديد:', letter.pdfUrl);
                    } else {
                      alert('لم يتم توليد ملف PDF بعد.');
                    }
                  },
                  error: (err) => {
                    console.error(err);
                    this.processing = false;
                    alert('حدث خطأ أثناء توليد PDF.');
                  },
                });
            },
            error: (err) => {
              console.error(err);
              this.processing = false;
            },
          });
      }
    }
  }

  // إنشاء وحفظ PDF تلقائياً عند الموافقة
  private generateAndSavePdf() {
    this.letterService.generateOfficialLetterPDF(this.original._id).subscribe({
      next: (result) => {
        if (result.pdfUrl) {
          this.pdfUrl = result.pdfUrl;
          this.pdfFilename = this.extractFilenameFromUrl(result.pdfUrl);
          // حفظ PDF في قاعدة البيانات
          this.savePdfUrlToDatabase(result.pdfUrl);
          console.log('تم إنشاء PDF تلقائياً:', result.pdfUrl);
        }
      },
      error: (err) => {
        console.error('خطأ في إنشاء PDF تلقائي:', err);
      },
    });
  }

  // حفظ رابط PDF في قاعدة البيانات
  private savePdfUrlToDatabase(pdfUrl: string) {
    const updateData = { pdfUrl: pdfUrl };
    this.letterService.updateLetter(this.original._id, updateData).subscribe({
      next: () => {
        console.log('تم حفظ رابط PDF في قاعدة البيانات');
        // تحديث البيانات المحلية
        this.original.pdfUrl = pdfUrl;
      },
      error: (err) => {
        console.error('خطأ في حفظ رابط PDF:', err);
      },
    });
  }

  // دالة لفتح PDF في نافذة جديدة باستخدام service
 openPdf(fileName: string): void {
  if (!fileName) return;
  const baseUrl = 'http://localhost:3000/generated-files';
  const pdfUrl = `${baseUrl}/${encodeURIComponent(fileName)}`;
  window.open(pdfUrl, '_blank');
}


  // دالة لتنزيل PDF باستخدام service
  downloadPdf() {
    if (this.pdfFilename) {
      const downloadName = this.generateDownloadName();
      console.log('تنزيل PDF باسم:', this.pdfFilename, 'كـ:', downloadName);
      this.letterService.downloadPDF(this.pdfFilename, downloadName);
    } else if (this.pdfUrl) {
      // إذا كان رابط مباشر، استخدام الطريقة القديمة
      const link = document.createElement('a');
      link.href = this.pdfUrl;
      link.download = this.generateDownloadName();
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (this.original?.pdfUrl) {
      const filename = this.extractFilenameFromUrl(this.original.pdfUrl);
      const downloadName = this.generateDownloadName();
      console.log(
        'تنزيل PDF من البيانات الأصلية:',
        filename,
        'كـ:',
        downloadName
      );
      this.letterService.downloadPDF(filename, downloadName);
    } else {
      alert('لا يوجد ملف PDF متاح للتنزيل');
    }
  }

  // التحقق من إمكانية عرض زر PDF - المعدلة
  showPdfButton(): boolean {
    // أي خطاب معتمد (approved) يظهر الزر
    const isApproved = this.original?.status === 'approved';
    const hasPdfInfo = !!(
      this.pdfUrl ||
      this.original?.pdfUrl ||
      this.pdfFilename
    );

    console.log('فحص زر PDF:', {
      status: this.original?.status,
      isApproved: isApproved,
      pdfUrl: this.pdfUrl,
      originalPdfUrl: this.original?.pdfUrl,
      pdfFilename: this.pdfFilename,
      hasPdfInfo: hasPdfInfo,
      showButton: isApproved,
    });

    // إذا كان الخطاب معتمداً، اعرض الزر بغض النظر عن وجود PDF
    return isApproved;
  }

  // التحقق من إمكانية عرض قسم PDF
  canShowPdf(): boolean {
    return (
      this.showPdfButton() &&
      !!(this.pdfUrl || this.original?.pdfUrl || this.pdfFilename)
    );
  }

  canEdit(): boolean {
    return (
      !['approved', 'rejected'].includes(this.original?.status) &&
      this.isEditingAllowedByRole()
    );
  }

  isEditingAllowedByRole(): boolean {
    if (this.currentUserRole === 'supervisor') {
      return this.original?.status === 'in_progress';
    }
    return this.original?.status === 'pending';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'rejected':
        return 'badge bg-danger';
      case 'in_progress':
        return 'badge bg-info text-dark';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'approved':
        return 'تمت الموافقة';
      case 'pending':
        return 'قيد المراجعة لدى الرئيس';
      case 'rejected':
        return 'مرفوض';
      case 'in_progress':
        return 'قيد المعالجة';
      default:
        return 'غير محدد';
    }
  }

  getStepClass(step: number): string {
    const status = this.original?.status || '';
    if (status === 'rejected') return '';

    if (status === 'in_progress' && step === 1) return 'active';
    if (status === 'pending' && step <= 2)
      return step === 2 ? 'active' : 'completed';
    if (status === 'approved' && step <= 3) return 'completed';

    return '';
  }

  showReviewActions(): boolean {
    return (
      (this.currentUserRole === 'supervisor' &&
        this.original?.status === 'in_progress') ||
      (this.currentUserRole === 'UniversityPresident' &&
        this.original?.status === 'pending')
    );
  }

  showRejectionDetails(): boolean {
    return (
      this.original?.status === 'rejected' && this.original?.reasonForRejection
    );
  }
}
