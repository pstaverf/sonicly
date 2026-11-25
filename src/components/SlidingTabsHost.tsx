import { SlidingTabs } from './motion/SlidingTabs'
import type { TabItem } from './motion/SlidingTabs'

interface SlidingTabsHostProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  label?: string
}

export const SlidingTabsHost = ({ items, value, onChange, label }: SlidingTabsHostProps) => (
  <SlidingTabs items={items} value={value} onChange={onChange} label={label} />
)
