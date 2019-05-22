import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseUpdateSectionComponent } from './database-update-section.component';

describe('DatabaseUpdateSectionComponent', () => {
  let component: DatabaseUpdateSectionComponent;
  let fixture: ComponentFixture<DatabaseUpdateSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseUpdateSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseUpdateSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
