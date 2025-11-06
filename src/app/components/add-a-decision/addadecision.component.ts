import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Sector, User } from 'src/app/model/user';
import { DecisionService } from 'src/app/service/decision.service';
import { AdministrationService } from 'src/app/service/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-addadecision',
  templateUrl: './addadecision.component.html',
  styleUrls: ['./addadecision.component.css']
})
export class AddadecisionComponent implements OnInit {
  showFormModal = false;
  editingId: string | null = null;
  loading = true;

  form: any = {
    title: '',
    sector: '',
    supervisor: '',
    isPresidentDecision: false
  };

  sectors: Sector[] = [];
  reviewers: User[] = [];
  decisions: any[] = [];

  constructor(
    private decisionService: DecisionService,
    private router: Router,
    private userservice: AdministrationService
  ) {}

  ngOnInit(): void {
    this.loadSectors();
    this.loadDecisionTypes();
  }

  /** فتح الفورم */
  openFormModal() {
    this.resetForm();
    this.showFormModal = true;
  }

  /** إغلاق الفورم */
  closeFormModal() {
    this.showFormModal = false;
    this.resetForm();
  }

  /** تحميل القطاعات */
  loadSectors() {
    this.userservice.getAllSectors().subscribe((res: any) => {
      this.sectors = res?.data || [];
    });
  }

  /** عند اختيار قطاع - تحميل المراجعين المرتبطين به */
  onSectorChange(event: any) {
    const sectorId = event.target.value;
    if (sectorId) {
      this.userservice.getusersbyrole(sectorId).subscribe((res: any) => {
        this.reviewers = res || [];
      });
    } else {
      this.reviewers = [];
    }
  }

  /** تحميل جميع أنواع القرارات */
  loadDecisionTypes() {
    this.loading = true;
    this.decisionService.getDecisionTypes().subscribe(
      (res: any) => {
        this.decisions = res || [];
        this.loading = false;
      },
      (err) => {
        console.error(err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'حدث خطأ أثناء تحميل البيانات',
          text: err.message || ''
        });
      }
    );
  }

  /** إضافة أو تعديل نوع القرار */
  saveDecisionType() {
    if (!this.form.title || !this.form.sector) {
      Swal.fire({
        icon: 'warning',
        title: 'من فضلك املأ الحقول المطلوبة',
      });
      return;
    }
  
    this.form.isPresidentDecision = !!this.form.isPresidentDecision;
    this.form.supervisor = this.form.supervisor || null;
  
    if (this.editingId) {
      this.decisionService.updateDecisionType(this.editingId, this.form).subscribe(
        () => {
          Swal.fire({
            icon: 'success',
            title: 'تم تعديل نوع القرار بنجاح ✅',
            timer: 2000,
            showConfirmButton: false,
          });
          this.closeFormModal();
          this.loadDecisionTypes();
        },
        (err) => {
          Swal.fire({
            icon: 'error',
            title: 'حدث خطأ أثناء التعديل',
            text: err.message || '',
          });
        }
      );
    } else {
      this.decisionService.addDecisionType(this.form).subscribe(
        () => {
          Swal.fire({
            icon: 'success',
            title: 'تم إضافة نوع القرار بنجاح ✅',
            timer: 2000,
            showConfirmButton: false,
          });
          this.closeFormModal();
          this.loadDecisionTypes();
        },
        (err) => {
          Swal.fire({
            icon: 'error',
            title: 'حدث خطأ أثناء الإضافة',
            text: err.message || '',
          });
        }
      );
    }
  }
  

  /** فتح الفورم للتعديل */
  editDecisionType(decision: any) {
    this.form = {
      title: decision.title,
      sector: decision.sector?._id || decision.sector, // مهم
      supervisor: decision.supervisor?._id || decision.supervisor,
      isPresidentDecision: decision.isPresidentDecision
    };
    this.editingId = decision._id;
    this.loadReviewers(this.form.sector);
    this.showFormModal = true;
  }
  

  /** حذف قرار */
  deleteDecisionType(id: string) {
    Swal.fire({
      title: 'هل أنت متأكد من الحذف؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.decisionService.deleteDecisionType(id).subscribe(
          () => {
            Swal.fire({
              icon: 'success',
              title: 'تم الحذف ✅',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadDecisionTypes();
          },
          (err) => {
            Swal.fire({
              icon: 'error',
              title: 'حدث خطأ أثناء الحذف',
              text: err.message || '',
            });
          }
        );
      }
    });
  }

  /** إعادة تعيين الفورم */
  resetForm() {
    this.form = {
      title: '',
      sector: '',
      supervisor: '',
      isPresidentDecision: false
    };
    this.editingId = null;
    this.reviewers = [];
  }

  /** تحميل مراجعين عند تعديل قرار */
  loadReviewers(sectorId: string) {
    if (sectorId) {
      this.userservice.getusersbyrole(sectorId).subscribe((res: any) => {
        this.reviewers = res || [];
      });
    }
  }
}
