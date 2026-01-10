import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreaChartModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-net-worth-chart',
  imports: [AreaChartModule, CommonModule],
  templateUrl: './net-worth-chart.html',
  styleUrl: './net-worth-chart.css',
})
export class NetWorthChartComponent implements OnChanges {
  @Input() data: { date: string; value: number }[] = [];

  chartData = signal<any[]>([]);

  // Chart options
  view: [number, number] | undefined = undefined;

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Linear,
    domain: ['#10b981']
  };

  gradient = true;
  showXAxis = true;
  showYAxis = false;
  showLegend = false;
  showXAxisLabel = false;
  showYAxisLabel = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.transformData();
    }
  }

  private transformData() {
    const series = this.data
      .filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value))
      .map(d => ({
        name: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        value: d.value
      }));

    this.chartData.set([{
      name: 'Net Worth',
      series: series
    }]);
  }
}
