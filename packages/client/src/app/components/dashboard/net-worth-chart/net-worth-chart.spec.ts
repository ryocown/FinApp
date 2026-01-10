import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetWorthChart } from './net-worth-chart';

describe('NetWorthChart', () => {
  let component: NetWorthChart;
  let fixture: ComponentFixture<NetWorthChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetWorthChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetWorthChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
