import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, IdCard, Shapes, Check, X, Save, 
  Store, Award, Contact, Phone, MapPin, Info, Clock, RotateCcw,
  FileText, Search, Plus, Truck, Boxes, CheckCircle2, 
  AlertCircle, Loader2, Sparkles, Filter
} from 'lucide-react';
import styles from './Proveedores.module.css';
import { proveedoresService, Proveedor, Marca, LineaProducto } from '../../services/proveedores.service';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export const Proveedores: React.FC = () => {
  // Navigation / View Mode
  const [activeView, setActiveView] = useState<'form' | 'directory'>('form');

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
  const [addingBrand, setAddingBrand] = useState(false);
  const [addingLinea, setAddingLinea] = useState(false);
  
  // Data State
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([]);
  const [marcasList, setMarcasList] = useState<Marca[]>([]);
  const [lineasList, setLineasList] = useState<LineaProducto[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [quickSearch, setQuickSearch] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Toast Notification State
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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

    if (marcasList.some(m => m.nombre_marca.toLowerCase() === trimmed.toLowerCase())) {
      if (!formData.marcas.includes(trimmed)) {
        setFormData(prev => ({ ...prev, marcas: [...prev.marcas, trimmed] }));
      }
      setNewBrandInput('');
      showToast(`La marca "${trimmed}" ya existía y fue vinculada.`, 'success');
      return;
    }

    setAddingBrand(true);
    try {
      const newMarca = await proveedoresService.createMarca(trimmed);
      setMarcasList(prev => [...prev, newMarca]);
      setFormData(prev => ({
        ...prev,
        marcas: [...prev.marcas, newMarca.nombre_marca]
      }));
      setNewBrandInput('');
      showToast(`Marca "${newMarca.nombre_marca}" creada y agregada con éxito.`);
    } catch (error) {
      console.error('Error creating marca:', error);
      showToast('No se pudo registrar la marca.', 'error');
    } finally {
      setAddingBrand(false);
    }
  };

  const handleAddCustomLinea = async () => {
    const trimmed = newLineaInput.trim();
    if (!trimmed) return;

    if (lineasList.some(l => l.nombre_linea.toLowerCase() === trimmed.toLowerCase())) {
      if (!formData.lineas_productos.includes(trimmed)) {
        setFormData(prev => ({ ...prev, lineas_productos: [...prev.lineas_productos, trimmed] }));
      }
      setNewLineaInput('');
      showToast(`La línea "${trimmed}" ya existía y fue seleccionada.`, 'success');
      return;
    }

    setAddingLinea(true);
    try {
      const newLinea = await proveedoresService.createLineaProducto(trimmed);
      setLineasList(prev => [...prev, newLinea]);
      setFormData(prev => ({
        ...prev,
        lineas_productos: [...prev.lineas_productos, newLinea.nombre_linea]
      }));
      setNewLineaInput('');
      showToast(`Línea "${newLinea.nombre_linea}" creada y agregada con éxito.`);
    } catch (error) {
      console.error('Error creating linea:', error);
      showToast('No se pudo registrar la línea de producto.', 'error');
    } finally {
      setAddingLinea(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.nit.trim()) {
      showToast('El NIT es obligatorio para facturación y compras.', 'error');
      return false;
    }
    if (!/^[\d-]+$/.test(formData.nit.trim())) {
      showToast('El NIT debe contener únicamente números y guiones.', 'error');
      return false;
    }
    if (!formData.razon_social.trim()) {
      showToast('La Razón Social o Nombre Comercial es obligatoria.', 'error');
      return false;
    }
    if (formData.telefono_contacto.trim()) {
      if (!/^\+?[\d\s-]{7,15}$/.test(formData.telefono_contacto.trim())) {
        showToast('El formato del teléfono no es válido (7 a 15 dígitos).', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await proveedoresService.createProveedor(formData);
      showToast(`Proveedor "${formData.razon_social}" registrado exitosamente.`, 'success');
      handleReset();
      await fetchProveedores();
    } catch (error) {
      console.error('Error creating proveedor:', error);
      showToast('Error al registrar el proveedor en el servidor.', 'error');
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
    setNewLineaInput('');
  };

  // Inspect existing supplier in preview card
  const handleSelectSupplierForPreview = (supplier: Proveedor) => {
    setFormData({
      nit: supplier.nit,
      razon_social: supplier.razon_social,
      nombre_contacto: supplier.nombre_contacto || '',
      telefono_contacto: supplier.telefono_contacto || '',
      ciudad: supplier.ciudad || '',
      estado: supplier.estado,
      marcas: supplier.marcas || [],
      lineas_productos: supplier.lineas_productos || []
    });
    setActiveView('form');
    showToast(`Visualizando ficha de "${supplier.razon_social}".`, 'success');
  };

  // Metrics calculation
  const totalProveedores = proveedoresList.length;
  const activosCount = proveedoresList.filter(p => p.estado).length;
  const uniqueCitiesCount = useMemo(() => {
    const cities = proveedoresList.map(p => p.ciudad?.trim()).filter(Boolean);
    return new Set(cities).size;
  }, [proveedoresList]);

  // Unique display tags
  const displayMarcas = Array.from(new Set([...marcasList.map(m => m.nombre_marca), ...formData.marcas]));
  const displayLineas = Array.from(new Set([...lineasList.map(l => l.nombre_linea), ...formData.lineas_productos]));

  // Filtered lists
  const filteredQuickList = useMemo(() => {
    if (!quickSearch.trim()) return proveedoresList.slice(0, 5);
    const q = quickSearch.toLowerCase();
    return proveedoresList.filter(p => 
      p.razon_social.toLowerCase().includes(q) || 
      p.nit.includes(q) || 
      p.ciudad?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [proveedoresList, quickSearch]);

  const filteredDirectory = useMemo(() => {
    return proveedoresList.filter(p => {
      const matchesSearch = !directorySearch.trim() || 
        p.razon_social.toLowerCase().includes(directorySearch.toLowerCase()) ||
        p.nit.includes(directorySearch) ||
        (p.ciudad && p.ciudad.toLowerCase().includes(directorySearch.toLowerCase())) ||
        (p.nombre_contacto && p.nombre_contacto.toLowerCase().includes(directorySearch.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? p.estado :
        !p.estado;

      return matchesSearch && matchesStatus;
    });
  }, [proveedoresList, directorySearch, statusFilter]);

  return (
    <main className={styles.scrollArea}>
      {/* Toast Notification */}
      {toast && (
        <div className={styles.toastContainer}>
          <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)} 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Gestión de Proveedores</h1>
            <span className={styles.badge}>
              <Truck size={14} />
              Aprovisionamiento & Catálogo
            </span>
          </div>
          <p className={styles.subtitle}>
            Directorio de distribuidores oficiales y alta de marcas para el abastecimiento continuo de librería y material escolar.
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.viewSwitcher} role="tablist">
            <button 
              role="tab"
              aria-selected={activeView === 'form'}
              className={`${styles.viewTab} ${activeView === 'form' ? styles.viewTabActive : ''}`}
              onClick={() => setActiveView('form')}
            >
              <FileText size={15} />
              Registro & Ficha
            </button>
            <button 
              role="tab"
              aria-selected={activeView === 'directory'}
              className={`${styles.viewTab} ${activeView === 'directory' ? styles.viewTabActive : ''}`}
              onClick={() => setActiveView('directory')}
            >
              <Building2 size={15} />
              Directorio
              <span className={styles.tabCountBadge}>{totalProveedores}</span>
            </button>
          </div>

          {activeView === 'form' ? (
            <>
              <button type="button" className={styles.btnCancel} onClick={handleReset}>
                <RotateCcw size={15} /> Limpiar
              </button>
              <button 
                type="button" 
                className={styles.btnSave} 
                onClick={() => handleSubmit()} 
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {loading ? 'Guardando...' : 'Guardar Proveedor'}
              </button>
            </>
          ) : (
            <button 
              type="button" 
              className={styles.btnSave} 
              onClick={() => setActiveView('form')}
            >
              <Plus size={16} />
              Nuevo Proveedor
            </button>
          )}
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <section className={styles.kpiGrid} aria-label="Métricas de Proveedores">
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiLeftBorder} ${styles.orange}`} />
          <div className={`${styles.kpiIcon} ${styles.orange}`}>
            <Store size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Proveedores Totales</span>
            <span className={styles.kpiValue}>{totalProveedores}</span>
            <span className={styles.kpiSubtext}>{activosCount} habilitados para compras</span>
          </div>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiLeftBorder} ${styles.green}`} />
          <div className={`${styles.kpiIcon} ${styles.green}`}>
            <Award size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Marcas Homologadas</span>
            <span className={styles.kpiValue}>{marcasList.length}</span>
            <span className={styles.kpiSubtext}>Disponibles en catálogo escolar</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiLeftBorder} ${styles.purple}`} />
          <div className={`${styles.kpiIcon} ${styles.purple}`}>
            <Boxes size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Líneas de Productos</span>
            <span className={styles.kpiValue}>{lineasList.length}</span>
            <span className={styles.kpiSubtext}>Rubros de papelería y arte</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiLeftBorder} ${styles.blue}`} />
          <div className={`${styles.kpiIcon} ${styles.blue}`}>
            <MapPin size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Cobertura Geográfica</span>
            <span className={styles.kpiValue}>{uniqueCitiesCount > 0 ? `${uniqueCitiesCount} Ciudades` : 'Regional'}</span>
            <span className={styles.kpiSubtext}>Red de distribución activa</span>
          </div>
        </div>
      </section>

      {/* Main Content: Form View vs Directory View */}
      {activeView === 'form' ? (
        <div className={styles.mainGrid}>
          {/* Form Column */}
          <form className={styles.formSection} onSubmit={handleSubmit} noValidate>
            
            {/* Box 1: Empresa & NIT */}
            <section className={styles.formGroup}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Building2 size={20} /></div>
                <div className={styles.sectionTitleGroup}>
                  <h2 className={styles.sectionTitle}>Identificación Fiscal y Comercial</h2>
                  <span className={styles.sectionSubtitle}>Datos mercantiles oficiales para órdenes de compra y facturación.</span>
                </div>
                <span className={styles.sectionNote}>* Obligatorios</span>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputHeader}>
                    <label htmlFor="nit" className={styles.inputLabel}>
                      NIT / Identificación <span className={styles.requiredMark}>*</span>
                    </label>
                    <span className={styles.inputHint}>Números y guiones</span>
                  </div>
                  <div className={styles.inputField}>
                    <FileText size={16} color="var(--color-text-placeholder)" />
                    <input 
                      id="nit"
                      type="text" 
                      name="nit"
                      value={formData.nit}
                      onChange={handleInputChange}
                      placeholder="Ej: 1029384756-0" 
                      maxLength={20}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <span className={styles.inputDesc}>Número tributario oficial del proveedor para comprobantes.</span>
                </div>
                
                <div className={styles.inputWrapper}>
                  <div className={styles.inputHeader}>
                    <label htmlFor="razon_social" className={styles.inputLabel}>
                      Razón Social o Empresa <span className={styles.requiredMark}>*</span>
                    </label>
                    <span className={styles.inputHint}>Máx. 60 car.</span>
                  </div>
                  <div className={styles.inputField}>
                    <Building2 size={16} color="var(--color-text-placeholder)" />
                    <input 
                      id="razon_social"
                      type="text" 
                      name="razon_social"
                      value={formData.razon_social}
                      onChange={handleInputChange}
                      placeholder="Ej: Distribuidora Escolar Papelera S.A." 
                      maxLength={60}
                      required
                    />
                  </div>
                  <span className={styles.inputDesc}>Nombre formal registrado ante las autoridades fiscales.</span>
                </div>
              </div>

              {/* Status Switch (iOS / Modern toggle) */}
              <div className={styles.statusRow}>
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>Estado Operativo</span>
                  <span className={styles.statusSubtext}>
                    Determina si este proveedor está habilitado para recibir órdenes de compra inmediatas.
                  </span>
                </div>
                <div 
                  className={styles.toggleSwitch} 
                  onClick={() => setFormData(prev => ({ ...prev, estado: !prev.estado }))}
                  role="switch"
                  aria-checked={formData.estado}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setFormData(prev => ({ ...prev, estado: !prev.estado }));
                    }
                  }}
                >
                  <span className={`${styles.statusBadge} ${formData.estado ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                    <span className={styles.statusDot} />
                    {formData.estado ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className={`${styles.switchTrack} ${formData.estado ? styles.switchTrackActive : ''}`}>
                    <div className={`${styles.switchThumb} ${formData.estado ? styles.switchThumbActive : ''}`} />
                  </div>
                </div>
              </div>
            </section>

            {/* Box 2: Contacto y Ciudad */}
            <section className={styles.formGroup}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><IdCard size={20} /></div>
                <div className={styles.sectionTitleGroup}>
                  <h2 className={styles.sectionTitle}>Contacto y Localización</h2>
                  <span className={styles.sectionSubtitle}>Preventista asignado, teléfono para pedidos y sede de despacho.</span>
                </div>
              </div>

              <div className={styles.inputGrid3}>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputHeader}>
                    <label htmlFor="nombre_contacto" className={styles.inputLabel}>Nombre del Contacto</label>
                    <span className={styles.inputHint}>Opcional</span>
                  </div>
                  <div className={styles.inputField}>
                    <Contact size={16} color="var(--color-text-placeholder)" />
                    <input 
                      id="nombre_contacto"
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
                    <label htmlFor="telefono_contacto" className={styles.inputLabel}>Teléfono / WhatsApp</label>
                    <span className={styles.inputHint}>Para coordinación</span>
                  </div>
                  <div className={styles.inputField}>
                    <Phone size={16} color="var(--color-text-placeholder)" />
                    <input 
                      id="telefono_contacto"
                      type="tel" 
                      name="telefono_contacto"
                      value={formData.telefono_contacto}
                      onChange={handleInputChange}
                      placeholder="Ej: 76543210" 
                    />
                  </div>
                </div>

                <div className={styles.inputWrapper}>
                  <div className={styles.inputHeader}>
                    <label htmlFor="ciudad" className={styles.inputLabel}>Ciudad o Sede</label>
                    <span className={styles.inputHint}>Ubicación</span>
                  </div>
                  <div className={styles.inputField}>
                    <MapPin size={16} color="var(--color-text-placeholder)" />
                    <input 
                      id="ciudad"
                      type="text" 
                      name="ciudad"
                      list="ciudades-sugeridas"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      placeholder="Ej: El Alto / La Paz" 
                    />
                    <datalist id="ciudades-sugeridas">
                      <option value="El Alto" />
                      <option value="La Paz" />
                      <option value="Cochabamba" />
                      <option value="Santa Cruz" />
                      <option value="Oruro" />
                      <option value="Potosí" />
                    </datalist>
                  </div>
                </div>
              </div>
            </section>

            {/* Box 3: Líneas de Productos */}
            <section className={styles.formGroup}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Shapes size={20} /></div>
                <div className={styles.sectionTitleGroup}>
                  <h2 className={styles.sectionTitle}>Líneas de Productos Abastecidas</h2>
                  <span className={styles.sectionSubtitle}>Selecciona las áreas o rubros escolares que surte este distribuidor.</span>
                </div>
                <span className={styles.sectionNote}>
                  {formData.lineas_productos.length} seleccionadas
                </span>
              </div>

              <div className={styles.checkboxGrid}>
                {displayLineas.map(linea => {
                  const isChecked = formData.lineas_productos.includes(linea);
                  return (
                    <div 
                      key={linea} 
                      className={`${styles.checkboxItem} ${isChecked ? styles.checkboxItemSelected : ''}`}
                      onClick={() => handleLineaToggle(linea)}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                    >
                      <span className={styles.checkboxLabel}>{linea}</span>
                      {isChecked && <Check size={16} color="var(--color-primary)" />}
                    </div>
                  );
                })}
              </div>
              
              <div className={styles.brandAddRow}>
                <input 
                  type="text" 
                  className={styles.brandInput} 
                  placeholder="Crear nueva línea (ej: Cartulinas, Témperas)..." 
                  value={newLineaInput}
                  onChange={(e) => setNewLineaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomLinea())}
                />
                <button 
                  type="button" 
                  className={styles.brandAddBtn} 
                  onClick={handleAddCustomLinea}
                  disabled={addingLinea}
                >
                  <Plus size={14} />
                  {addingLinea ? 'Añadiendo...' : 'Añadir Línea'}
                </button>
              </div>
            </section>

            {/* Box 4: Marcas Oficiales */}
            <section className={styles.formGroup}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Award size={20} /></div>
                <div className={styles.sectionTitleGroup}>
                  <h2 className={styles.sectionTitle}>Marcas Comerciales Suministradas</h2>
                  <span className={styles.sectionSubtitle}>Vincula las marcas oficiales que este distribuidor representa.</span>
                </div>
                <span className={styles.sectionNote}>
                  {formData.marcas.length} vinculadas
                </span>
              </div>

              <div className={styles.brandsWrapper}>
                <div className={styles.brandChips}>
                  {displayMarcas.map(brand => {
                    const isSelected = formData.marcas.includes(brand);
                    return (
                      <button
                        type="button"
                        key={brand} 
                        className={`${styles.brandChip} ${isSelected ? styles.brandChipSelected : ''}`}
                        onClick={() => handleMarcaToggle(brand)}
                      >
                        <span>{brand}</span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.brandAddRow}>
                  <input 
                    type="text" 
                    className={styles.brandInput} 
                    placeholder="Nombre de otra marca (ej: Stabilo, Giotto)..." 
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomBrand())}
                  />
                  <button 
                    type="button" 
                    className={styles.brandAddBtn} 
                    onClick={handleAddCustomBrand}
                    disabled={addingBrand}
                  >
                    <Plus size={14} />
                    {addingBrand ? 'Guardando...' : 'Añadir Marca'}
                  </button>
                </div>
              </div>
            </section>

            {/* Form Actions Footer */}
            <div className={styles.formActions}>
              <div className={styles.formActionsLeft}>
                <button type="button" className={styles.btnGhost} onClick={handleReset}>
                  <RotateCcw size={15} /> Limpiar formulario
                </button>
              </div>

              <button 
                type="submit" 
                className={styles.btnSave} 
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {loading ? 'Procesando...' : 'Registrar Proveedor'}
              </button>
            </div>
          </form>

          {/* Right Sidebar: Live ID Card & Quick Search */}
          <aside className={styles.rightSidebar}>
            
            {/* Live Supplier Credential Card */}
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <h3 className={styles.previewTitle}>
                  <IdCard size={16} /> Ficha Comercial
                </h3>
                <span className={styles.previewLiveBadge}>
                  <span className={styles.previewLiveDot} /> En tiempo real
                </span>
              </div>

              <div className={styles.credentialSurface}>
                <div className={styles.credentialHeader}>
                  <div className={styles.companyMonogram}>
                    {formData.razon_social ? formData.razon_social.substring(0, 2).toUpperCase() : 'LT'}
                  </div>
                  <div className={styles.companyDetails}>
                    <span className={styles.companyName}>
                      {formData.razon_social || 'Razón Social de Ejemplo'}
                    </span>
                    <span className={styles.companyNit}>
                      NIT: {formData.nit || '0000000000'}
                    </span>
                  </div>
                </div>

                <div className={styles.credentialContactList}>
                  <div className={styles.credentialContactRow}>
                    <Contact size={14} />
                    <span>{formData.nombre_contacto || 'Sin contacto designado'}</span>
                  </div>
                  <div className={styles.credentialContactRow}>
                    <Phone size={14} />
                    <span>{formData.telefono_contacto || 'Sin teléfono registrado'}</span>
                  </div>
                  <div className={styles.credentialContactRow}>
                    <MapPin size={14} />
                    <span>{formData.ciudad || 'Sede no especificada'}</span>
                  </div>
                </div>

                {formData.marcas.length > 0 && (
                  <div className={styles.credentialTagGroup}>
                    <span className={styles.credentialTagLabel}>Marcas Vinculadas ({formData.marcas.length}):</span>
                    <div className={styles.credentialTagChips}>
                      {formData.marcas.slice(0, 5).map(m => (
                        <span key={m} className={styles.credentialPill}>{m}</span>
                      ))}
                      {formData.marcas.length > 5 && (
                        <span className={styles.credentialPill}>+{formData.marcas.length - 5} más</span>
                      )}
                    </div>
                  </div>
                )}

                {formData.lineas_productos.length > 0 && (
                  <div className={styles.credentialTagGroup}>
                    <span className={styles.credentialTagLabel}>Líneas Escolares:</span>
                    <div className={styles.credentialTagChips}>
                      {formData.lineas_productos.slice(0, 3).map(l => (
                        <span key={l} className={styles.credentialPill}>{l}</span>
                      ))}
                      {formData.lineas_productos.length > 3 && (
                        <span className={styles.credentialPill}>+{formData.lineas_productos.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.credentialFooter}>
                  <span className={styles.kpiSubtext}>Disponibilidad operativa:</span>
                  <span className={`${styles.statusBadge} ${formData.estado ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                    <span className={styles.statusDot} />
                    {formData.estado ? 'Habilitado' : 'Suspendido'}
                  </span>
                </div>
              </div>

              <div className={styles.infoAlert}>
                <Info size={18} className={styles.infoIcon} />
                <span>
                  Al dar de alta este proveedor, sus marcas y productos estarán disponibles en los módulos de <strong>Pedidos a Proveedor</strong> y recepción de mercadería.
                </span>
              </div>
            </div>

            {/* Quick Recent Suppliers List */}
            <div className={styles.quickListCard}>
              <div className={styles.quickListHeader}>
                <h3 className={styles.quickListTitle}>
                  <Clock size={16} /> Últimos Registrados
                </h3>
                <button 
                  type="button" 
                  className={styles.quickListAction} 
                  onClick={() => setActiveView('directory')}
                >
                  Ver todos ({totalProveedores})
                </button>
              </div>

              <div className={styles.quickSearchInput}>
                <Search size={14} color="var(--color-text-placeholder)" />
                <input 
                  type="text" 
                  placeholder="Filtrar por nombre o NIT..." 
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                />
              </div>

              <div className={styles.quickItems}>
                {filteredQuickList.length > 0 ? (
                  filteredQuickList.map((item, idx) => (
                    <div 
                      key={item.id_proveedor || idx} 
                      className={styles.quickItem}
                      onClick={() => handleSelectSupplierForPreview(item)}
                      title="Click para ver ficha completa"
                    >
                      <div className={styles.quickInitials}>
                        {item.razon_social ? item.razon_social.substring(0, 2).toUpperCase() : 'PR'}
                      </div>
                      <div className={styles.quickDetails}>
                        <span className={styles.quickName}>{item.razon_social}</span>
                        <span className={styles.quickMeta}>NIT: {item.nit} {item.ciudad ? `• ${item.ciudad}` : ''}</span>
                      </div>
                      <span className={`${styles.statusBadge} ${item.estado ? styles.statusBadgeActive : styles.statusBadgeInactive}`} style={{ fontSize: '11px', padding: '2px 6px' }}>
                        {item.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    No se encontraron proveedores.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* Full Directory View */
        <section className={styles.directorySection} aria-label="Directorio Completo de Proveedores">
          <div className={styles.directoryControls}>
            <div className={styles.directorySearch}>
              <Search size={16} color="var(--color-text-placeholder)" />
              <input 
                type="text" 
                placeholder="Buscar proveedor por razón social, NIT, contacto o ciudad..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
              />
            </div>

            <div className={styles.directoryFilters}>
              <Filter size={15} color="var(--color-text-secondary)" />
              <button 
                type="button"
                className={`${styles.filterChip} ${statusFilter === 'all' ? styles.filterChipActive : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Todos ({totalProveedores})
              </button>
              <button 
                type="button"
                className={`${styles.filterChip} ${statusFilter === 'active' ? styles.filterChipActive : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Activos ({activosCount})
              </button>
              <button 
                type="button"
                className={`${styles.filterChip} ${statusFilter === 'inactive' ? styles.filterChipActive : ''}`}
                onClick={() => setStatusFilter('inactive')}
              >
                Inactivos ({totalProveedores - activosCount})
              </button>
            </div>
          </div>

          <div className={styles.directoryGrid}>
            {filteredDirectory.length > 0 ? (
              filteredDirectory.map((prov, idx) => (
                <div key={prov.id_proveedor || idx} className={styles.supplierCard}>
                  <div className={styles.supplierCardHeader}>
                    <div className={styles.supplierCardTitleGroup}>
                      <div className={styles.supplierCardMonogram}>
                        {prov.razon_social ? prov.razon_social.substring(0, 2).toUpperCase() : 'PR'}
                      </div>
                      <div>
                        <h3 className={styles.supplierCardTitle}>{prov.razon_social}</h3>
                        <span className={styles.supplierCardNit}>NIT: {prov.nit}</span>
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${prov.estado ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                      <span className={styles.statusDot} />
                      {prov.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className={styles.supplierCardBody}>
                    <div className={styles.supplierMetaRow}>
                      <Contact size={14} />
                      <span>{prov.nombre_contacto || 'Sin contacto registrado'}</span>
                    </div>
                    <div className={styles.supplierMetaRow}>
                      <Phone size={14} />
                      <span>{prov.telefono_contacto || 'Sin teléfono registrado'}</span>
                    </div>
                    <div className={styles.supplierMetaRow}>
                      <MapPin size={14} />
                      <span>{prov.ciudad || 'Sede sin especificar'}</span>
                    </div>
                  </div>

                  {prov.marcas && prov.marcas.length > 0 && (
                    <div className={styles.supplierCardBrands}>
                      <span className={styles.supplierBrandsTitle}>Marcas que abastece:</span>
                      <div className={styles.supplierBrandsList}>
                        {prov.marcas.slice(0, 4).map(m => (
                          <span key={m} className={styles.supplierBrandBadge}>{m}</span>
                        ))}
                        {prov.marcas.length > 4 && (
                          <span className={styles.supplierBrandBadge}>+{prov.marcas.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                    <button 
                      type="button" 
                      className={styles.btnGhost}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => handleSelectSupplierForPreview(prov)}
                    >
                      <Sparkles size={14} /> Ver en Ficha / Editar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-md)' }}>
                <Building2 size={36} color="var(--color-text-placeholder)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-heading)' }}>No se encontraron proveedores</h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Intenta cambiar el criterio de búsqueda o el filtro de estado.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
};

export default Proveedores;
