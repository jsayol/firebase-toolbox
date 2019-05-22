import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseSetSectionComponent } from './database-set-section.component';

describe('DatabaseSetSectionComponent', () => {
  let component: DatabaseSetSectionComponent;
  let fixture: ComponentFixture<DatabaseSetSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseSetSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseSetSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
