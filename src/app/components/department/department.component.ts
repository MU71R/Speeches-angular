import { Component, OnInit } from '@angular/core';
import { User, Sector } from '../../model/user';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { AdministrationService } from 'src/app/service/user.service';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.css'],
})
export class DepartmentComponent implements OnInit {
  users: User[] = [];
  sectors: Sector[] = [];
  filteredList: User[] = [];
  loading = false;
  activeTab: 'users' | 'sectors' = 'users';
  searchTerm = '';
  selectedSector = '';
  showAddDepartmentModal = false;
  showEditUserModal = false;
  showSectorForm = false;
  showPassword = false;
  showEditPassword = false;
  showNewPassword = false;
  newDepartment: Partial<User> & { _id?: string } = {
    fullname: '',
    username: '',
    password: '',
    role: 'preparer',
    sector: '',
  };

  selectedUser: Partial<User> & { _id?: string } = {};
  newSector: Sector = { _id: '', sector: '' };
  editPasswordData = {
    newPassword: '',
    confirmPassword: '',
  };

  constructor(private adminService: AdministrationService) {}

  ngOnInit(): void {
    this.loadSectors();
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        const usersArray = Array.isArray(data)
          ? data
          : (data as { data: User[] }).data;
        this.users = (usersArray || [])
          .filter((u) => u.username && u.fullname)
          .map((u) => {
            let sectorId = '';
            let sectorName = '---';
            if (typeof u.sector === 'string') {
              sectorId = u.sector;
              const found = this.sectors.find((s) => s._id === sectorId);
              if (found) sectorName = found.sector;
            } else if (u.sector && typeof u.sector === 'object') {
              const sec = u.sector as Sector;
              sectorId = sec._id || '';
              sectorName = sec.sector || '---';
            }
            return {
              _id: u._id,
              fullname: u.fullname,
              username: u.username,
              role: u.role,
              sector: sectorId,
              sectorName,
              status: u.status,
            };
          });
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) =>
        console.error('خطأ في جلب المستخدمين:', err.message),
      complete: () => (this.loading = false),
    });
  }

  toggleStatus(user: User): void {
    if (!user._id) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.adminService.updateUserStatus(user._id, newStatus).subscribe({
      next: () => (user.status = newStatus),
      error: (err: HttpErrorResponse) =>
        Swal.fire({
          icon: 'error',
          title: 'خطأ في تحديث الحالة',
          text: err.message,
        }),
    });
  }

  openAddDepartment(): void {
    this.newDepartment = {
      fullname: '',
      username: '',
      password: '',
      role: 'preparer',
      sector: '',
    };
    this.showPassword = false;
    this.showAddDepartmentModal = true;
  }

  closeAddDepartment(): void {
    this.showAddDepartmentModal = false;
  }

  openEditUser(user: User): void {
    this.selectedUser = { ...user };
    this.editPasswordData = {
      newPassword: '',
      confirmPassword: '',
    };
    this.showEditPassword = false;
    this.showEditUserModal = true;
  }

  closeEditUser(): void {
    this.selectedUser = {};
    this.showEditUserModal = false;
  }

  togglePassword(field: 'add' | 'edit' | 'new'): void {
    if (field === 'add') {
      this.showPassword = !this.showPassword;
    } else if (field === 'edit') {
      this.showEditPassword = !this.showEditPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    }
  }

  changePassword(): void {
    const { newPassword, confirmPassword } = this.editPasswordData;

    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'جميع الحقول مطلوبة',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'كلمة المرور الجديدة غير متطابقة',
      });
      return;
    }

    if (!this.selectedUser._id) return;

    this.adminService
      .updateUser(this.selectedUser._id, {
        password: newPassword,
      })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'تم تحديث كلمة المرور بنجاح',
            timer: 2000,
            showConfirmButton: false,
          });
          this.editPasswordData = {
            newPassword: '',
            confirmPassword: '',
          };
          this.showEditPassword = false;
        },
        error: (err: HttpErrorResponse) => {
          Swal.fire({
            icon: 'error',
            title: 'خطأ في تحديث كلمة المرور',
            text: err.message || 'حدث خطأ أثناء تحديث كلمة المرور',
          });
        },
      });
  }

  confirmEditUser(): void {
    if (!this.selectedUser._id) return;
    const { fullname, username, role, sector } = this.selectedUser;
    if (!fullname?.trim() || !username?.trim() || !role || !sector) {
      Swal.fire({
        icon: 'warning',
        title: 'املأ جميع الحقول المطلوبة قبل الحفظ',
      });
      return;
    }
    const payload: Partial<User> = {
      fullname: fullname.trim(),
      username: username.trim(),
      role,
      status: this.selectedUser.status,
      sector: typeof sector === 'string' ? sector : (sector as Sector)?._id,
    };
    this.adminService.updateUser(this.selectedUser._id, payload).subscribe({
      next: () => {
        const index = this.users.findIndex(
          (u) => u._id === this.selectedUser._id
        );
        if (index !== -1)
          this.users[index] = { ...this.users[index], ...payload };
        this.applyFilters();
        Swal.fire({
          icon: 'success',
          title: 'تم تعديل المستخدم بنجاح',
          timer: 2000,
          showConfirmButton: false,
        });
        this.closeEditUser();
      },
      error: (err: HttpErrorResponse) =>
        Swal.fire({
          icon: 'error',
          title: 'خطأ أثناء تعديل المستخدم',
          text: err.message,
        }),
    });
  }

  deleteUser(user: User): void {
    if (!user._id) return;
    Swal.fire({
      title: `هل أنت متأكد من حذف المستخدم ${user.fullname}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.adminService.deleteUser(user._id!).subscribe({
        next: () => {
          this.users = this.users.filter((u) => u._id !== user._id);
          this.applyFilters();
          Swal.fire({
            icon: 'success',
            title: 'تم حذف المستخدم',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err: HttpErrorResponse) =>
          Swal.fire({
            icon: 'error',
            title: 'خطأ أثناء الحذف',
            text: err.message,
          }),
      });
    });
  }

  applyFilters(): void {
    this.filteredList = this.users.filter((user) => {
      const matchSector = this.selectedSector
        ? user.sector === this.selectedSector
        : true;
      const matchName = this.searchTerm
        ? user.fullname?.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return matchSector && matchName;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedSector = '';
    this.applyFilters();
  }

  loadSectors(): void {
    this.adminService.getAllSectors().subscribe({
      next: (res) => {
        const sectorsData = (res as any).data || res;
        this.sectors = (sectorsData || [])
          .filter((s: Sector) => s.sector)
          .map((s: Sector) => ({ _id: s._id, sector: s.sector }));
      },
      error: (err: HttpErrorResponse) =>
        Swal.fire({
          icon: 'error',
          title: 'خطأ في جلب القطاعات',
          text: err.message,
        }),
    });
  }

  openSectorForm(): void {
    this.newSector = { _id: '', sector: '' };
    this.showSectorForm = true;
  }

  editSector(sector: Sector): void {
    this.newSector = { ...sector };
    this.showSectorForm = true;
  }

  closeSectorForm(): void {
    this.showSectorForm = false;
    this.newSector = { _id: '', sector: '' };
  }

  saveSector(): void {
    if (!this.newSector.sector?.trim()) {
      Swal.fire({ icon: 'warning', title: 'اسم القطاع مطلوب' });
      return;
    }
    const payload = { sector: this.newSector.sector.trim() };
    if (this.newSector._id) {
      this.adminService.updateSector(this.newSector._id, payload).subscribe({
        next: () => {
          this.closeSectorForm();
          this.loadSectors();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) =>
          Swal.fire({
            icon: 'error',
            title: 'خطأ في تعديل القطاع',
            text: err.message,
          }),
      });
    } else {
      this.adminService.addSector(payload as Sector).subscribe({
        next: () => {
          this.closeSectorForm();
          this.loadSectors();
        },
        error: (err: HttpErrorResponse) =>
          Swal.fire({
            icon: 'error',
            title: 'خطأ أثناء إضافة القطاع',
            text: err.message,
          }),
      });
    }
  }

  deleteSector(id?: string): void {
    if (!id) return;
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع بعد الحذف!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.adminService.deleteSector(id).subscribe({
        next: () => {
          this.loadSectors();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) =>
          Swal.fire({
            icon: 'error',
            title: 'خطأ في الحذف',
            text: err.message,
          }),
      });
    });
  }

  saveDepartment(): void {
    const { fullname, username, password, role, sector } = this.newDepartment;
    if (!fullname?.trim()) {
      Swal.fire({ icon: 'warning', title: 'الاسم الكامل مطلوب' });
      return;
    }
    if (!username?.trim()) {
      Swal.fire({ icon: 'warning', title: 'اسم المستخدم مطلوب' });
      return;
    }
    if (!password) {
      Swal.fire({ icon: 'warning', title: 'كلمة المرور مطلوبة' });
      return;
    }
    if (!role) {
      Swal.fire({ icon: 'warning', title: 'اختر الدور' });
      return;
    }
    if (!sector) {
      Swal.fire({ icon: 'warning', title: 'اختر القطاع' });
      return;
    }

    this.adminService
      .addUser({ ...this.newDepartment, sector } as User)
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'تمت الإضافة بنجاح',
            timer: 2000,
            showConfirmButton: false,
          });
          this.closeAddDepartment();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) =>
          Swal.fire({
            icon: 'error',
            title: 'خطأ أثناء الإضافة',
            text: err.message,
          }),
      });
  }
}
