import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ArchiveService } from 'src/app/service/archive.service';
import { LoginService } from 'src/app/service/login.service';
import { LetterService } from 'src/app/service/letter.service';

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
        this.loading = false;
      },
      (err) => {
        console.error(err);
        this.loading = false;
      }
    );
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
                      window.open(letter.pdfUrl, '_blank');
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
