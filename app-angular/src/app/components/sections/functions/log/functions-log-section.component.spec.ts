import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FunctionsLogSectionComponent } from './functions-log-section.component';

describe('FunctionsLogSectionComponent', () => {
  let component: FunctionsLogSectionComponent;
  let fixture: ComponentFixture<FunctionsLogSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FunctionsLogSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FunctionsLogSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
