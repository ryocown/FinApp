import { TestBed } from '@angular/core/testing';

import { Institute } from './institute';

describe('Institute', () => {
  let service: Institute;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Institute);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
