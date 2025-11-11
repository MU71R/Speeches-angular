import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { AdministrationService } from './user.service';
import { LetterService } from './letter.service';
import { DecisionService } from './decision.service';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalLetters: number;
  pendingLetters: number;
  approvedLetters: number;
  rejectedLetters: number;
  inProgressLetters: number;
  totalDecisions: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  type: 'letter' | 'decision' | 'user';
  action: string;
  user: string;
  timestamp: Date;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private adminService: AdministrationService,
    private letterService: LetterService,
    private decisionService: DecisionService
  ) {}

  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      users: this.adminService.getStats(),
      letters: this.letterService.getLetterTypes(),
      decisions: this.decisionService.getDecisionTypes(),
    }).pipe(
      map(({ users, letters, decisions }) => {
        console.log('Raw Users Data:', users);
        console.log('Raw Letters Data:', letters);
        console.log('Raw Decisions Data:', decisions);
        const userStats = users.data || users;

        let lettersData = letters;
        if (letters && (letters as any).data) {
          lettersData = (letters as any).data;
        }

        const totalLetters = Array.isArray(lettersData)
          ? lettersData.length
          : 0;

        let pendingLetters = 0;
        let approvedLetters = 0;
        let rejectedLetters = 0;
        let inProgressLetters = 0;

        if (Array.isArray(lettersData)) {
          lettersData.forEach((letter: any) => {
            switch (letter.status) {
              case 'pending':
                pendingLetters++;
                break;
              case 'approved':
                approvedLetters++;
                break;
              case 'rejected':
                rejectedLetters++;
                break;
              case 'in_progress':
                inProgressLetters++;
                break;
            }
          });
        }

        let decisionsData = decisions;
        if (decisions && (decisions as any).data) {
          decisionsData = (decisions as any).data;
        }
        const totalDecisions = Array.isArray(decisionsData)
          ? decisionsData.length
          : 0;

        const stats = {
          totalUsers: userStats?.totalUsers || 0,
          activeUsers: userStats?.activeUsers || 0,
          inactiveUsers: userStats?.inactiveUsers || 0,
          totalLetters: totalLetters,
          pendingLetters: pendingLetters,
          approvedLetters: approvedLetters,
          rejectedLetters: rejectedLetters,
          inProgressLetters: inProgressLetters,
          totalDecisions: totalDecisions,
        };

        console.log('Processed Stats:', stats);
        return stats;
      })
    );
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    return this.letterService.getLetterTypes().pipe(
      map((letters: any) => {
        console.log('Raw Activities Data:', letters);

        let lettersData = letters;
        if (letters && (letters as any).data) {
          lettersData = (letters as any).data;
        }

        if (!Array.isArray(lettersData)) {
          console.log('No letters data found');
          return [];
        }

        const activities = lettersData
          .slice(0, 8)
          .map((letter: any) => {
            let userName = 'مستخدم غير معروف';
            if (letter.user) {
              if (typeof letter.user === 'object') {
                userName =
                  letter.user.fullname || letter.user.username || 'مستخدم';
              } else {
                userName = 'مستخدم';
              }
            }

            return {
              id: letter._id,
              title: letter.title || 'بدون عنوان',
              type: 'letter' as const,
              action: this.getActionByStatus(letter.status),
              user: userName,
              timestamp: new Date(letter.createdAt),
              status: letter.status,
            };
          })
          .sort(
            (a: RecentActivity, b: RecentActivity) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

        console.log('Processed Activities:', activities);
        return activities;
      })
    );
  }

  private getActionByStatus(status: string): string {
    const actions: { [key: string]: string } = {
      pending: 'بانتظار المراجعة',
      approved: 'تمت الموافقة',
      rejected: 'تم الرفض',
      in_progress: 'قيد المعالجة',
    };
    return actions[status] || 'تم الإنشاء';
  }
}
