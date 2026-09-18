import React, { useState } from 'react';
import { ArrowUpRight, Upload } from 'lucide-react';
import { SCHOOL_STAGES } from '../../data/mockData';
import styles from './EducationStageCard.module.css';

export const EducationStageCard: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<'historico' | 'colegios' | 'familias'>('historico');

  const handleExport = () => {
    alert('Generando Reporte de Stock y Ventas en PDF y Excel...');
  };

  return (
    <article className={styles.card} aria-label="Ventas por Etapa Escolar">
      <div>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>Ventas por Etapa Escolar</h2>
            <p className={styles.subtitle}>Demanda por segmento educativo</p>
          </div>
          <button className={styles.externalBtn} aria-label="Ver más detalles de etapas">
            <ArrowUpRight size={17} />
          </button>
        </header>

        {/* Vertical Bars Chart */}
        <div className={styles.chartContainer}>
          {SCHOOL_STAGES.map((item) => {
            // max height mapping: 38% -> 110px
            const barHeight = (item.percentage / 40) * 110;

            return (
              <div
                key={item.id}
                className={styles.stageColumn}
                title={`${item.stage}: ${item.percentage}% de demanda`}
              >
                <span className={styles.percentLabel}>{item.percentage}%</span>
                <div className={styles.barWrapper}>
                  <div
                    className={styles.verticalBar}
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className={styles.stageLabel}>{item.stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segment Category Tabs */}
      <div className={styles.segmentTabs}>
        <button
          className={`${styles.segmentBtn} ${activeSegment === 'historico' ? styles.activeSegment : ''}`}
          onClick={() => setActiveSegment('historico')}
        >
          Histórico
        </button>
        <button
          className={`${styles.segmentBtn} ${activeSegment === 'colegios' ? styles.activeSegment : ''}`}
          onClick={() => setActiveSegment('colegios')}
        >
          Colegios
        </button>
        <button
          className={`${styles.segmentBtn} ${activeSegment === 'familias' ? styles.activeSegment : ''}`}
          onClick={() => setActiveSegment('familias')}
        >
          Familias
        </button>
      </div>

      {/* Action CTA Button */}
      <button
        className={styles.exportBtn}
        onClick={handleExport}
        title="Exportar archivo consolidado"
      >
        <Upload size={16} className={styles.exportIcon} />
        <span>Exportar Reporte de Stock y Ventas (PDF / Excel)</span>
      </button>
    </article>
  );
};
