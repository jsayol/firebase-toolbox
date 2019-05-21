import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthImportSectionComponent } from './auth-import-section.component';

describe('AuthImportSectionComponent', () => {
  let component: AuthImportSectionComponent;
  let fixture: ComponentFixture<AuthImportSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthImportSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthImportSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
