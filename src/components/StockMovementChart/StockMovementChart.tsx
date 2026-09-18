import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { MONTHLY_STOCK_SALES } from '../../data/mockData';
import styles from './StockMovementChart.module.css';

export const StockMovementChart: React.FC = () => {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>('Jun');

  return (
    <section className={styles.chartCard} aria-label="Movimiento de Stock y Ventas">
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Movimiento de Stock & Ventas Mensuales</h2>
          <p className={styles.subtitle}>Comparativa de ingresos de almacén vs ventas directas</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDotStock}></span>
              <span>Entradas de Stock</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDotSales}></span>
              <span>Ventas Totales</span>
            </div>
          </div>

          <button className={styles.settingsBtn} aria-label="Configurar gráfico">
            <Settings size={17} />
          </button>
        </div>
      </header>

      {/* Chart Canvas */}
      <div className={styles.chartContainer}>
        {/* 75% dashed guideline */}
        <div className={styles.guideLine75}>
          <span className={styles.guideLabel}>75%</span>
        </div>

        {/* Floating Tooltip if month has campaign or active hovered */}
        {hoveredMonth === 'Jun' && (
          <div className={styles.campaignTooltip}>
            <div className={styles.tooltipHeader}>
              <span className={styles.tooltipTitle}>Campaña Sep</span>
              <span className={styles.tooltipDotOrange}></span>
            </div>
            <div className={styles.tooltipBody}>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipDotOrange}></span>
                <span>Ventas: <strong>4.850 uds</strong></span>
              </div>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipDotSlate}></span>
                <span>Cambios: <strong>120 uds</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* 12 Month Bars */}
        {MONTHLY_STOCK_SALES.map((item) => {
          const isSelected = hoveredMonth === item.shortMonth;
          const isJun = item.shortMonth === 'Jun';
          const isAgo = item.shortMonth === 'Ago';

          // Heights mapped proportionally (max approx 140px)
          const salesHeight = (item.salesUnits / 100) * 110;
          const stockHeight = (item.stockEntries / 100) * 135;

          return (
            <div
              key={item.shortMonth}
              className={styles.monthColumn}
              onMouseEnter={() => setHoveredMonth(item.shortMonth)}
              onClick={() => setHoveredMonth(item.shortMonth)}
              title={`${item.month}: Ventas ${item.salesUnits}%, Entradas ${item.stockEntries}%`}
            >
              {/* Jun 25% orange badge */}
              {isJun && (
                <span className={styles.badgeJun}>25%</span>
              )}

              {/* Stacked Bars */}
              <div className={styles.barsStack}>
                {/* Stock bar (top hatched) */}
                {stockHeight > 0 && (
                  <div
                    className={styles.barStock}
                    style={{
                      height: `${Math.max(stockHeight - salesHeight, 14)}px`
                    }}
                  />
                )}

                {/* Sales bar (bottom solid) */}
                {salesHeight > 0 && (
                  <div
                    className={styles.barSales}
                    style={{
                      height: `${salesHeight}px`,
                      backgroundColor: isSelected ? '#FD3706' : '#222026'
                    }}
                  />
                )}
              </div>

              {/* Month Label */}
              <span
                className={`${styles.monthLabel} ${
                  isAgo || isJun || isSelected ? styles.monthLabelActive : ''
                }`}
              >
                {item.shortMonth}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
