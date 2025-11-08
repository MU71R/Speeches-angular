import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { DecisionService } from 'src/app/service/decision.service';
import { LetterService } from 'src/app/service/letter.service';
import Swal from 'sweetalert2';

// Custom Validator لمنع المسافات في البداية فقط
export function noLeadingSpaces(
  control: AbstractControl
): ValidationErrors | null {
  if (!control.value) return null;

  const value = control.value.toString();

  if (value.startsWith(' ')) {
    return { startsWithSpace: true };
  }

  return null;
}

// Custom Validator لحساب الطول بدون مسافات
export function contentLengthWithoutSpaces(min: number, max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return min > 0 ? { required: true } : null;
    }

    // حساب الطول بدون المسافات
    const contentWithoutSpaces = control.value.replace(/\s/g, '');
    const length = contentWithoutSpaces.length;

    if (min && length < min) {
      return {
        minlength: {
          requiredLength: min,
          actualLength: length,
        },
      };
    }

    if (max && length > max) {
      return {
        maxlength: {
          requiredLength: max,
          actualLength: length,
        },
      };
    }

    return null;
  };
}

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.component.html',
  styleUrls: ['./declaration.component.css'],
})
export class DeclarationComponent implements OnInit {
  messageForm!: FormGroup;
  messageTypes: { _id: string; title: string }[] = [];
  submitting = false;
  successMsg = '';
  errorMsg = '';
  contentWithoutSpacesLength = 0;
  formSubmitted = false; // متغير لتتبع ما إذا تم محاولة إرسال النموذج

  constructor(
    private fb: FormBuilder,
    private declService: DecisionService,
    private letterService: LetterService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadMessageTypes();
  }

  private initializeForm(): void {
    this.messageForm = this.fb.group({
      type: ['', [Validators.required]],
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(100),
          noLeadingSpaces,
        ],
      ],
      content: [
        '',
        [Validators.required, contentLengthWithoutSpaces(20, 2000)],
      ],
      date: [{ value: new Date().toISOString().split('T')[0], disabled: true }],
    });

    // حساب الطول الأولي بدون مسافات
    this.updateContentLengthWithoutSpaces();

    // تحديث العداد عند تغيير المحتوى
    this.messageForm.get('content')?.valueChanges.subscribe(() => {
      this.updateContentLengthWithoutSpaces();
    });
  }

  private loadMessageTypes(): void {
    this.declService.getDecisionTypes().subscribe({
      next: (types: any[]) => {
        this.messageTypes = types.map((t) => ({
          _id: t._id || '',
          title: t.title || '',
        }));
      },
      error: (err) => {
        console.error('Error loading message types:', err);
        this.showError('حدث خطأ في تحميل أنواع الخطابات');
      },
    });
  }

  get f() {
    return this.messageForm.controls;
  }

  // دالة لعرض خطأ الحقل (تظهر الأخطاء فقط للحقول التي تم التفاعل معها أو بعد الإرسال)
  showFieldError(fieldName: string): boolean {
    const field = this.f[fieldName];
    return (
      field.invalid && (field.dirty || field.touched || this.formSubmitted)
    );
  }

  // دالة لعرض ملخص النموذج (تظهر فقط بعد محاولة الإرسال)
  showFormSummary(): boolean {
    return this.messageForm.invalid && this.formSubmitted && !this.submitting;
  }

  // دالة لتحديد الحقل كـ touched عند الخروج منه
  markFieldAsTouched(fieldName: string): void {
    this.f[fieldName].markAsTouched();
  }

  // منع المسافات في بداية العنوان
  preventLeadingSpace(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    // إذا كان المؤشر في البداية والمفتاض مضغوط هو space
    if (input.selectionStart === 0 && event.key === ' ') {
      event.preventDefault();
    }
  }

  // تحديث طول المحتوى بدون مسافات
  updateContentLengthWithoutSpaces(): void {
    const content = this.f['content'].value || '';
    this.contentWithoutSpacesLength = content.replace(/\s/g, '').length;
  }

  // الحصول على طول المحتوى بدون مسافات للعرض
  getContentLengthWithoutSpaces(): number {
    return this.contentWithoutSpacesLength;
  }

  // عند الكتابة في نص الخطاب
  onContentInput(): void {
    this.updateContentLengthWithoutSpaces();
  }

  onCancel() {
    if (this.messageForm.dirty) {
      Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'سيتم فقدان جميع البيانات التي أدخلتها',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'نعم، إلغاء',
        cancelButtonText: 'لا، ابقى هنا',
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetForm();
        }
      });
    } else {
      this.resetForm();
    }
  }

  // دالة لإعادة تعيين النموذج
  private resetForm(): void {
    this.messageForm.reset();
    this.submitting = false;
    this.successMsg = '';
    this.errorMsg = '';
    this.contentWithoutSpacesLength = 0;
    this.formSubmitted = false;
  }

  onSubmit() {
    // وضع علامة أن النموذج تم محاولة إرساله
    this.formSubmitted = true;

    // التحقق من صحة النموذج
    if (this.messageForm.invalid) {
      // وضع علامة touched لجميع الحقول لعرض الأخطاء
      Object.keys(this.f).forEach((key) => {
        this.f[key].markAsTouched();
      });

      this.showWarning('يرجى تصحيح الأخطاء في النموذج قبل الإرسال');
      return;
    }

    this.submitting = true;
    this.successMsg = '';
    this.errorMsg = '';

    // تنظيف النص من أي تنسيقات HTML محتملة
    const cleanContent = this.f['content'].value
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const payload = {
      title: this.f['title'].value,
      description: cleanContent,
      decision: this.f['type'].value,
      date: new Date().toISOString().split('T')[0],
    };

    this.letterService.addLetterType(payload).subscribe({
      next: (res) => {
        this.showSuccess('تم حفظ الخطاب بنجاح ✅');
        this.resetForm();

        // Reset form state
        Object.keys(this.f).forEach((key) => {
          this.f[key].markAsUntouched();
        });
      },
      error: (err) => {
        console.error('Error saving letter:', err);
        this.showError('حدث خطأ أثناء حفظ الخطاب ❌');
        this.submitting = false;
      },
    });
  }

  // Helper methods for showing alerts
  private showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 1500,
    });
  }

  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 1500,
    });
  }

  private showWarning(message: string): void {
    Swal.fire({
      icon: 'warning',
      title: message,
      showConfirmButton: false,
      timer: 2000,
    });
  }
}
