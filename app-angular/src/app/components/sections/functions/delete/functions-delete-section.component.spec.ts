import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FunctionsDeleteSectionComponent } from './functions-delete-section.component';

describe('FunctionsDeleteSectionComponent', () => {
  let component: FunctionsDeleteSectionComponent;
  let fixture: ComponentFixture<FunctionsDeleteSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FunctionsDeleteSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FunctionsDeleteSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
