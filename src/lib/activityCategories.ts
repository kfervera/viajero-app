import {
  Bus,
  Car,
  ClipboardCheck,
  Coffee,
  Compass,
  Landmark,
  type LucideIcon,
  Mountain,
  Plane,
  Ship,
  ShoppingBag,
  Sparkles,
  Stamp,
  Tent,
  TrainFront,
  UtensilsCrossed,
} from 'lucide-react'

export interface ActivitySubcategory {
  value: string
  label: string
  icon: LucideIcon
}

export interface ActivityCategory {
  value: string
  label: string
  subcategories: ActivitySubcategory[]
}

// Taxonomía fija (no editable por la persona): así el ícono de cada
// subcategoría nunca queda huérfano en la card. Ver PLAN.md §6.
export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    value: 'transport',
    label: 'Transporte',
    subcategories: [
      { value: 'flight', label: 'Vuelo', icon: Plane },
      { value: 'bus', label: 'Bus', icon: Bus },
      { value: 'car', label: 'Auto/Traslado', icon: Car },
      { value: 'train', label: 'Tren', icon: TrainFront },
      { value: 'boat', label: 'Barco', icon: Ship },
    ],
  },
  {
    value: 'food',
    label: 'Comida',
    subcategories: [
      { value: 'breakfast', label: 'Desayuno', icon: Coffee },
      { value: 'meal', label: 'Almuerzo/Cena', icon: UtensilsCrossed },
    ],
  },
  {
    value: 'sightseeing',
    label: 'Turismo',
    subcategories: [
      { value: 'tour', label: 'Tour/Excursión', icon: Compass },
      { value: 'museum', label: 'Museo', icon: Landmark },
      { value: 'viewpoint', label: 'Mirador/Paisaje', icon: Mountain },
      { value: 'adventure', label: 'Aventura', icon: Tent },
    ],
  },
  {
    value: 'shopping',
    label: 'Compras',
    subcategories: [{ value: 'shopping', label: 'Compras', icon: ShoppingBag }],
  },
  {
    value: 'errand',
    label: 'Trámite',
    subcategories: [
      { value: 'immigration', label: 'Migraciones/Aduana', icon: Stamp },
      { value: 'checkin', label: 'Check-in/Check-out', icon: ClipboardCheck },
    ],
  },
  {
    value: 'other',
    label: 'Otro',
    subcategories: [{ value: 'general', label: 'General', icon: Sparkles }],
  },
]

const SUBCATEGORY_ICONS = new Map<string, LucideIcon>(
  ACTIVITY_CATEGORIES.flatMap((category) =>
    category.subcategories.map((sub) => [sub.value, sub.icon] as const),
  ),
)

export function getSubcategoryIcon(
  subcategory: string | null,
): LucideIcon | null {
  if (!subcategory) return null
  return SUBCATEGORY_ICONS.get(subcategory) ?? null
}

export function getSubcategoriesFor(category: string): ActivitySubcategory[] {
  return ACTIVITY_CATEGORIES.find((c) => c.value === category)?.subcategories ?? []
}
