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
  pdfFile: any = null;

  // إضافة الخصائص الجديدة
  pdfLoading = false;
  pdfGenerating = false;
  pdfSearching = false;
  pdfSearchAttempted = false;

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

        // البحث عن PDF باستخدام getPDFbyLetterId
        this.loadPdfByLetterId(id);

        this.loading = false;
      },
      (err) => {
        console.error(err);
        this.loading = false;
      }
    );
  }

  // استخدام getPDFbyLetterId للبحث عن PDF
  private loadPdfByLetterId(letterId: string) {
    this.pdfSearching = true;
    this.pdfSearchAttempted = true;

    this.letterService.getPDFbyLetterId(letterId).subscribe({
      next: (response) => {
        this.pdfSearching = false;
        if (response.success && response.pdfFile) {
          this.pdfFile = response.pdfFile;
          this.pdfUrl = response.pdfFile.pdfurl;
          this.pdfFilename = this.extractFilenameFromUrl(
            response.pdfFile.pdfurl
          );
          console.log(
            'تم العثور على PDF باستخدام getPDFbyLetterId:',
            this.pdfFile
          );
        } else {
          // إذا لم يتم العثور على PDF، البحث بطرق أخرى
          this.findAndSetPdfUrl();
        }
      },
      error: (err) => {
        this.pdfSearching = false;
        console.error('خطأ في جلب PDF:', err);
        // في حالة الخطأ، البحث بطرق أخرى
        this.findAndSetPdfUrl();
      },
    });
  }

  // البحث عن رابط PDF بطرق مختلفة (كبديل)
  private findAndSetPdfUrl() {
    // الطريقة 1: البحث في حقل pdfUrl في البيانات الأصلية
    if (this.original?.pdfUrl) {
      this.pdfUrl = this.original.pdfUrl;
      this.pdfFilename = this.extractFilenameFromUrl(this.original.pdfUrl);
      console.log('تم العثور على PDF في البيانات الأصلية:', this.pdfUrl);
      return;
    }

    // الطريقة 2: البحث في الـ approvals
    if (this.original?.approvals && this.original.approvals.length > 0) {
      const presidentApproval = this.original.approvals.find(
        (approval: any) =>
          approval.role === 'UniversityPresident' && approval.approved === true
      );

      if (presidentApproval) {
        this.generatePdfFilenameFromLetterData();
        console.log('تم العثور على موافقة رئيس - نفترض وجود PDF');
        return;
      }
    }

    // الطريقة 3: إذا كان الخطاب معتمداً، نبحث عن PDF في الخادم
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

  // الدوال الجديدة للتعامل مع PDF
  handlePdfAction(): void {
    if (this.pdfUrl) {
      this.openPdf();
    } else {
      this.generatePdf();
    }
  }

  getPdfButtonIcon(): string {
    if (this.pdfLoading || this.pdfGenerating || this.pdfSearching) {
      return 'bi-arrow-clockwise spin';
    }
    return this.pdfUrl ? 'bi-file-pdf' : 'bi-file-earmark-plus';
  }

  getPdfButtonText(): string {
    if (this.pdfLoading) return 'جاري التحميل...';
    if (this.pdfGenerating) return 'جاري الإنشاء...';
    if (this.pdfSearching) return 'جاري البحث...';
    return this.pdfUrl ? 'عرض PDF' : 'إنشاء PDF';
  }

  getViewButtonIcon(): string {
    return this.pdfLoading ? 'bi-arrow-clockwise spin' : 'bi-eye';
  }

  getViewButtonText(): string {
    return this.pdfLoading ? 'جاري التحميل...' : 'عرض PDF';
  }

  generatePdf(): void {
    if (!this.original?._id) return;

    this.pdfGenerating = true;
    this.letterService.generateOfficialLetterPDF(this.original._id).subscribe({
      next: (result) => {
        this.pdfGenerating = false;
        if (result.pdfUrl) {
          this.pdfUrl = result.pdfUrl;
          this.pdfFilename = this.extractFilenameFromUrl(result.pdfUrl);
          this.savePdfUrlToDatabase(result.pdfUrl);
          console.log('تم إنشاء PDF جديد:', result.pdfUrl);

          // إعادة تحميل معلومات PDF
          this.loadPdfByLetterId(this.original._id);
        }
      },
      error: (err) => {
        this.pdfGenerating = false;
        console.error('خطأ في إنشاء PDF:', err);
        alert('حدث خطأ أثناء إنشاء PDF');
      },
    });
  }

  regeneratePdf(): void {
    if (!this.original?._id) return;

    this.pdfGenerating = true;
    this.letterService.generateOfficialLetterPDF(this.original._id).subscribe({
      next: (result) => {
        this.pdfGenerating = false;
        if (result.pdfUrl) {
          this.pdfUrl = result.pdfUrl;
          this.pdfFilename = this.extractFilenameFromUrl(result.pdfUrl);
          this.savePdfUrlToDatabase(result.pdfUrl);
          console.log('تم إعادة إنشاء PDF:', result.pdfUrl);

          // إعادة تحميل معلومات PDF
          this.loadPdfByLetterId(this.original._id);
        }
      },
      error: (err) => {
        this.pdfGenerating = false;
        console.error('خطأ في إعادة إنشاء PDF:', err);
        alert('حدث خطأ أثناء إعادة إنشاء PDF');
      },
    });
  }

  // دالة لفتح PDF في نافذة جديدة
  openPdf(): void {
    if (!this.pdfUrl) return;

    this.pdfLoading = true;
    if (this.pdfUrl.startsWith('http')) {
      // إذا كان رابط مباشر
      window.open(this.pdfUrl, '_blank');
      this.pdfLoading = false;
    } else if (this.pdfFilename) {
      // إذا كان اسم ملف فقط
      const baseUrl = 'http://localhost:3000/generated-files';
      const pdfUrl = `${baseUrl}/${encodeURIComponent(this.pdfFilename)}`;
      window.open(pdfUrl, '_blank');
      this.pdfLoading = false;
    } else {
      this.pdfLoading = false;
      alert('لا يوجد ملف PDF متاح للعرض');
    }
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
    } else {
      alert('لا يوجد ملف PDF متاح للتنزيل');
    }
  }

  // دوال الموافقات
  getApprovalUserName(approval: any): string {
    if (approval.user?.fullname) return approval.user.fullname;
    if (approval.user?.name) return approval.user.name;
    if (approval.role === 'supervisor') {
      return this.original?.decision?.supervisor?.fullname || 'المشرف';
    }
    return approval.role === 'UniversityPresident' ? 'رئيس الجامعة' : 'مستخدم';
  }

  getApprovalRoleText(role: string): string {
    const roleMap: { [key: string]: string } = {
      supervisor: 'المراجع',
      UniversityPresident: 'رئيس الجامعة',
      user: 'المستخدم',
    };
    return roleMap[role] || role;
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

          // إعادة تحميل معلومات PDF
          this.loadPdfByLetterId(this.original._id);
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

  // التحقق من إمكانية عرض زر PDF
  showPdfButton(): boolean {
    return this.original?.status === 'approved';
  }

  // التحقق من إمكانية عرض قسم PDF
  canShowPdf(): boolean {
    const canShow =
      this.showPdfButton() &&
      (this.pdfSearchAttempted || !!this.pdfUrl || !!this.pdfFilename);
    return canShow;
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
