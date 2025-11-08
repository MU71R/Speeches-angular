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
  selectedOption: string = '';
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private archiveService: ArchiveService,
    private loginService: LoginService,
    private letterService: LetterService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({ title: [''], description: [''] });
    const user = this.loginService.getUserFromLocalStorage();
    this.currentUserRole = user?.role === 'UniversityPresident' ? 'UniversityPresident' : 'supervisor';
    const letterId = this.route.snapshot.paramMap.get('id');
    if (letterId) this.loadLetter(letterId);
  }

  loadLetter(id: string) {
    this.loading = true;
    this.letterService.getLetter(id).subscribe(
      (res: any) => {
        this.original = res.data || res;
        this.form.patchValue({ title: this.original?.title || '', description: this.original?.description || '' });
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
    this.form.patchValue({ title: this.original?.title, description: this.original?.description });
  }

  saveChanges() {
    this.processing = true;
    this.letterService.updateLetter(this.original._id, this.form.value).subscribe(
      () => {
        this.original = { ...this.original, ...this.form.value };
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

  approveLetter() {
    this.processing = true;
    const newStatus = this.currentUserRole === 'supervisor' ? 'pending' : 'approved';
    const updateObs =
      this.currentUserRole === 'supervisor'
        ? this.letterService.updateStatusBySupervisor(this.original._id, newStatus)
        : this.letterService.updateStatusByUniversityPresident(this.original._id, newStatus, 'realscan');

    updateObs.subscribe(
      () => {
        this.original.status = newStatus;
        this.processing = false;
      },
      (err) => {
        console.error(err);
        this.processing = false;
      }
    );
  }

  rejectLetter() {
    this.processing = true;
    const updateObs =
      this.currentUserRole === 'supervisor'
        ? this.letterService.updateStatusBySupervisor(this.original._id, 'rejected')
        : this.letterService.updateStatusByUniversityPresident(this.original._id, 'rejected', 'realscan');

    updateObs.subscribe(
      () => {
        this.original.status = 'rejected';
        this.processing = false;
      },
      (err) => {
        console.error(err);
        this.processing = false;
      }
    );
  }

  approveFinal(option: 'realscan' | 'signature') {
    this.processing = true;
    const payload = { status: 'approved', approvalType: option };

    this.letterService.updateStatusByUniversityPresident(this.original._id, payload.status, payload.approvalType).subscribe(
      () => {
        this.original.status = 'approved';
        this.processing = false;
        alert(option === 'realscan' ? 'تم اعتماد الخطاب باستخدام Real Scan ✅' : 'تم اعتماد الخطاب بالتوقيع الإلكتروني ✍️');
      },
      (err) => {
        console.error(err);
        this.processing = false;
      }
    );
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'badge bg-success';
      case 'pending': return 'badge bg-warning text-dark';
      case 'rejected': return 'badge bg-danger';
      case 'in_progress': return 'badge bg-info text-dark';
      default: return 'badge bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'approved': return 'تمت الموافقة';
      case 'pending': return 'قيد المراجعة لدى الرئيس';
      case 'rejected': return 'مرفوض';
      case 'in_progress': return 'قيد المعالجة';
      default: return 'غير محدد';
    }
  }

  getStepClass(step: number): string {
    const status = this.original?.status || '';
    if (status === 'in_progress' && step === 1) return 'step-circle active';
    if (status === 'pending' && step <= 2) return 'step-circle active';
    if (status === 'approved' && step <= 3) return 'step-circle active';
    if (status === 'rejected') return 'step-circle rejected';
    return 'step-circle';
  }

  showReviewActions(): boolean {
    return (
      (this.currentUserRole === 'supervisor' && this.original?.status === 'in_progress') ||
      (this.currentUserRole === 'UniversityPresident' && this.original?.status === 'pending')
    );
  }
}
