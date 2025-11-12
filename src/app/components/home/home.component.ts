import { Component, OnInit } from '@angular/core';
import {
  DashboardService,
  DashboardStats,
  RecentActivity,
} from '../../service/home.service';
import { LoginService } from 'src/app/service/login.service';
import { User } from 'src/app/model/user';
import { AuthService } from 'src/app/service/auth.service';
import { Router } from '@angular/router';

interface UserPersonalStats {
  createdLetters: number;
  approvedLetters: number;
  pendingLetters: number;
  rejectedLetters: number;
  createdThisMonth: number;
  pendingReview?: number;
  reviewedThisWeek?: number;
  pendingApproval?: number;
  approvedThisMonth?: number;
  avgResponseTime?: number;
  sectorLetters?: number;
}

interface QuickAction {
  title: string;
  icon: string;
  link: string;
  color: string;
  description: string;
}

interface MiniStat {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  stats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalLetters: 0,
    pendingLetters: 0,
    approvedLetters: 0,
    rejectedLetters: 0,
    inProgressLetters: 0,
    totalDecisions: 0,
  };

  userPersonalStats: UserPersonalStats = {
    createdLetters: 0,
    approvedLetters: 0,
    pendingLetters: 0,
    rejectedLetters: 0,
    createdThisMonth: 0,
    pendingReview: 0,
    reviewedThisWeek: 0,
    pendingApproval: 0,
    approvedThisMonth: 0,
    avgResponseTime: 0,
    sectorLetters: 0,
  };

  recentActivities: RecentActivity[] = [];
  filteredActivities: RecentActivity[] = [];
  loading = true;
  currentDate = new Date();
  currentUser: User | null = null;
  currentUserRole: string = '';
  currentUserSector: string = '';
  quickStats: any[] = [];
  quickActions: QuickAction[] = [];
  miniStats: MiniStat[] = [];

  constructor(
    private dashboardService: DashboardService,
    private loginService: LoginService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserInfo();
    this.loadDashboardData();
  }

  user = this.authService.currentUserValue;

  loadCurrentUserInfo(): void {
    this.currentUser = this.loginService.getUserFromLocalStorage();
    if (this.currentUser) {
      this.currentUserRole = this.currentUser.role || '';
      this.currentUserSector = this.currentUser.sector || '';
    }
  }

  loadDashboardData(): void {
    this.loading = true;

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('Stats loaded successfully:', stats);
        this.stats = stats;
        this.loadUserPersonalStats();
        this.updateQuickStats();
        this.updateQuickActions();
        this.updateMiniStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.useDefaultData();
        this.loading = false;
      },
    });

    this.dashboardService.getRecentActivities().subscribe({
      next: (activities) => {
        console.log('Activities loaded successfully:', activities);
        this.recentActivities = activities;
        this.filteredActivities = this.filterActivitiesByRole(activities);
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.useDefaultActivities();
      },
    });
  }

  loadUserPersonalStats(): void {
    switch (this.currentUserRole) {
      case 'preparer':
        this.userPersonalStats = {
          createdLetters: 15,
          approvedLetters: 10,
          pendingLetters: 3,
          rejectedLetters: 2,
          createdThisMonth: 4,
          sectorLetters: this.getSectorLettersCount(),
        };
        break;

      case 'supervisor':
        this.userPersonalStats = {
          createdLetters: 0,
          approvedLetters: 0,
          pendingLetters: 0,
          rejectedLetters: 0,
          createdThisMonth: 0,
          pendingReview: this.stats.pendingLetters,
          reviewedThisWeek: 8,
          avgResponseTime: 24,
          sectorLetters: this.getSectorLettersCount(),
        };
        break;

      case 'UniversityPresident':
        this.userPersonalStats = {
          createdLetters: 0,
          approvedLetters: 0,
          pendingLetters: 0,
          rejectedLetters: 0,
          createdThisMonth: 0,
          pendingApproval: this.stats.inProgressLetters,
          approvedThisMonth: 12,
          sectorLetters: this.stats.totalLetters,
        };
        break;

      case 'admin':
        this.userPersonalStats = {
          createdLetters: 0,
          approvedLetters: 0,
          pendingLetters: 0,
          rejectedLetters: 0,
          createdThisMonth: 0,
          sectorLetters: 0,
        };
        break;

      default:
        this.userPersonalStats = {
          createdLetters: 0,
          approvedLetters: 0,
          pendingLetters: 0,
          rejectedLetters: 0,
          createdThisMonth: 0,
          sectorLetters: 0,
        };
    }
  }

  getSectorLettersCount(): number {
    const sectorMultipliers: { [key: string]: number } = {
      'الإدارة العامة للشئون القانونية': 8,
      'مكتب المدير التنفيذي للمستشفيات الجامعية': 6,
      'إدارة الوحدات ذات الطابع الخاص': 4,
      default: 5,
    };

    return (
      sectorMultipliers[this.currentUserSector] || sectorMultipliers['default']
    );
  }

  filterActivitiesByRole(activities: RecentActivity[]): RecentActivity[] {
    if (this.currentUserRole === 'admin') {
      return activities; 
    }

    return activities.filter((activity) => {
      if (this.currentUserRole === 'preparer') {
        return activity.user === this.currentUser?.fullname;
      }
      return true;
    });
  }

  updateQuickStats(): void {
    this.quickStats = [
      {
        title: 'نسبة النشاط',
        value: this.calculateActivityRate() + '%',
        icon: 'fas fa-chart-line',
        color: 'primary',
        description: this.getQuickStatDescription('activity'),
      },
      {
        title: 'معدل القبول',
        value: this.calculateApprovalRate() + '%',
        icon: 'fas fa-check-circle',
        color: 'success',
        description: this.getQuickStatDescription('approval'),
      },
      {
        title: 'الكفاءة',
        value: this.calculateEfficiency() + '%',
        icon: 'fas fa-bolt',
        color: 'warning',
        description: this.getQuickStatDescription('efficiency'),
      },
      {
        title: this.getGrowthTitle(),
        value: this.getGrowthValue(),
        icon: 'fas fa-seedling',
        color: 'info',
        description: this.getQuickStatDescription('growth'),
      },
    ];
  }

  getQuickStatDescription(type: string): string {
    const descriptions: { [key: string]: { [key: string]: string } } = {
      activity: {
        preparer: 'نشاطك في النظام',
        supervisor: 'نشاط المراجعة',
        UniversityPresident: 'نشاط الاعتماد',
        admin: 'نشاط النظام العام',
        default: 'مستوى النشاط',
      },
      approval: {
        preparer: 'نسبة قبول خطاباتك',
        supervisor: 'نسبة القبول بعد المراجعة',
        UniversityPresident: 'نسبة الاعتماد النهائي',
        admin: 'معدل القبول العام',
        default: 'الخطابات المقبولة',
      },
      efficiency: {
        preparer: 'كفاءة إنجازك',
        supervisor: 'كفاءة المراجعة',
        UniversityPresident: 'كفاءة الاعتماد',
        admin: 'كفاءة النظام',
        default: 'أداء النظام',
      },
      growth: {
        preparer: 'نمو إنتاجيتك',
        supervisor: 'نمو المراجعات',
        UniversityPresident: 'نمو الاعتمادات',
        admin: 'نمو النظام',
        default: 'هذا الشهر',
      },
    };

    return (
      descriptions[type]?.[this.currentUserRole] ||
      descriptions[type]?.['default'] ||
      ''
    );
  }

  getGrowthTitle(): string {
    const titles: { [key: string]: string } = {
      preparer: 'النمو',
      supervisor: 'المراجعات',
      UniversityPresident: 'الاعتمادات',
      admin: 'التوسع',
    };
    return titles[this.currentUserRole] || 'النمو';
  }

  getGrowthValue(): string {
    const values: { [key: string]: string } = {
      preparer: `+${this.userPersonalStats.createdThisMonth}`,
      supervisor: `+${this.userPersonalStats.reviewedThisWeek}`,
      UniversityPresident: `+${this.userPersonalStats.approvedThisMonth}`,
      admin: '+12%',
    };
    return values[this.currentUserRole] || '+8%';
  }

  updateQuickActions(): void {
    const baseActions = [
      {
        title: 'عرض الأرشيف',
        icon: 'fas fa-archive',
        link: '/archive',
        color: 'secondary',
        description: 'الوصول إلى الخطابات المؤرشفة',
      },
      {
        title: 'البحث المتقدم',
        icon: 'fas fa-search',
        link: '/search',
        color: 'info',
        description: 'بحث في الخطابات والقرارات',
      },
    ];

    const roleActions: { [key: string]: QuickAction[] } = {
      preparer: [
        {
          title: 'إنشاء خطاب',
          icon: 'fas fa-plus',
          link: '/letters/add',
          color: 'primary',
          description: 'بدء إنشاء خطاب جديد',
        },
        {
          title: 'خطاباتي',
          icon: 'fas fa-list',
          link: '/letters/my-letters',
          color: 'success',
          description: 'عرض جميع خطاباتك',
        },
      ],
      supervisor: [
        {
          title: 'المراجعة',
          icon: 'fas fa-clipboard-check',
          link: '/letters/supervisor',
          color: 'warning',
          description: 'مراجعة الخطابات المعلقة',
        },
        {
          title: 'تقارير المراجعة',
          icon: 'fas fa-chart-bar',
          link: '/reports/review',
          color: 'info',
          description: 'تقارير أداء المراجعة',
        },
      ],
      UniversityPresident: [
        {
          title: 'الاعتماد',
          icon: 'fas fa-stamp',
          link: '/letters/president',
          color: 'success',
          description: 'اعتماد الخطابات النهائية',
        },
        {
          title: 'التقارير',
          icon: 'fas fa-file-alt',
          link: '/reports/approval',
          color: 'primary',
          description: 'تقارير الاعتماد الشاملة',
        },
      ],
      admin: [
        {
          title: 'إدارة المستخدمين',
          icon: 'fas fa-users-cog',
          link: '/admin/users',
          color: 'danger',
          description: 'إدارة مستخدمي النظام',
        },
        {
          title: 'إعدادات النظام',
          icon: 'fas fa-cogs',
          link: '/admin/settings',
          color: 'dark',
          description: 'ضبط إعدادات النظام',
        },
      ],
    };

    this.quickActions = [
      ...(roleActions[this.currentUserRole] || []),
      ...baseActions,
    ];
  }

  updateMiniStats(): void {
    this.miniStats = [
      {
        label: this.getMiniStatLabel('users'),
        value: this.getMiniStatValue('users'),
        icon: 'fas fa-user-check',
        color: 'success',
        trend: '+5%',
      },
      {
        label: this.getMiniStatLabel('letters'),
        value: this.getMiniStatValue('letters'),
        icon: 'fas fa-envelope-open',
        color: 'primary',
        trend: '+12%',
      },
      {
        label: this.getMiniStatLabel('approval'),
        value: this.calculateApprovalRate() + '%',
        icon: 'fas fa-chart-line',
        color: 'info',
        trend: '+3%',
      },
      {
        label: this.getMiniStatLabel('efficiency'),
        value: this.calculateEfficiency() + '%',
        icon: 'fas fa-bolt',
        color: 'warning',
        trend: '+8%',
      },
    ];
  }

  getMiniStatLabel(type: string): string {
    const labels: { [key: string]: { [key: string]: string } } = {
      users: {
        preparer: 'خطاباتي',
        supervisor: 'قيد المراجعة',
        UniversityPresident: 'قيد الاعتماد',
        admin: 'المستخدمين النشطين',
      },
      letters: {
        preparer: 'هذا الشهر',
        supervisor: 'هذا الأسبوع',
        UniversityPresident: 'هذا الشهر',
        admin: 'خطابات الشهر',
      },
      approval: {
        preparer: 'معدل القبول',
        supervisor: 'معدل المراجعة',
        UniversityPresident: 'معدل الاعتماد',
        admin: 'معدل القبول',
      },
      efficiency: {
        preparer: 'كفاءتي',
        supervisor: 'كفاءة المراجعة',
        UniversityPresident: 'كفاءة الاعتماد',
        admin: 'كفاءة النظام',
      },
    };

    return (
      labels[type]?.[this.currentUserRole] || labels[type]?.['admin'] || ''
    );
  }

  getMiniStatValue(type: string): string {
    const values: { [key: string]: { [key: string]: number | string } } = {
      users: {
        preparer: this.userPersonalStats.createdLetters,
        supervisor: this.userPersonalStats.pendingReview || 0,
        UniversityPresident: this.userPersonalStats.pendingApproval || 0,
        admin: this.stats.activeUsers,
      },
      letters: {
        preparer: this.userPersonalStats.createdThisMonth,
        supervisor: this.userPersonalStats.reviewedThisWeek || 0,
        UniversityPresident: this.userPersonalStats.approvedThisMonth || 0,
        admin: this.stats.totalLetters,
      },
    };

    return values[type]?.[this.currentUserRole]?.toString() || '0';
  }

  getWelcomeMessage(): string {
    const messages: { [key: string]: string } = {
      preparer: `مرحباً ${this.currentUser?.fullname}`,
      supervisor: `أهلاً بك ${this.currentUser?.fullname}`,
      UniversityPresident: `سعادة ${this.currentUser?.fullname}`,
      admin: `مدير النظام ${this.currentUser?.fullname}`,
    };
    return messages[this.currentUserRole] || 'مرحباً بك';
  }

  getRoleDisplayName(): string {
    const roles: { [key: string]: string } = {
      preparer: 'منشئ الخطابات',
      supervisor: 'مراجع',
      UniversityPresident: 'رئيس الجامعة',
      admin: 'مدير النظام',
    };
    return roles[this.currentUserRole] || 'مستخدم';
  }

  getStatsTitle(): string {
    const titles: { [key: string]: string } = {
      preparer: 'إحصائيات أدائك',
      supervisor: 'إحصائيات المراجعة',
      UniversityPresident: 'نظرة عامة على الاعتمادات',
      admin: 'إحصائيات النظام',
    };
    return titles[this.currentUserRole] || 'الإحصائيات';
  }

  getPerformanceText(): string {
    const efficiency = this.calculateEfficiency();
    if (efficiency >= 80) return 'أداء ممتاز';
    if (efficiency >= 60) return 'أداء جيد';
    if (efficiency >= 40) return 'أداء متوسط';
    return 'يحتاج تحسين';
  }

  calculateActivityRate(): number {
    if (this.stats.totalUsers === 0) return 0;
    return Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100);
  }

  calculateApprovalRate(): number {
    if (this.stats.totalLetters === 0) return 0;
    return Math.round(
      (this.stats.approvedLetters / this.stats.totalLetters) * 100
    );
  }

  calculateEfficiency(): number {
    if (this.stats.totalLetters === 0) return 0;
    const processed = this.stats.totalLetters - this.stats.pendingLetters;
    return Math.round((processed / this.stats.totalLetters) * 100);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      in_progress: 'info',
    };
    return colors[status] || 'secondary';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      pending: 'قيد الانتظار',
      approved: 'مقبول',
      rejected: 'مرفوض',
      in_progress: 'قيد المعالجة',
    };
    return texts[status] || status;
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      letter: 'fas fa-envelope',
      decision: 'fas fa-file-contract',
      user: 'fas fa-user',
    };
    return icons[type] || 'fas fa-circle';
  }

  useDefaultData(): void {
    this.stats = {
      totalUsers: 5,
      activeUsers: 5,
      inactiveUsers: 0,
      totalLetters: 35,
      pendingLetters: 8,
      approvedLetters: 20,
      rejectedLetters: 5,
      inProgressLetters: 2,
      totalDecisions: 6,
    };
    this.loadUserPersonalStats();
    this.updateQuickStats();
    this.updateQuickActions();
    this.updateMiniStats();
  }

  useDefaultActivities(): void {
    this.recentActivities = [
      {
        id: '690f7d118928be33f22f866b',
        title: 'خطاب اعتماد ميزانية',
        type: 'letter',
        action: 'تمت الموافقة',
        user: 'إدارة الوحدات ذات الطابع الخاص',
        timestamp: new Date('2025-11-08T17:25:37.916Z'),
        status: 'approved',
      },
      {
        id: '690f65e02f6a7eb2f2124e6b',
        title: 'طلب توفير موارد',
        type: 'letter',
        action: 'قيد المعالجة',
        user: 'مكتب المدير التنفيذي للمستشفيات الجامعية',
        timestamp: new Date('2025-11-08T15:46:40.900Z'),
        status: 'in_progress',
      },
    ];
    this.filteredActivities = this.filterActivitiesByRole(
      this.recentActivities
    );
  }
}
