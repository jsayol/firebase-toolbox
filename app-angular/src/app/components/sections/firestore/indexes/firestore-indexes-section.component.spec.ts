import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirestoreIndexesSectionComponent } from './firestore-indexes-section.component';

describe('FirestoreIndexesSectionComponent', () => {
  let component: FirestoreIndexesSectionComponent;
  let fixture: ComponentFixture<FirestoreIndexesSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FirestoreIndexesSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirestoreIndexesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
