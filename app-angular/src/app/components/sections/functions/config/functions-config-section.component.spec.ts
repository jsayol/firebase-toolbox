import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FunctionsConfigSectionComponent } from './functions-config-section.component';

describe('FunctionsConfigSectionComponent', () => {
  let component: FunctionsConfigSectionComponent;
  let fixture: ComponentFixture<FunctionsConfigSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FunctionsConfigSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FunctionsConfigSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
