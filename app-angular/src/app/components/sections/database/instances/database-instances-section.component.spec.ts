import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseInstancesSectionComponent } from './database-instances-section.component';

describe('DatabaseInstancesSectionComponent', () => {
  let component: DatabaseInstancesSectionComponent;
  let fixture: ComponentFixture<DatabaseInstancesSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseInstancesSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseInstancesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
