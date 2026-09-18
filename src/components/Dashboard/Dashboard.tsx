import React, { useState, useMemo } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import { KpiCards } from '../KpiCards/KpiCards';
import { StockMovementChart } from '../StockMovementChart/StockMovementChart';
import { ProductTable } from '../ProductTable/ProductTable';
import { SalesCategoryCard } from '../SalesCategoryCard/SalesCategoryCard';
import { EducationStageCard } from '../EducationStageCard/EducationStageCard';
import { INITIAL_PRODUCTS } from '../../data/mockData';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products according to search query
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
    <div className={styles.dashboardContainer}>
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

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
      </div>
    </div>
  );
};
