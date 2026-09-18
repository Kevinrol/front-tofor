import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CATEGORY_SHARES } from '../../data/mockData';
import styles from './SalesCategoryCard.module.css';

export const SalesCategoryCard: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<'year' | 'weekly' | 'monthly'>('monthly');
  const [highlightedCat, setHighlightedCat] = useState<string | null>(null);

  // Math for Polar Area Chart
  const centerX = 120;
  const centerY = 120;
  const maxRadius = 100;
  const innerRadius = 25;
  const maxPercentage = Math.max(...CATEGORY_SHARES.map(c => c.percentage));

  const getCoords = (angle: number, radius: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad)
    };
  };

  const getSlicePath = (startAngle: number, endAngle: number, radius: number) => {
    const gap = 2; // Degrees gap
    const start = startAngle + gap / 2;
    const end = endAngle - gap / 2;
    if (end <= start) return ""; // safety
    
    const startOuter = getCoords(start, radius);
    const endOuter = getCoords(end, radius);
    const startInner = getCoords(start, innerRadius);
    const endInner = getCoords(end, innerRadius);
    
    const largeArc = end - start <= 180 ? "0" : "1";
    
    return [
      "M", startInner.x, startInner.y,
      "L", startOuter.x, startOuter.y,
      "A", radius, radius, 0, largeArc, 1, endOuter.x, endOuter.y,
      "L", endInner.x, endInner.y,
      "A", innerRadius, innerRadius, 0, largeArc, 0, startInner.x, startInner.y,
      "Z"
    ].join(" ");
  };

  let currentAngle = 0;
  const slices = CATEGORY_SHARES.map(cat => {
    const sliceAngle = (cat.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    // Radius proportional to percentage (using maxRadius for the highest percentage)
    const normalizedRadius = innerRadius + ((cat.percentage / maxPercentage) * (maxRadius - innerRadius));
    
    // Pill position
    const midAngle = startAngle + sliceAngle / 2;
    const labelPos = getCoords(midAngle, normalizedRadius);
    
    // Ensure labels don't get cut off on the right/left
    // Slightly adjust radius for pills to sit half-inside, half-outside
    const pillPos = getCoords(midAngle, normalizedRadius + 4);

    return {
      ...cat,
      startAngle,
      endAngle,
      coloredRadius: normalizedRadius,
      pillPos
    };
  });

  return (
    <article className={styles.card} aria-label="Top categories">
      <div>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>Top categories</h2>
          </div>
          <button className={styles.externalBtn} aria-label="View details">
            <ArrowUpRight size={17} />
          </button>
        </header>

        <div className={styles.polarChartContainer}>
          <svg viewBox="0 0 240 240" className={styles.polarSvg}>
            <defs>
              <pattern id="orangeStripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
                <rect width="6" height="6" fill="#FFFFFF" />
                <path d="M 3,0 l 0,6" stroke="#FD3706" strokeWidth="1.5" />
              </pattern>
              <filter id="shadowPill" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* Render Background Slices First */}
            {slices.map((slice) => (
              <path
                key={`bg-${slice.id}`}
                d={getSlicePath(slice.startAngle, slice.endAngle, maxRadius)}
                fill="#F4F5F7"
                className={styles.bgSlice}
                onMouseEnter={() => setHighlightedCat(slice.id)}
                onMouseLeave={() => setHighlightedCat(null)}
              />
            ))}

            {/* Render Colored Slices */}
            {slices.map((slice) => {
              const isHovered = highlightedCat === slice.id;
              return (
                <path
                  key={`fg-${slice.id}`}
                  d={getSlicePath(slice.startAngle, slice.endAngle, slice.coloredRadius)}
                  fill={slice.color}
                  className={styles.fgSlice}
                  style={{
                    filter: isHovered ? 'brightness(1.1)' : 'none',
                    transformOrigin: '120px 120px',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={() => setHighlightedCat(slice.id)}
                  onMouseLeave={() => setHighlightedCat(null)}
                />
              );
            })}

            {/* Render Percentage Pills on top */}
            {slices.map((slice) => (
              <g 
                key={`pill-${slice.id}`} 
                transform={`translate(${slice.pillPos.x}, ${slice.pillPos.y})`}
                onMouseEnter={() => setHighlightedCat(slice.id)}
                onMouseLeave={() => setHighlightedCat(null)}
              >
                <rect 
                  x="-20" y="-12" 
                  width="40" height="24" 
                  rx="12" 
                  fill="#FFFFFF" 
                  filter="url(#shadowPill)"
                />
                <text 
                  x="0" y="4" 
                  textAnchor="middle" 
                  fontSize="11.5" 
                  fontWeight="700" 
                  fill="#222026"
                  style={{ pointerEvents: 'none' }}
                >
                  {slice.percentage}%
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className={styles.legendWrapper}>
          {CATEGORY_SHARES.map((item) => (
            <div
              key={item.id}
              className={styles.legendItem}
              onMouseEnter={() => setHighlightedCat(item.id)}
              onMouseLeave={() => setHighlightedCat(null)}
            >
              <span
                className={styles.legendDot}
                style={{ 
                  background: item.color,
                  border: item.color.includes('url') ? '1px solid #FD3706' : 'none'
                }}
              />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <footer className={styles.periodTabs}>
        <button className={styles.tabBtn} onClick={() => setActivePeriod('year')}>All time</button>
        <button className={styles.tabBtn} onClick={() => setActivePeriod('weekly')}>Weekly</button>
        <button className={`${styles.tabBtn} ${styles.activeTab}`} onClick={() => setActivePeriod('monthly')}>Monthly</button>
      </footer>
    </article>
  );
};
