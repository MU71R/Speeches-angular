import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Decision } from 'src/app/model/decision';
import { DecisionService } from 'src/app/service/decision.service';
import { LetterService } from 'src/app/service/letter.service';
import Swal from 'sweetalert2';

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

export function contentLengthWithoutSpaces(min: number, max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return min > 0 ? { required: true } : null;
    }

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

export function dateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const date = new Date(control.value);
    if (isNaN(date.getTime())) {
      return { invalidDate: true };
    }

    return null;
  };
}

export function endDateAfterStartValidator(
  startDateControlName: string,
  endDateControlName: string
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const startDate = formGroup.get(startDateControlName)?.value;
    const endDate = formGroup.get(endDateControlName)?.value;

    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      formGroup
        .get(endDateControlName)
        ?.setErrors({ endDateBeforeStart: true });
      return { endDateBeforeStart: true };
    } else {
      formGroup.get(endDateControlName)?.setErrors(null);
      return null;
    }
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
  rationaleWithoutSpacesLength = 0;
  formSubmitted = false;

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
    this.messageForm = this.fb.group(
      {
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
        Rationale: [
          '',
          [Validators.required, contentLengthWithoutSpaces(10, 500)],
        ],
        content: [
          '',
          [Validators.required, contentLengthWithoutSpaces(20, 2000)],
        ],
        startDate: ['', [dateValidator()]],
        endDate: ['', [dateValidator()]],
        date: [
          { value: new Date().toISOString().split('T')[0], disabled: true },
        ],
      },
      {
        validators: endDateAfterStartValidator('startDate', 'endDate'),
      }
    );

    this.updateContentLengthWithoutSpaces();
    this.updateRationaleLengthWithoutSpaces();

    this.messageForm.get('content')?.valueChanges.subscribe(() => {
      this.updateContentLengthWithoutSpaces();
    });

    this.messageForm.get('Rationale')?.valueChanges.subscribe(() => {
      this.updateRationaleLengthWithoutSpaces();
    });
  }

  private loadMessageTypes(): void {
    this.declService.getDecisionTypes().subscribe({
      next: (types: Decision[]) => {
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

  showFieldError(fieldName: string): boolean {
    const field = this.f[fieldName];
    return (
      field.invalid && (field.dirty || field.touched || this.formSubmitted)
    );
  }

  showFormSummary(): boolean {
    return this.messageForm.invalid && this.formSubmitted && !this.submitting;
  }

  markFieldAsTouched(fieldName: string): void {
    this.f[fieldName].markAsTouched();
  }

  preventLeadingSpace(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (input.selectionStart === 0 && event.key === ' ') {
      event.preventDefault();
    }
  }

  updateContentLengthWithoutSpaces(): void {
    const content = this.f['content'].value || '';
    this.contentWithoutSpacesLength = content.replace(/\s/g, '').length;
  }

  updateRationaleLengthWithoutSpaces(): void {
    const rationale = this.f['Rationale'].value || '';
    this.rationaleWithoutSpacesLength = rationale.replace(/\s/g, '').length;
  }

  getContentLengthWithoutSpaces(): number {
    return this.contentWithoutSpacesLength;
  }

  getRationaleLengthWithoutSpaces(): number {
    return this.rationaleWithoutSpacesLength;
  }

  onContentInput(): void {
    this.updateContentLengthWithoutSpaces();
  }

  onRationaleInput(): void {
    this.updateRationaleLengthWithoutSpaces();
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

  private resetForm(): void {
    this.messageForm.reset();
    this.submitting = false;
    this.successMsg = '';
    this.errorMsg = '';
    this.contentWithoutSpacesLength = 0;
    this.rationaleWithoutSpacesLength = 0;
    this.formSubmitted = false;
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.messageForm.invalid) {
      Object.keys(this.f).forEach((key) => {
        this.f[key].markAsTouched();
      });

      this.showWarning('يرجى تصحيح الأخطاء في النموذج قبل الإرسال');
      return;
    }

    this.submitting = true;
    this.successMsg = '';
    this.errorMsg = '';

    const cleanContent = this.f['content'].value
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const cleanRationale = this.f['Rationale'].value
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const payload = {
      title: this.f['title'].value,
      description: cleanContent,
      decision: this.f['type'].value,
      Rationale: cleanRationale,
      date: new Date().toISOString().split('T')[0],
      StartDate: this.f['startDate'].value
        ? new Date(this.f['startDate'].value).toISOString()
        : null,
      EndDate: this.f['endDate'].value
        ? new Date(this.f['endDate'].value).toISOString()
        : null,
    };

    this.letterService.addLetterType(payload).subscribe({
      next: (res) => {
        this.showSuccess('تم حفظ الخطاب بنجاح ');
        this.resetForm();
        Object.keys(this.f).forEach((key) => {
          this.f[key].markAsUntouched();
        });
      },
      error: (err) => {
        console.error('Error saving letter:', err);
        this.showError('حدث خطأ أثناء حفظ الخطاب');
        this.submitting = false;
      },
    });
  }

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
