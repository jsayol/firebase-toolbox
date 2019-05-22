import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseRemoveSectionComponent } from './database-remove-section.component';

describe('DatabaseRemoveSectionComponent', () => {
  let component: DatabaseRemoveSectionComponent;
  let fixture: ComponentFixture<DatabaseRemoveSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseRemoveSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseRemoveSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
