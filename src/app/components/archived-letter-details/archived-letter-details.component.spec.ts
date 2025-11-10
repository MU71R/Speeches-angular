import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivedLetterDetailsComponent } from './archived-letter-details.component';

describe('ArchivedLetterDetailsComponent', () => {
  let component: ArchivedLetterDetailsComponent;
  let fixture: ComponentFixture<ArchivedLetterDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ArchivedLetterDetailsComponent]
    });
    fixture = TestBed.createComponent(ArchivedLetterDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
