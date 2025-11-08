import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { addLetter } from 'src/app/model/Letter';
import { LetterService } from 'src/app/service/letter.service';
import { Router } from '@angular/router';
import { LetterDetail } from 'src/app/model/letter-detail';
import { LoginService } from 'src/app/service/login.service';

@Component({
  selector: 'app-pending-reviews',
  templateUrl: './pending-reviews.component.html',
  styleUrls: ['./pending-reviews.component.css'],
})
export class PendingReviewsComponent implements OnInit {
  pendingList: addLetter[] = [];
  selectedLetter: addLetter | null = null;
  safeDescription: SafeHtml | null = null;

  constructor(
    private letterService: LetterService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.loginService.getUserFromLocalStorage();
    if (user?.role === 'UniversityPresident') {
      this.getUniversityPresidentLetters();
    } else {
      this.getPendingLetters();
    }
  }

  getUniversityPresidentLetters() {
    this.letterService.getUniversityPresidentLetters().subscribe({
      next: (res: any) => {
        this.pendingList = res.data ? res.data : res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('❌ API Error:', err),
    });
  }

  getPendingLetters() {
    this.letterService.getLetterTypes().subscribe({
      next: (res: any) => {
        this.pendingList = res.data ? res.data : res;
        console.log('📥 Letters Loaded:', this.pendingList);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('❌ API Error:', err),
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'in_progress':
        return 'تحت المراجعة';
      case 'pending':
        return 'معلق';
      case 'approved':
        return 'تمت الموافقة';
      case 'rejected':
        return 'مرفوض';
      default:
        return 'غير معروف';
    }
  }

  review(item: addLetter) {
    this.selectedLetter = item;
    this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(
      item.description || ''
    );
  }

  closeModal() {
    this.selectedLetter = null;
    this.safeDescription = null;
  }

  open(id: string) {
    this.router.navigate(['letter-details', id]);
  }

  viewAll() {
    console.log('عرض الكل');
  }
}
