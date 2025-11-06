import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecisionService } from 'src/app/service/decision.service';
import { LetterService } from 'src/app/service/letter.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.component.html',
  styleUrls: ['./declaration.component.css']
})
export class DeclarationComponent implements OnInit {
  messageForm!: FormGroup;
  messageTypes: { _id: string; title: string }[] = [];
  submitting = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private declService: DecisionService,
    private letterService: LetterService
  ) {}

  ngOnInit(): void {
    // إنشاء FormGroup مع التاريخ التلقائي
    this.messageForm = this.fb.group({
      type: ['', Validators.required],
      title: ['', Validators.required],
      content: ['', Validators.required],
      date: [{ value: new Date().toISOString().split('T')[0], disabled: true }]
    });

    // جلب أنواع الخطابات
    this.declService.getDecisionTypes().subscribe({
      next: (types: any[]) => {
        this.messageTypes = types.map(t => ({
          _id: t._id || '',
          title: t.title || ''
        }));
      },
      error: err => console.error(err)
    });
  }

  get f() {
    return this.messageForm.controls;
  }

  async format(command: string) {
  if (command === 'createLink') {
    const { value: url } = await Swal.fire({
      title: 'أدخل الرابط:',
      input: 'url',
      inputPlaceholder: 'https://example.com',
      confirmButtonText: 'إدراج الرابط',
      cancelButtonText: 'إلغاء',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'يرجى إدخال الرابط أولاً!';
        return null;
      }
    });

    if (url) {
      document.execCommand(command, false, url);
    }
  } else {
    document.execCommand(command, false, '');
  }
}


  onEditorInput(event: Event) {
    const html = (event.target as HTMLElement).innerHTML;
    this.messageForm.get('content')?.setValue(html);
  }

  clear() {
    this.messageForm.get('content')?.setValue('');
    const editor = document.querySelector('.editor-area') as HTMLElement;
    if (editor) editor.innerHTML = '';
  }

  onCancel() {
    this.messageForm.reset();
    this.submitting = false;
    this.clear();
  }
  
onKeyDown(event: KeyboardEvent) {
  const editor = document.querySelector('.editor-area') as HTMLElement;

  if (!editor) return;

  if (event.key === 'Enter') {
    // عمل فاصل سطر مزدوج عند Enter
    document.execCommand('insertHTML', false, '<br><br>');
    event.preventDefault();
  } else if (event.key === ' ') {
    // استبدال الـ space بـ &nbsp; للحفاظ على المسافات
    document.execCommand('insertHTML', false, '&nbsp;');
    event.preventDefault();
  }
}


  onSubmit() {
  if (this.messageForm.invalid) {
    Swal.fire({
      icon: 'warning',
      title: 'املأ جميع الحقول المطلوبة قبل الحفظ',
    });
    return;
  }

  this.submitting = true;

  const payload = {
    title: this.f['title'].value,
    description: this.f['content'].value, // لو الـ API بتستخدم description
    decision: this.f['type'].value,        // لو الـ API بتستخدم decision
    date: new Date().toISOString().split('T')[0]
  };

  this.letterService.addLetterType(payload).subscribe({
    next: res => {
      Swal.fire({
        icon: 'success',
        title: 'تم حفظ الخطاب بنجاح ✅',
        showConfirmButton: false,
        timer: 1500
      });
      this.messageForm.reset();
      this.submitting = false;
      this.clear();
    },
    error: err => {
      Swal.fire({
        icon: 'error',
        title: 'حدث خطأ أثناء حفظ الخطاب ❌',
        showConfirmButton: false,
        timer: 1500
      });
      this.submitting = false;
    }
  });
}
}
