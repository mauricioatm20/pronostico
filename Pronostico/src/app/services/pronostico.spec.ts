import { TestBed } from '@angular/core/testing';

import { Pronostico } from './pronostico';

describe('Pronostico', () => {
  let service: Pronostico;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pronostico);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
