import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseProfileSectionComponent } from './database-profile-section.component';

describe('DatabaseProfileSectionComponent', () => {
  let component: DatabaseProfileSectionComponent;
  let fixture: ComponentFixture<DatabaseProfileSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseProfileSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseProfileSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
