import React, { useState } from 'react';
import { SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { WEEKLY_REVENUE_DAYS } from '../../data/mockData';
import styles from './KpiCards.module.css';

export const KpiCards: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>('Fri');

  // Find selected day amount for tooltip (dummy value or from data)
  const selectedAmount = WEEKLY_REVENUE_DAYS.find(d => d.day === selectedDay)?.amount.toFixed(1) || '0.0';

  return (
    <section className={styles.kpiGrid} aria-label="Métricas Principales">
      {/* ---------------- CARD 1: Total Orders (Dark #222026) ---------------- */}
      <article className={`${styles.card} ${styles.cardDark}`}>
        <div>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Total Orders</h2>
            <div className={styles.iconSimple} aria-label="Opciones de ventas">
              <SlidersHorizontal size={18} strokeWidth={2} />
            </div>
          </header>

          <div className={styles.statRowDark}>
            <span className={styles.mainMetricDark}>$14.085</span>
            <span className={styles.trendTextNegative}>
              <ArrowUpRight size={16} strokeWidth={2.5} style={{ transform: 'rotate(90deg)' }} /> 10%
            </span>
          </div>

          <p className={styles.statComparisonDark}>$15.650 last month</p>
        </div>

        {/* Sparkline & Dates */}
        <div className={styles.sparklineContainerDark}>
          {/* SVG Glow Curve with Grid */}
          <svg
            className={styles.sparklineSvgDark}
            viewBox="0 0 280 80"
            preserveAspectRatio="none"
          >
            {/* Vertical dashed lines for grid */}
            <line x1="10" y1="10" x2="10" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="55" y1="10" x2="55" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="115" y1="10" x2="115" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="160" y1="10" x2="160" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="215" y1="10" x2="215" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="260" y1="10" x2="260" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            
            {/* Smooth solid white line */}
            <path
              d="M 10 20 Q 40 20, 70 50 T 130 55 T 190 35 T 215 25"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Active Highlight vertical solid line */}
            <line x1="215" y1="25" x2="215" y2="70" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Active Highlight Dot on peak point */}
            <circle cx="215" cy="25" r="3.5" fill="#FFFFFF" />
          </svg>

          {/* Tooltip Pill */}
          <div className={styles.sparklineTooltipWhite}>
            $1210.6
          </div>

          {/* Date Axis */}
          <footer className={styles.sparklineDatesDark}>
            <span>1Feb</span>
            <span>8Feb</span>
            <span>16Feb</span>
            <span>25Feb</span>
            <span>30Feb</span>
          </footer>
        </div>
      </article>

      {/* ---------------- CARD 2: Total Clientes (Vibrant #FD3706) ---------------- */}
      <article className={`${styles.card} ${styles.cardOrange}`}>
        <div>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Total Customers</h2>
            <div className={styles.iconSimple} aria-label="Filtros de clientes">
              <SlidersHorizontal size={18} strokeWidth={2} />
            </div>
          </header>

          <div className={styles.statRowOrange}>
            <span className={styles.mainMetricOrange}>1.222</span>
            <span className={styles.trendText}>
              <ArrowUpRight size={16} strokeWidth={2.5} /> +79%
            </span>
          </div>

          <p className={styles.statComparisonOrange}>683 users last month</p>
        </div>

        {/* Split Pill Progress Bar */}
        <div>
          <div className={styles.splitBarContainerOrange}>
            <div className={styles.splitBarMen}>
              <span>23%</span>
            </div>
            <div className={styles.splitBarWomen}>
              <span>77%</span>
            </div>
          </div>

          {/* Gender Legend */}
          <div className={styles.genderLegendOrange}>
            <div className={styles.legendItemOrange}>
              <span className={styles.legendDotWhite}></span>
              <span>Men</span>
            </div>
            <div className={styles.legendItemOrange}>
              <span className={styles.legendDotDark}></span>
              <span>Women</span>
            </div>
          </div>
        </div>
      </article>

      {/* ---------------- CARD 3: Dot Matrix (Total Revenue) ---------------- */}
      <article className={`${styles.card} ${styles.cardGray}`}>
        <div>
          <header className={styles.cardHeaderDot}>
            <span className={styles.cardTitleDot}>REVENUE</span>
            <div className={styles.dotTabs}>
              <span>DAILY</span>
              <span className={styles.dotTabActive}>WEEKLY</span>
              <span>MONTHLY</span>
            </div>
          </header>

          <div className={styles.statRowDot}>
            <span className={styles.mainMetricDot}>$89 649</span>
            <span className={styles.trendTextDot}>+21%</span>
          </div>

          <hr className={styles.dividerDot} />
        </div>

        {/* Dot Matrix Chart */}
        <div className={styles.revenueChartAreaDot}>
          <div className={styles.gridContainer}>
            {/* Tooltip positioned over the chart */}
            <div className={styles.revenueTooltipDark} style={{
              left: `${WEEKLY_REVENUE_DAYS.findIndex(d => d.day === selectedDay) * (100 / WEEKLY_REVENUE_DAYS.length) + (100 / WEEKLY_REVENUE_DAYS.length) / 2}%`
            }}>
              ${selectedAmount}
            </div>

            <div className={styles.gridColumnsDot}>
              {WEEKLY_REVENUE_DAYS.map((item) => {
                const isSelected = selectedDay === item.day;
                // Max rows is around 12 to make it look dense
                const maxRows = 12;
                // Scale segments to rows
                const filledRows = Math.round(item.segments * 2);

                return (
                  <div
                    key={item.day}
                    className={styles.gridColumnDot}
                    onClick={() => setSelectedDay(item.day)}
                  >
                    {/* Render dots from top to bottom (12 to 1) */}
                    <div className={styles.dotStack}>
                      {Array.from({ length: maxRows }).map((_, index) => {
                        const rowLevel = maxRows - index; 
                        const isFilled = rowLevel <= filledRows;
                        
                        return (
                          <div
                            key={index}
                            className={`${styles.gridDot} 
                              ${isFilled ? (isSelected ? styles.dotFilledDark : styles.dotFilledGray) : ''}`}
                          />
                        );
                      })}
                    </div>
                    <span className={`${styles.dayLabelDot} ${isSelected ? styles.dayLabelDotActive : ''}`}>
                      {item.day.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
};
