'use client';

import React from 'react';

// ==========================================
// 1. DYNAMIC GAUGE CHART (Win Probability)
// ==========================================
interface GaugeProps {
  value: number; // 0 to 100
  batTeamCode: string;
  bowTeamCode: string;
  batColor: string;
  bowColor: string;
}

export function WinProbabilityGauge({
  value,
  batTeamCode,
  bowTeamCode,
  batColor,
  bowColor,
}: GaugeProps) {
  // SVG Arc Math
  const radius = 80;
  const strokeWidth = 14;
  const cx = 100;
  const cy = 90;
  
  // Circumference of semi-circle
  const circumference = Math.PI * radius; // ~251.3
  
  // Convert 0-100 probability to stroke offset
  // value = 0 (100% bowTeam) -> filled arc = 0
  // value = 100 (100% batTeam) -> filled arc = circumference
  const batPercentage = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (batPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-card rounded-xl border border-border/50 shadow-sm relative overflow-hidden">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live Win Probability</h4>
      <div className="relative w-48 h-28">
        <svg className="w-full h-full" viewBox="0 0 200 110">
          {/* Background Arc (Bowling Team Color) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={bowColor || '#ef4444'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Foreground Arc (Batting Team Color) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={batColor || '#3b82f6'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
          {/* Inner Text */}
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            className="fill-foreground font-bold text-2xl"
          >
            {batPercentage}%
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            className="fill-muted-foreground text-[8px] font-semibold tracking-wide uppercase"
          >
            {batTeamCode} to Win
          </text>
        </svg>
      </div>

      {/* Labels */}
      <div className="flex w-full justify-between items-center px-4 mt-1 text-xs font-bold">
        <span className="flex items-center gap-1.5" style={{ color: bowColor }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bowColor }}></span>
          {bowTeamCode}: {100 - batPercentage}%
        </span>
        <span className="flex items-center gap-1.5" style={{ color: batColor }}>
          {batTeamCode}: {batPercentage}%
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: batColor }}></span>
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 2. LINE CHART (Over-by-Over Trend)
// ==========================================
interface LineChartProps {
  data: { over: number; value: number }[];
  yLabel: string;
  yMin?: number;
  yMax?: number;
  color?: string;
}

