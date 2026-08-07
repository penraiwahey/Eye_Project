import { Droplet, Cpu, Disc3, RefreshCcw, Package } from '@lucide/vue'

export function categoryVisual(category) {
  const c = category ?? ''
  if (c.includes('ฟองน้ำ')) {
    return { icon: RefreshCcw, chip: 'bg-violet-50 text-violet-700', badge: 'bg-violet-50 text-violet-600' }
  }
  if (c.includes('หมึก')) {
    return { icon: Droplet, chip: 'bg-sky-50 text-sky-700', badge: 'bg-sky-50 text-sky-600' }
  }
  if (c.includes('ดรัม') && c.includes('ชิป')) {
    return { icon: Cpu, chip: 'bg-indigo-50 text-indigo-700', badge: 'bg-indigo-50 text-indigo-600' }
  }
  if (c.includes('ดรัม')) {
    return { icon: Disc3, chip: 'bg-amber-50 text-amber-700', badge: 'bg-amber-50 text-amber-600' }
  }
  return { icon: Package, chip: 'bg-base-200 text-base-content/60', badge: 'bg-base-200 text-base-content/50' }
}
