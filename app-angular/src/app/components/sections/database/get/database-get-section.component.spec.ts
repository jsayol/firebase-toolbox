import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseGetSectionComponent } from './database-get-section.component';

describe('DatabaseGetSectionComponent', () => {
  let component: DatabaseGetSectionComponent;
  let fixture: ComponentFixture<DatabaseGetSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseGetSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseGetSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
