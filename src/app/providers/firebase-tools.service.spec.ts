import { TestBed } from '@angular/core/testing';

import { FirebaseToolsService } from './firebase-tools.service';

describe('FirebaseToolsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FirebaseToolsService = TestBed.get(FirebaseToolsService);
    expect(service).toBeTruthy();
  });
});
