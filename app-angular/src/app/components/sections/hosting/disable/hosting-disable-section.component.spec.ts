import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HostingDisableSectionComponent } from './hosting-disable-section.component';

describe('HostingDisableSectionComponent', () => {
  let component: HostingDisableSectionComponent;
  let fixture: ComponentFixture<HostingDisableSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HostingDisableSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HostingDisableSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
