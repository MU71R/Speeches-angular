import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Letter } from '../model/Letter';
import { map } from 'rxjs/operators';
import { LetterDetail } from '../model/letter-detail';

@Injectable({
  providedIn: 'root',
})
export class LetterService {
  baseUrl = 'http://localhost:3000/letters';

  constructor(private http: HttpClient) {}

  addLetterType(payload: Letter) {
    return this.http.post<Letter>(`${this.baseUrl}/add-letter`, payload);
  }

  deleteLetterType(id: string) {
    return this.http.delete<Letter>(`${this.baseUrl}/delete-letter/${id}`);
  }

  updateLetter(id: string, payload: Partial<LetterDetail>) {
    return this.http
      .put<{ success: boolean; data: LetterDetail }>(
        `${this.baseUrl}/update-letter/${id}`,
        payload
      )
      .pipe(map((r) => r.data));
  }

  getLetterTypes() {
    return this.http.get<Letter[]>(`${this.baseUrl}/all-letters`);
  }

  getLetter(id: string): Observable<LetterDetail | null> {
    return this.http
      .get<{ success: boolean; data: LetterDetail }>(
        `${this.baseUrl}/get-letter/${id}`
      )
      .pipe(map((res) => res.data));
  }

  // الدوال الجديدة المضافة

  // تحديث حالة الخطاب بواسطة المشرف
  updateStatusBySupervisor(
    id: string,
    status: string
  ): Observable<LetterDetail> {
    return this.http
      .put<{ success: boolean; data: LetterDetail }>(
        `${this.baseUrl}/update-status-supervisor/${id}`,
        { status }
      )
      .pipe(map((r) => r.data));
  }

  // تحديث حالة الخطاب بواسطة رئيس الجامعة
  updateStatusByUniversityPresident(
    id: string,
    status: string,
    approvalType: string
  ): Observable<LetterDetail> {
    return this.http
      .put<{ success: boolean; data: LetterDetail, approvalType: string }>(
        `${this.baseUrl}/update-status-university-president/${id}`,
        { status, approvalType }
      )
      .pipe(map((r) => r.data));
  }

  // الحصول على الخطابات المؤرشفة للمستخدم الحالي
  getUserArchivedLetters(): Observable<LetterDetail[]> {
    return this.http
      .get<{ success: boolean; data: LetterDetail[] }>(
        `${this.baseUrl}/get-user-archived-letters`
      )
      .pipe(map((r) => r.data));
  }

  // الحصول على جميع الخطابات المؤرشفة (ما عدا المستخدم الحالي)
  getAllArchivedLetters(): Observable<LetterDetail[]> {
    return this.http
      .get<{ success: boolean; data: LetterDetail[] }>(
        `${this.baseUrl}/get-all-archived-letters`
      )
      .pipe(map((r) => r.data));
  }

  // الحصول على خطابات المشرف (الحالة in_progress)
  getSupervisorLetters(): Observable<LetterDetail[]> {
    return this.http
      .get<{ success: boolean; data: LetterDetail[] }>(
        `${this.baseUrl}/get-supervisor-letters`
      )
      .pipe(map((r) => r.data));
  }

  // الحصول على خطابات رئيس الجامعة (الحالة pending)
  getUniversityPresidentLetters(): Observable<LetterDetail[]> {
    return this.http
      .get<{ success: boolean; data: LetterDetail[] }>(
        `${this.baseUrl}/get-university-president-letters`
      )
      .pipe(map((r) => r.data));
  }

  // دالة مساعدة للتحقق من الصلاحيات (اختيارية)
  canUpdateStatus(userRole: string, currentStatus: string): boolean {
    const statusPermissions = {
      supervisor: ['in_progress'],
      UniversityPresident: ['pending'],
    };

    return (
      statusPermissions[userRole as keyof typeof statusPermissions]?.includes(
        currentStatus
      ) || false
    );
  }

  // دالة للحصول على حالة الخطاب بالعربية (اختيارية)
  getStatusArabic(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'قيد الانتظار',
      approved: 'مقبول',
      rejected: 'مرفوض',
      in_progress: 'قيد المعالجة',
    };
    return statusMap[status] || status;
  }

  updateLetterStatus(id: string, status: string, notes: string): Observable<LetterDetail> {
    return this.http
      .put<{ success: boolean; data: LetterDetail }>(
        `${this.baseUrl}/update-letter-status/${id}`,
        { status, notes }
      )
      .pipe(map((r) => r.data));
  }

  printLetterByType(id: string, signatureType: string): Observable<LetterDetail> {
    return this.http
      .post<{ success: boolean; data: LetterDetail }>(
        `${this.baseUrl}/print-letter-by-type/${id}`,
        { signatureType }
      )
      .pipe(map((r) => r.data));
  }
}
