import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServeSectionComponent } from './serve-section.component';

describe('ServeSectionComponent', () => {
  let component: ServeSectionComponent;
  let fixture: ComponentFixture<ServeSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServeSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServeSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