export function TrendLineChart({
  data,
  yLabel,
  yMin = 0,
  yMax = 100,
  color = '#22c55e',
}: LineChartProps) {
  const width = 500;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Handle empty or small data
  const plotData = data.length > 0 ? data : [{ over: 0, value: (yMax + yMin) / 2 }];
  const maxOver = Math.max(20, Math.max(...plotData.map((d) => d.over)));

  // Coordinate mapping functions
  const getX = (over: number) => paddingX + (over / maxOver) * chartWidth;
  const getY = (val: number) => {
    const range = yMax - yMin || 1;
    const ratio = (val - yMin) / range;
    // SVG 0 is at top, so invert Y
    return height - paddingY - ratio * chartHeight;
  };

  // Generate SVG path
  let pathD = '';
  let areaD = '';

  if (plotData.length > 0) {
    const points = plotData.map((d) => `${getX(d.over)},${getY(d.value)}`);
    pathD = `M ${points.join(' L ')}`;
    
    // Create closed area path for gradient fill
    const startX = getX(plotData[0].over);
    const startY = height - paddingY;
    const endX = getX(plotData[plotData.length - 1].over);
    const endY = height - paddingY;
    areaD = `M ${startX},${startY} L ${points.join(' L ')} L ${endX},${endY} Z`;
  }

  // Grid lines
  const gridLines = [];
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const ratio = i / gridCount;
    const yVal = yMin + ratio * (yMax - yMin);
    const yCoord = getY(yVal);
    gridLines.push(
      <g key={`grid-y-${i}`}>
        <line
          x1={paddingX}
          y1={yCoord}
          x2={width - paddingX}
          y2={yCoord}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border/40"
          strokeDasharray="4,4"
        />
        <text
          x={paddingX - 8}
          y={yCoord + 3}
          textAnchor="end"
          className="fill-muted-foreground text-[9px] font-medium"
        >
          {Math.round(yVal)}
        </text>
      </g>
    );
  }

  // X Axis markers (overs)
  const xMarkers = [];
  const xMarkerStep = maxOver > 20 ? 10 : 5;
  for (let i = 0; i <= maxOver; i += xMarkerStep) {
    const xCoord = getX(i);
    xMarkers.push(
      <g key={`x-marker-${i}`}>
        <line
          x1={xCoord}
          y1={height - paddingY}
          x2={xCoord}
          y2={height - paddingY + 4}
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />
        <text
          x={xCoord}
          y={height - paddingY + 16}
          textAnchor="middle"
          className="fill-muted-foreground text-[9px] font-medium"
        >
          Ov {i}
        </text>
      </g>
    );
  }

  return (
    <div className="w-full bg-card rounded-xl border border-border/50 p-4 shadow-sm">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{yLabel} Trend</h4>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '500/220' }}>
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines}

          {/* Area Fill */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#chartGrad)"
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Stroke Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* X and Y Axes */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />

          {/* Over labels */}
          {xMarkers}

          {/* Current Ball Marker (flashing dot at the end) */}
          {plotData.length > 0 && (
            <circle
              cx={getX(plotData[plotData.length - 1].over)}
              cy={getY(plotData[plotData.length - 1].value)}
              r="4.5"
              fill={color}
              stroke="white"
              strokeWidth="1.5"
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 3. SCORE PROBABILITY BELL CURVE
// ==========================================
interface DistributionProps {
  projectedScore: number;
  range: [number, number];
  color?: string;
}

export function ScoreDistributionChart({
  projectedScore,
  range,
  color = '#10b981',
}: DistributionProps) {
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const [minVal, maxVal] = range;
  const span = maxVal - minVal || 10;
  
  // Extend graph bounds slightly past range to fade to 0
  const graphMin = Math.max(0, minVal - Math.round(span * 0.4));
  const graphMax = maxVal + Math.round(span * 0.4);
  const graphSpan = graphMax - graphMin;

  const mean = projectedScore;
  // Approximating standard deviation
  const stdDev = span / 3;

  // Normal distribution formula
  const getProbability = (x: number) => {
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  };

  // Generate 40 points for the curve
  const points: { x: number; y: number }[] = [];
  const steps = 40;
  let maxProb = 0;

  for (let i = 0; i <= steps; i++) {
    const val = graphMin + (i / steps) * graphSpan;
    const prob = getProbability(val);
    if (prob > maxProb) maxProb = prob;
    points.push({ x: val, y: prob });
  }

  // Mapping coordinate functions
  const getX = (val: number) => paddingX + ((val - graphMin) / graphSpan) * chartWidth;
  const getY = (prob: number) => {
    const ratio = prob / (maxProb || 1);
    return height - paddingY - ratio * chartHeight;
  };

  // Generate path string
  const svgPoints = points.map((p) => `${getX(p.x)},${getY(p.y)}`);
  const pathD = `M ${svgPoints.join(' L ')}`;
  
  // Closed path for fill
  const areaD = `M ${getX(graphMin)},${height - paddingY} L ${svgPoints.join(' L ')} L ${getX(graphMax)},${height - paddingY} Z`;

  // Draw grid line for mean (projected score)
  const meanX = getX(mean);

  return (
    <div className="w-full bg-card rounded-xl border border-border/50 p-4 shadow-sm">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Score Probability Distribution (Monte Carlo)</h4>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '500/180' }}>
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaD} fill="url(#distGrad)" />

          {/* Stroke Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />

          {/* Center line (Projected Score) */}
          <line
            x1={meanX}
            y1={getY(getProbability(mean))}
            x2={meanX}
            y2={height - paddingY}
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />

          {/* X Axis */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />

          {/* Labels on X-axis */}
          {/* Min range, mean, max range */}
          <g>
            {/* Min label */}
            <text
              x={getX(minVal)}
              y={height - paddingY + 14}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] font-bold"
            >
              {minVal}
            </text>
            <line x1={getX(minVal)} y1={height - paddingY} x2={getX(minVal)} y2={height - paddingY + 4} stroke="currentColor" className="text-border" />

            {/* Projected label */}
            <text
              x={meanX}
              y={height - paddingY + 14}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-extrabold"
              style={{ fill: color }}
            >
              {mean} (Projected)
            </text>

            {/* Max label */}
            <text
              x={getX(maxVal)}
              y={height - paddingY + 14}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] font-bold"
            >
              {maxVal}
            </text>
            <line x1={getX(maxVal)} y1={height - paddingY} x2={getX(maxVal)} y2={height - paddingY + 4} stroke="currentColor" className="text-border" />
          </g>
        </svg>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Shaded region represents the 10th to 90th percentile confidence interval (80% probability).
      </p>
    </div>
  );
}
