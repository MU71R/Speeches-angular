import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddadecisionComponent } from './addadecision.component';

describe('AddadecisionComponent', () => {
  let component: AddadecisionComponent;
  let fixture: ComponentFixture<AddadecisionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddadecisionComponent]
    });
    fixture = TestBed.createComponent(AddadecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
