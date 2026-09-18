import React, { useState } from 'react';
import { Tablet, Maximize2, Palette } from 'lucide-react';
import styles from './TabletMockup.module.css';

interface TabletMockupProps {
  children: React.ReactNode;
}

export const TabletMockup: React.FC<TabletMockupProps> = ({ children }) => {
  const [viewMode, setViewMode] = useState<'mockup' | 'fullscreen'>('mockup');

  return (
    <div className={styles.viewportContainer}>
      {/* Floating Mode & Palette Controls Bar */}
      <div className={styles.controlBar}>
        <div className={styles.leftControls}>
          <div className={styles.brandPill} title="Paleta oficial activa">
            <Palette size={14} color="#FD3706" />
            <div className={styles.paletteDots}>
              <span className={styles.paletteDot} style={{ backgroundColor: '#FD3706' }} title="#FD3706 (Primario)" />
              <span className={styles.paletteDot} style={{ backgroundColor: '#DBDBDB' }} title="#DBDBDB (Borde)" />
              <span className={styles.paletteDot} style={{ backgroundColor: '#222026' }} title="#222026 (Oscuro)" />
              <span className={styles.paletteDot} style={{ backgroundColor: '#FFFFFF' }} title="#FFFFFF (Blanco)" />
            </div>
            <span className={styles.brandLabel}>EduStock Design System</span>
          </div>
        </div>

        {/* View Mode Toggle: Mockup Frame vs Fullscreen */}
        <div className={styles.viewModeToggle}>
          <button
            className={`${styles.toggleBtn} ${
              viewMode === 'mockup' ? styles.toggleBtnActive : ''
            }`}
            onClick={() => setViewMode('mockup')}
            title="Ver dentro del marco de tablet de la imagen de referencia"
          >
            <Tablet size={15} />
            <span>Marco Tablet Mockup</span>
          </button>
          <button
            className={`${styles.toggleBtn} ${
              viewMode === 'fullscreen' ? styles.toggleBtnActive : ''
            }`}
            onClick={() => setViewMode('fullscreen')}
            title="Ver en pantalla completa responsiva"
          >
            <Maximize2 size={15} />
            <span>Pantalla Completa</span>
          </button>
        </div>
      </div>

      {/* Main Mockup Stage */}
      <div
        className={`${styles.mockupStage} ${
          viewMode === 'fullscreen' ? styles.fullscreenStage : ''
        }`}
      >
        <div className={styles.tabletFrame}>
          {/* Tablet Camera / Sensor Dot */}
          <div className={styles.cameraDot} />

          {/* Screen Bezel hosting the actual App */}
          <div className={styles.screenBezel}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
