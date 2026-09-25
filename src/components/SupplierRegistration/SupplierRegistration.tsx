import React, { useState } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import { 
  Building2, IdCard, Shapes, Check, X, Save, 
  Store, Award, ClipboardList, TrendingUp, 
  Contact, Phone, MapPin, Info, Clock, RotateCcw,
  FileText, ShoppingCart
} from 'lucide-react';
import styles from './SupplierRegistration.module.css';

export const SupplierRegistration: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={styles.container}>
      <Sidebar />

      <div className={styles.mainWrapper}>
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className={styles.scrollArea}>
          {/* Header Section */}
          <div className={styles.pageHeader}>
            <div className={styles.pageTitleGroup}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>Registro de Proveedores</h2>
                <span className={styles.badge}>
                  <Shapes size={14} />
                  Módulo de Catálogo & Compras
                </span>
              </div>
              <p className={styles.subtitle}>
                Alta y gestión de proveedores comerciales y distribuidores de material escolar para aprovisionamiento.
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <button className={styles.btnCancel}>
                <X size={16} /> Cancelar
              </button>
              <button className={styles.btnSave}>
                <Save size={16} /> Guardar Proveedor
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiLeftBorder} ${styles.orange}`} />
              <div className={`${styles.kpiIcon} ${styles.orange}`}>
                <Store size={20} />
              </div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Proveedores Activos</span>
                <span className={styles.kpiValue}>142</span>
              </div>
            </div>
            
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiLeftBorder} ${styles.green}`} />
              <div className={`${styles.kpiIcon} ${styles.gray}`}>
                <Award size={20} />
              </div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Marcas Homologadas</span>
                <span className={styles.kpiValue}>48</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiLeftBorder} ${styles.gray}`} />
              <div className={`${styles.kpiIcon} ${styles.gray}`}>
                <ClipboardList size={20} />
              </div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Órdenes en Curso</span>
                <span className={styles.kpiValue}>19 pedidos</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIcon} ${styles.gray}`}>
                <TrendingUp size={20} />
              </div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>SLA Promedio</span>
                <span className={styles.kpiValue}>48 - 72h</span>
              </div>
              {/* Optional: Add a real SVG sparkline here if needed */}
              <svg style={{marginLeft: 'auto'}} width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 18L14 10L22 14L46 2" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className={styles.mainGrid}>
            {/* Left Column: Form */}
            <div className={styles.formSection}>
              
              {/* Box 1 */}
              <div className={styles.formGroup}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Building2 size={18} /></div>
                  <div className={styles.sectionTitleGroup}>
                    <h3 className={styles.sectionTitle}>Datos Principales de la Empresa</h3>
                  </div>
                  <span className={styles.sectionNote}>Campos con (*) son obligatorios</span>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.inputWrapper}>
                    <div className={styles.inputHeader}>
                      <span className={styles.inputLabel}>NIT *</span>
                      <span className={styles.inputHint}>Máx. 20 car.</span>
                    </div>
                    <div className={styles.inputField}>
                      <Building2 size={16} color="var(--color-text-placeholder)" />
                      <input type="text" placeholder="Ej: 1029384756-0" />
                    </div>
                    <span className={styles.inputDesc}>Número de Identificación Tributaria oficial para facturación.</span>
                  </div>
                  
                  <div className={styles.inputWrapper}>
                    <div className={styles.inputHeader}>
                      <span className={styles.inputLabel}>Razón Social *</span>
                      <span className={styles.inputHint}>Máx. 50 car.</span>
                    </div>
                    <div className={styles.inputField}>
                      <Building2 size={16} color="var(--color-text-placeholder)" />
                      <input type="text" placeholder="Ej: Distribuidora Escolar Papelera S.A." />
                    </div>
                    <span className={styles.inputDesc}>Nombre mercantil registrado ante la autoridad fiscal.</span>
                  </div>
                </div>

                <div className={styles.statusRow}>
                  <span className={styles.statusLabel}>Estado Operativo</span>
                  <span className={styles.statusActive}>Activo</span>
                  <p style={{marginLeft: '12px', color: 'var(--color-text-secondary)', fontSize: '13px', maxWidth: '400px'}}>
                    El proveedor estará disponible inmediatamente para emitir órdenes de compra, recepcionar albaranes de papelería y suministrar stock escolar.
                  </p>
                </div>
              </div>

              {/* Box 2 */}
              <div className={styles.formGroup}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><IdCard size={18} /></div>
                  <div className={styles.sectionTitleGroup}>
                    <h3 className={styles.sectionTitle}>Información de Contacto y Ubicación</h3>
                    <span className={styles.sectionSubtitle}>Datos del gestor de cuentas para incidencias y despachos.</span>
                  </div>
                </div>

                <div className={styles.inputGrid3}>
                  <div className={styles.inputWrapper}>
                    <div className={styles.inputHeader}>
                      <span className={styles.inputLabel}>Nombre del Contacto</span>
                      <span className={styles.inputHint}>Opcional</span>
                    </div>
                    <div className={styles.inputField}>
                      <Contact size={16} color="var(--color-text-placeholder)" />
                      <input type="text" placeholder="Ej: Carlos Valenzuela" />
                    </div>
                  </div>
                  
                  <div className={styles.inputWrapper}>
                    <div className={styles.inputHeader}>
                      <span className={styles.inputLabel}>Teléfono de Contacto</span>
                      <span className={styles.inputHint}>Opcional</span>
                    </div>
                    <div className={styles.inputField}>
                      <Phone size={16} color="var(--color-text-placeholder)" />
                      <input type="text" placeholder="Ej: +34 912 345 678" />
                    </div>
                  </div>

                  <div className={styles.inputWrapper}>
                    <div className={styles.inputHeader}>
                      <span className={styles.inputLabel}>Ciudad / Sede</span>
                      <span className={styles.inputHint}>Opcional</span>
                    </div>
                    <div className={styles.inputField}>
                      <MapPin size={16} color="var(--color-text-placeholder)" />
                      <input type="text" placeholder="Ej: Madrid / Valencia" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3 */}
              <div className={styles.formGroup}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Shapes size={18} /></div>
                  <div className={styles.sectionTitleGroup}>
                    <h3 className={styles.sectionTitle}>Catálogo: Líneas de Productos & Marcas</h3>
                    <span className={styles.sectionSubtitle}>Categoriza los rubros escolares que abastecerá este distribuidor.</span>
                  </div>
                  <span className={styles.sectionNote}>Selección múltiple</span>
                </div>

                <div style={{fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-body)'}}>
                  Líneas de Productos
                </div>
                <div className={styles.checkboxGrid}>
                  {['Cuadernos y Papelería', 'Útiles de Escritura', 'Libros de Texto', 'Mochilas y Textil', 'Manualidades', 'Archivo & Oficina'].map(item => (
                    <label key={item} className={styles.checkboxItem}>
                      <span className={styles.checkboxLabel}>{item}</span>
                      <Check size={16} color="var(--color-text-secondary)" style={{marginLeft: 'auto'}} />
                    </label>
                  ))}
                </div>
              </div>

              {/* Box 4 */}
              <div className={styles.formGroup}>
                <div className={styles.sectionHeader} style={{marginBottom: 0}}>
                  <h3 className={styles.sectionTitle} style={{fontSize: '14px'}}>Marcas Oficiales Suministradas</h3>
                  <span className={styles.sectionNote}>Haz click para vincular marcas</span>
                </div>

                <div className={styles.brandsWrapper}>
                  <div className={styles.brandChips}>
                    {['Oxford', 'Milan', 'Faber-Castell', 'Staedtler', 'Bic', 'Pilot', 'Stabilo', 'Pelikan', 'Giotto'].map(brand => (
                      <div key={brand} className={styles.brandChip}>
                        {brand} {['Milan', 'Faber-Castell', 'Bic'].includes(brand) && <Check size={14} />}
                      </div>
                    ))}
                  </div>
                  <div className={styles.brandAddRow}>
                    <input type="text" className={styles.brandInput} placeholder="Nombre de otra marca..." />
                    <span className={styles.brandAddBtn}>+ Añadir marca</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className={styles.formActions}>
                <button className={styles.btnGhost}>
                  <RotateCcw size={16} /> Limpiar campos
                </button>
                <button className={styles.btnSecondary}>
                  <FileText size={16} /> Guardar Borrador
                </button>
                <button className={styles.btnPrimary}>
                  <ShoppingCart size={16} /> Registrar y Crear Orden
                </button>
              </div>
            </div>

            {/* Right Column: Preview & List */}
            <aside className={styles.rightSidebar}>
              
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <h4 className={styles.previewTitle}>
                    <IdCard size={16} /> Ficha Previa
                  </h4>
                  <span className={styles.previewBadge}>En tiempo real</span>
                </div>

                <div className={styles.previewContent}>
                  <div className={styles.previewCompanyInfo}>
                    <div className={styles.companyLogo}>PE</div>
                    <div className={styles.companyDetails}>
                      <span className={styles.companyName}>Distribuidora Papelera S.A.</span>
                      <span className={styles.companyNit}>NIT: 1029384756-0</span>
                    </div>
                    <span className={styles.companyStatus}>Activo</span>
                  </div>

                  <div className={styles.previewContact}>
                    <div className={styles.previewContactRow}>
                      <Contact size={14} /> Sin contacto asignado
                    </div>
                    <div className={styles.previewContactRow}>
                      <Phone size={14} /> Sin teléfono registrado
                    </div>
                    <div className={styles.previewContactRow}>
                      <MapPin size={14} /> Ubicación central
                    </div>
                  </div>

                  <div className={styles.previewBrands}>
                    <div className={styles.previewBrandsTitle}>Marcas vinculadas:</div>
                    <div className={styles.previewBrandChips}>
                      <span className={styles.previewBrandChip}>Milan</span>
                      <span className={styles.previewBrandChip}>Faber-Castell</span>
                      <span className={styles.previewBrandChip}>Bic</span>
                    </div>
                  </div>

                  <div className={styles.previewPayment}>
                    Condición de pago: <span className={styles.paymentHighlight}>Crédito: 30 días Aprobado</span>
                  </div>
                </div>
              </div>

              <div className={styles.infoAlert}>
                <Info size={16} className={styles.infoIcon} />
                <span>Al registrar este proveedor se habilitará el escaneo de código de barras para sus marcas asociadas en la caja registradora.</span>
              </div>

              <div className={styles.latestList}>
                <div className={styles.latestHeader}>
                  <h4 className={styles.latestTitle}>
                    <Clock size={16} /> Últimos Registrados
                  </h4>
                  <span className={styles.latestViewAll}>Ver todos</span>
                </div>
                <div className={styles.latestItems}>
                  <div className={styles.latestItem}>
                    <div className={styles.latestInitials}>DP</div>
                    <div className={styles.latestDetails}>
                      <span className={styles.latestName}>Distribuidora Escol...</span>
                      <span className={styles.latestNit}>NIT: 900.845.221-4</span>
                    </div>
                    <span className={styles.latestStatus}>Activo</span>
                  </div>
                  <div className={styles.latestItem}>
                    <div className={styles.latestInitials}>FC</div>
                    <div className={styles.latestDetails}>
                      <span className={styles.latestName}>Faber-Castell Distr...</span>
                      <span className={styles.latestNit}>NIT: 860.003.119-8</span>
                    </div>
                    <span className={styles.latestStatus}>Activo</span>
                  </div>
                  <div className={styles.latestItem}>
                    <div className={styles.latestInitials}>GA</div>
                    <div className={styles.latestDetails}>
                      <span className={styles.latestName}>Grupo Editorial Ana...</span>
                      <span className={styles.latestNit}>NIT: 800.129.554-1</span>
                    </div>
                    <span className={styles.latestStatus}>Activo</span>
                  </div>
                </div>
              </div>

            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};
