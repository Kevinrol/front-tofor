import { ProductItem, MonthData, DayRevenue, CategoryShare, SchoolStageData } from '../types';

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Pack 5 Cuadernos Oxford A4',
    description: 'Cuadriculado 5×5mm - 80 hojas',
    stock: 340,
    wholesalePrice: 12.50,
    discountPercent: 10,
    finalPrice: 11.25,
    salesCount: 840,
    status: 'in_stock',
    category: 'Cuadernos',
    iconType: 'notebook'
  },
  {
    id: 'prod-2',
    name: 'Lápices Faber-Castell 24 Colores',
    description: 'Mina súper suave antirotura',
    stock: 185,
    wholesalePrice: 8.90,
    discountPercent: 5,
    finalPrice: 8.45,
    salesCount: 520,
    status: 'in_stock',
    category: 'Escritura',
    iconType: 'pencil'
  },
  {
    id: 'prod-3',
    name: 'Mochila Ergonómica Escolar Totto',
    description: 'Espaldar transpirable y ruedas',
    stock: 18,
    wholesalePrice: 45.00,
    discountPercent: 15,
    finalPrice: 38.25,
    salesCount: 115,
    status: 'low_stock',
    category: 'Mochilas',
    iconType: 'backpack'
  },
  {
    id: 'prod-4',
    name: 'Estuche Milan Triple Cremallera',
    description: 'Edición Especial Sunset',
    stock: 92,
    wholesalePrice: null,
    discountPercent: null,
    finalPrice: 14.00,
    salesCount: 280,
    status: 'in_stock',
    category: 'Accesorios',
    iconType: 'case'
  },
  {
    id: 'prod-5',
    name: 'Compás Staedtler Micrométrico',
    description: 'Con adaptador universal & estuche',
    stock: 9,
    wholesalePrice: null,
    discountPercent: null,
    finalPrice: 9.50,
    salesCount: 74,
    status: 'almost_out',
    category: 'Geometría',
    iconType: 'compass'
  }
];

export const MONTHLY_STOCK_SALES: MonthData[] = [
  { month: 'Enero', shortMonth: 'Ene', salesUnits: 35, stockEntries: 58 },
  { month: 'Febrero', shortMonth: 'Feb', salesUnits: 30, stockEntries: 48 },
  { month: 'Marzo', shortMonth: 'Mar', salesUnits: 45, stockEntries: 72 },
  { month: 'Abril', shortMonth: 'Abr', salesUnits: 0, stockEntries: 36 },
  { month: 'Mayo', shortMonth: 'May', salesUnits: 0, stockEntries: 22 },
  {
    month: 'Junio',
    shortMonth: 'Jun',
    salesUnits: 65,
    stockEntries: 86,
    percentageBadge: 25,
    campaignInfo: {
      name: 'Campaña Sep',
      sales: 4850,
      exchanges: 120
    }
  },
  { month: 'Julio', shortMonth: 'Jul', salesUnits: 80, stockEntries: 95 },
  { month: 'Agosto', shortMonth: 'Ago', salesUnits: 75, stockEntries: 90 },
  { month: 'Septiembre', shortMonth: 'Sep', salesUnits: 50, stockEntries: 70 },
  { month: 'Octubre', shortMonth: 'Oct', salesUnits: 0, stockEntries: 40 },
  { month: 'Noviembre', shortMonth: 'Nov', salesUnits: 0, stockEntries: 18 },
  { month: 'Diciembre', shortMonth: 'Dic', salesUnits: 40, stockEntries: 66 }
];

export const WEEKLY_REVENUE_DAYS: DayRevenue[] = [
  { day: 'Mon', amount: 480, segments: 2 },
  { day: 'Tue', amount: 620, segments: 3 },
  { day: 'Wed', amount: 790, segments: 4 },
  { day: 'Thu', amount: 840, segments: 4 },
  { day: 'Fri', amount: 1210.60, segments: 6, isHighlighted: true },
  { day: 'Sat', amount: 590, segments: 3 },
  { day: 'Sun', amount: 410, segments: 2 }
];

export const CATEGORY_SHARES: CategoryShare[] = [
  { id: 'cuadernos', name: 'Cuadernos', percentage: 35, color: '#222026' },
  { id: 'mochilas', name: 'Mochilas', percentage: 23, color: 'url(#orangeStripes)' }, // We'll define this pattern in SVG
  { id: 'escritura', name: 'Escritura', percentage: 20, color: '#FD3706' },
  { id: 'artes', name: 'Artes / Tijeras', percentage: 12, color: '#E5E7EB' },
  { id: 'geometria', name: 'Geometría', percentage: 10, color: '#9C8173' }
];

export const SCHOOL_STAGES: SchoolStageData[] = [
  { id: 'primaria', stage: 'Primaria', percentage: 38, color: '#222026' },
  { id: 'eso', stage: 'ESO/Sec.', percentage: 28, color: '#222026' },
  { id: 'infantil', stage: 'Infantil', percentage: 20, color: '#393642' },
  { id: 'bach', stage: 'Bach./Uni', percentage: 14, color: '#7D8A99' }
];
