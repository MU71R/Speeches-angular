import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export interface User {
  _id: string;
  username: string;
  fullname: string;
  role: string;
  sector?: string;
  status: string;
  createdAt: string;
}

interface DecodedToken {
  userId: string;
  name: string;
  role: string;
  sector: string;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private router: Router) {
    const savedUser = localStorage.getItem('userData');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(token: string, userData: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    this.currentUserSubject.next(userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getDecodedToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const user = this.currentUserValue;

    if (!token || !user) {
      return false;
    }

    const decodedToken = this.getDecodedToken();
    if (!decodedToken) {
      return false;
    }

    const currentTime = Date.now() / 1000;
    if (decodedToken.exp < currentTime) {
      this.logout();
      return false;
    }

    return true;
  }

  getUserRole(): string | null {
    return this.currentUserValue?.role || null;
  }

  hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.currentUserValue?.role || '');
  }

  // ✅ التحديث المهم: الأدمن لا يعتبر مشرف أو رئيس جامعة في النظام الحالي
  isSupervisor(): boolean {
    return this.hasRole('supervisor'); // الأدمن لا يعتبر مشرف
  }

  isUniversityPresident(): boolean {
    return this.hasRole('UniversityPresident'); // الأدمن لا يعتبر رئيس جامعة
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isUser(): boolean {
    return this.hasRole('user');
  }

  getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  getCurrentUserId(): string | null {
    return this.currentUserValue?._id || null;
  }

  canEditLetter(letterUserId: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    // الأدمن يمكنه التعديل دائماً
    if (this.isAdmin()) return true;

    // صاحب الخطاب يمكنه التعديل
    return user._id === letterUserId;
  }

  // ✅ تحديث دوال الصلاحيات لتتناسب مع الـ Backend
  canUpdateStatusBySupervisor(): boolean {
    return this.isSupervisor(); // فقط المشرف
  }

  canUpdateStatusByPresident(): boolean {
    return this.isUniversityPresident(); // فقط رئيس الجامعة
  }

  canReviewLetter(letterStatus: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    switch (letterStatus) {
      case 'pending':
        return this.isSupervisor(); // فقط المشرف
      case 'in_progress':
        return this.isUniversityPresident(); // فقط رئيس الجامعة
      default:
        return false;
    }
  }

  canViewAllLetters(): boolean {
    return (
      this.isAdmin() || this.isUniversityPresident() || this.isSupervisor()
    );
  }

  canCreateLetter(): boolean {
    const user = this.currentUserValue;
    return !!user && (this.isAdmin() || this.isUser());
  }

  canDeleteLetter(letterUserId: string): boolean {
    return this.isAdmin() || this.canEditLetter(letterUserId);
  }

  updateUser(user: User): void {
    localStorage.setItem('userData', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isTokenValid(): boolean {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) return false;

    const currentTime = Date.now() / 1000;
    return decodedToken.exp > currentTime;
  }

  hasSectorAccess(letterSectorId: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    if (this.isAdmin()) return true;
    if (!user.sector) return true;

    return user.sector === letterSectorId;
  }

  isLetterOwner(letterUserId: string): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId === letterUserId;
  }
}
