import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirestoreDeleteSectionComponent } from './firestore-delete-section.component';

describe('FirestoreDeleteSectionComponent', () => {
  let component: FirestoreDeleteSectionComponent;
  let fixture: ComponentFixture<FirestoreDeleteSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FirestoreDeleteSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirestoreDeleteSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
