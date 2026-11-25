import { SlidingTabs } from './motion/SlidingTabs'
import type { TabItem } from './motion/SlidingTabs'

interface SlidingTabsHostProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  label?: string
  /** The row of tabs scrolls sideways on a narrow screen. */
  scrollable?: boolean
}

export const SlidingTabsHost = ({
  items,
  value,
  onChange,
  label,
  scrollable = false,
}: SlidingTabsHostProps) => (
  <SlidingTabs
    items={items}
    value={value}
    onChange={onChange}
    label={label}
    scrollable={scrollable}
  />
)
