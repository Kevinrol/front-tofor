import React, { useMemo } from 'react';
import { KpiCards } from '../../components/TarjetasKpi/TarjetasKpi';
import { StockMovementChart } from '../../components/GraficoStock/GraficoStock';
import { ProductTable } from '../../components/TablaProductos/TablaProductos';
import { SalesCategoryCard } from '../../components/TarjetaCategorias/TarjetaCategorias';
import { EducationStageCard } from '../../components/TarjetaEtapaEscolar/TarjetaEtapaEscolar';
import { INITIAL_PRODUCTS } from '../../data/mockData';
import styles from './Panel.module.css';

interface PanelProps {
  searchQuery: string;
}

export const Panel: React.FC<PanelProps> = ({ searchQuery }) => {
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return INITIAL_PRODUCTS;
    const query = searchQuery.toLowerCase();
    return INITIAL_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <main className={styles.scrollArea}>
      <div className={styles.dashboardGrid}>
        {/* Left 70% Column */}
        <div className={styles.leftColumn}>
          <KpiCards />
          <StockMovementChart />
          <ProductTable products={filteredProducts} />
        </div>

        {/* Right 30% Column */}
        <aside className={styles.rightColumn}>
          <SalesCategoryCard />
          <EducationStageCard />
        </aside>
      </div>
    </main>
  );
};

export default Panel;
