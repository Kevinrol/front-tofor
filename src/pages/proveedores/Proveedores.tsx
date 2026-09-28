import React, { useState, useEffect } from 'react';
import { 
  Building2, IdCard, Shapes, Check, X, Save, 
  Store, Award, ClipboardList, TrendingUp, 
  Contact, Phone, MapPin, Info, Clock, RotateCcw,
  FileText, ShoppingCart
} from 'lucide-react';
import styles from './Proveedores.module.css';
import { proveedoresService, Proveedor, Marca, LineaProducto } from '../../services/proveedores.service';

export const Proveedores: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState<Proveedor>({
    nit: '',
    razon_social: '',
    nombre_contacto: '',
    telefono_contacto: '',
    ciudad: '',
    estado: true,
    marcas: [],
    lineas_productos: []
  });

  const [newBrandInput, setNewBrandInput] = useState('');
  const [newLineaInput, setNewLineaInput] = useState('');
  
  // Data State
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([]);
  const [marcasList, setMarcasList] = useState<Marca[]>([]);
  const [lineasList, setLineasList] = useState<LineaProducto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProveedores();
    fetchMarcas();
    fetchLineas();
  }, []);

  const fetchProveedores = async () => {
    try {
      const data = await proveedoresService.getProveedores();
      setProveedoresList(data || []);
    } catch (error) {
      console.error('Error fetching proveedores:', error);
      // alert('Error al cargar la lista de proveedores.');
    }
  };

  const fetchMarcas = async () => {
    try {
      const data = await proveedoresService.getMarcas();
      setMarcasList(data || []);
    } catch (error) {
      console.error('Error fetching marcas:', error);
    }
  };

  const fetchLineas = async () => {
    try {
      const data = await proveedoresService.getLineasProducto();
      setLineasList(data || []);
    } catch (error) {
      console.error('Error fetching lineas:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineaToggle = (linea: string) => {
    setFormData(prev => {
      const isSelected = prev.lineas_productos.includes(linea);
      return {
        ...prev,
        lineas_productos: isSelected 
          ? prev.lineas_productos.filter(l => l !== linea)
          : [...prev.lineas_productos, linea]
      };
    });
  };

  const handleMarcaToggle = (marca: string) => {
    setFormData(prev => {
      const isSelected = prev.marcas.includes(marca);
      return {
        ...prev,
        marcas: isSelected 
          ? prev.marcas.filter(m => m !== marca)
          : [...prev.marcas, marca]
      };
    });
  };

  const handleAddCustomBrand = async () => {
    const trimmed = newBrandInput.trim();
    if (!trimmed) return;

    try {
      const newMarca = await proveedoresService.createMarca(trimmed);
      alert(`Marca "${newMarca.nombre_marca}" creada exitosamente.`);
      setMarcasList(prev => [...prev, newMarca]);
      setFormData(prev => ({
        ...prev,
        marcas: [...prev.marcas, newMarca.nombre_marca]
      }));
      setNewBrandInput('');
    } catch (error) {
      console.error('Error creating marca:', error);
      alert('Error al crear la marca.');
    }
  };

  const handleAddCustomLinea = async () => {
    const trimmed = newLineaInput.trim();
    if (!trimmed) return;

    try {
      const newLinea = await proveedoresService.createLineaProducto(trimmed);
      alert(`Línea de producto "${newLinea.nombre_linea}" creada exitosamente.`);
      setLineasList(prev => [...prev, newLinea]);
      setFormData(prev => ({
        ...prev,
        lineas_productos: [...prev.lineas_productos, newLinea.nombre_linea]
      }));
      setNewLineaInput('');
    } catch (error) {
      console.error('Error creating linea:', error);
      alert('Error al crear la línea de producto.');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.nit.trim()) {
      alert('El NIT es obligatorio.');
      return false;
    }
    // NIT basic regex: numbers and optionally hyphens
    if (!/^[\d-]+$/.test(formData.nit.trim())) {
      alert('El NIT debe contener solo números y guiones.');
      return false;
    }
    
    if (!formData.razon_social.trim()) {
      alert('La Razón Social es obligatoria.');
      return false;
    }

    if (formData.telefono_contacto.trim()) {
      // Basic phone regex (international or local)
      if (!/^\+?[\d\s-]{7,15}$/.test(formData.telefono_contacto.trim())) {
        alert('El formato del teléfono no es válido.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await proveedoresService.createProveedor(formData);
      alert('Proveedor creado exitosamente.');
      
      // Reset form
      handleReset();
      // Refresh list
      fetchProveedores();
    } catch (error) {
      console.error('Error creating proveedor:', error);
      alert('Error al crear el proveedor. Verifica la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nit: '',
      razon_social: '',
      nombre_contacto: '',
      telefono_contacto: '',
      ciudad: '',
      estado: true,
      marcas: [],
      lineas_productos: []
    });
    setNewBrandInput('');
  };

  // Helper to ensure all selected items display even if not in fetched list yet
  const displayMarcas = Array.from(new Set([...marcasList.map(m => m.nombre_marca), ...formData.marcas]));
  const displayLineas = Array.from(new Set([...lineasList.map(l => l.nombre_linea), ...formData.lineas_productos]));

  return (
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
          <button className={styles.btnCancel} onClick={handleReset}>
            <X size={16} /> Cancelar
          </button>
          <button className={styles.btnSave} onClick={handleSubmit} disabled={loading}>
            <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Proveedor'}
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
            <span className={styles.kpiValue}>{proveedoresList.length}</span>
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
                  <input 
                    type="text" 
                    name="nit"
                    value={formData.nit}
                    onChange={handleInputChange}
                    placeholder="Ej: 1029384756-0" 
                    maxLength={20}
                  />
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
                  <input 
                    type="text" 
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleInputChange}
                    placeholder="Ej: Distribuidora Escolar Papelera S.A." 
                    maxLength={50}
                  />
                </div>
                <span className={styles.inputDesc}>Nombre mercantil registrado ante la autoridad fiscal.</span>
              </div>
            </div>

            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Estado Operativo</span>
              <span 
                className={formData.estado ? styles.statusActive : styles.statusInactive}
                onClick={() => setFormData(prev => ({ ...prev, estado: !prev.estado }))}
                style={{ cursor: 'pointer' }}
              >
                {formData.estado ? 'Activo' : 'Inactivo'}
              </span>
              <p style={{marginLeft: '12px', color: 'var(--color-text-secondary)', fontSize: '13px', maxWidth: '400px'}}>
                El proveedor estará disponible inmediatamente para emitir órdenes de compra si está activo.
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
                  <input 
                    type="text" 
                    name="nombre_contacto"
                    value={formData.nombre_contacto}
                    onChange={handleInputChange}
                    placeholder="Ej: Carlos Valenzuela" 
                  />
                </div>
              </div>
              
              <div className={styles.inputWrapper}>
                <div className={styles.inputHeader}>
                  <span className={styles.inputLabel}>Teléfono de Contacto</span>
                  <span className={styles.inputHint}>Opcional</span>
                </div>
                <div className={styles.inputField}>
                  <Phone size={16} color="var(--color-text-placeholder)" />
                  <input 
                    type="text" 
                    name="telefono_contacto"
                    value={formData.telefono_contacto}
                    onChange={handleInputChange}
                    placeholder="Ej: +591 76543210" 
                  />
                </div>
              </div>

              <div className={styles.inputWrapper}>
                <div className={styles.inputHeader}>
                  <span className={styles.inputLabel}>Ciudad / Sede</span>
                  <span className={styles.inputHint}>Opcional</span>
                </div>
                <div className={styles.inputField}>
                  <MapPin size={16} color="var(--color-text-placeholder)" />
                  <input 
                    type="text" 
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    placeholder="Ej: Santa Cruz" 
                  />
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
              {displayLineas.map(item => (
                <label key={item} className={styles.checkboxItem} onClick={(e) => { e.preventDefault(); handleLineaToggle(item); }}>
                  <span className={styles.checkboxLabel}>{item}</span>
                  {formData.lineas_productos.includes(item) && (
                    <Check size={16} color="var(--color-text-secondary)" style={{marginLeft: 'auto'}} />
                  )}
                </label>
              ))}
            </div>
            
            {/* Input to add a new linea */}
            <div className={styles.brandAddRow} style={{ marginTop: '12px' }}>
              <input 
                type="text" 
                className={styles.brandInput} 
                placeholder="Nueva línea de producto..." 
                value={newLineaInput}
                onChange={(e) => setNewLineaInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomLinea()}
              />
              <span className={styles.brandAddBtn} onClick={handleAddCustomLinea} style={{ cursor: 'pointer' }}>
                + Añadir línea
              </span>
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
                {displayMarcas.map(brand => {
                  const isSelected = formData.marcas.includes(brand);
                  return (
                    <div 
                      key={brand} 
                      className={`${styles.brandChip} ${isSelected ? styles.brandChipSelected : ''}`}
                      onClick={() => handleMarcaToggle(brand)}
                      style={{ cursor: 'pointer', border: isSelected ? '1px solid var(--color-primary)' : '' }}
                    >
                      {brand} {isSelected && <Check size={14} />}
                    </div>
                  );
                })}
              </div>
              <div className={styles.brandAddRow}>
                <input 
                  type="text" 
                  className={styles.brandInput} 
                  placeholder="Nombre de otra marca..." 
                  value={newBrandInput}
                  onChange={(e) => setNewBrandInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomBrand()}
                />
                <span className={styles.brandAddBtn} onClick={handleAddCustomBrand} style={{ cursor: 'pointer' }}>
                  + Añadir marca
                </span>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className={styles.formActions}>
            <button className={styles.btnGhost} onClick={handleReset}>
              <RotateCcw size={16} /> Limpiar campos
            </button>
            <button className={styles.btnSecondary}>
              <FileText size={16} /> Guardar Borrador
            </button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
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
                <div className={styles.companyLogo}>
                  {formData.razon_social ? formData.razon_social.substring(0, 2).toUpperCase() : '??'}
                </div>
                <div className={styles.companyDetails}>
                  <span className={styles.companyName}>{formData.razon_social || 'Razón Social'}</span>
                  <span className={styles.companyNit}>NIT: {formData.nit || '---'}</span>
                </div>
                <span className={styles.companyStatus}>{formData.estado ? 'Activo' : 'Inactivo'}</span>
              </div>

              <div className={styles.previewContact}>
                <div className={styles.previewContactRow}>
                  <Contact size={14} /> {formData.nombre_contacto || 'Sin contacto asignado'}
                </div>
                <div className={styles.previewContactRow}>
                  <Phone size={14} /> {formData.telefono_contacto || 'Sin teléfono registrado'}
                </div>
                <div className={styles.previewContactRow}>
                  <MapPin size={14} /> {formData.ciudad || 'Ubicación central'}
                </div>
              </div>

              <div className={styles.previewBrands}>
                <div className={styles.previewBrandsTitle}>Marcas vinculadas:</div>
                <div className={styles.previewBrandChips}>
                  {formData.marcas.length > 0 ? formData.marcas.map(m => (
                    <span key={m} className={styles.previewBrandChip}>{m}</span>
                  )) : (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-placeholder)' }}>Ninguna seleccionada</span>
                  )}
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
              {proveedoresList.length > 0 ? (
                proveedoresList.slice(0, 5).map((item, idx) => (
                  <div key={item.id_proveedor || idx} className={styles.latestItem}>
                    <div className={styles.latestInitials}>
                      {item.razon_social ? item.razon_social.substring(0, 2).toUpperCase() : 'PR'}
                    </div>
                    <div className={styles.latestDetails}>
                      <span className={styles.latestName}>{item.razon_social}</span>
                      <span className={styles.latestNit}>NIT: {item.nit}</span>
                    </div>
                    <span className={styles.latestStatus}>{item.estado ? 'Activo' : 'Inactivo'}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  No hay proveedores registrados.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Proveedores;
