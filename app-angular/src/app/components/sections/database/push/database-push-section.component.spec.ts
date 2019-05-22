import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabasePushSectionComponent } from './database-push-section.component';

describe('DatabasePushSectionComponent', () => {
  let component: DatabasePushSectionComponent;
  let fixture: ComponentFixture<DatabasePushSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DatabasePushSectionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabasePushSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
