import { useRef, useCallback, useEffect } from 'react';
import type { TouchEvent as ReactTouchEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TabItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  // eslint-disable-next-line no-unused-vars
  onTabChange: (tabId: string) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Swipe detection threshold (px)
// ---------------------------------------------------------------------------

const SWIPE_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// BottomTabBar
// ---------------------------------------------------------------------------

export function BottomTabBar({
  tabs,
  activeTab,
  onTabChange,
  disabled = false,
}: BottomTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  // Scroll active tab into view on mount and tab change
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  // Swipe handlers
  const handleTouchStart = useCallback(
    (e: ReactTouchEvent) => {
      if (disabled) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    },
    [disabled],
  );

  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      if (disabled || tabs.length < 2) return;

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;

      // Ignore vertical swipes
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      if (dx < 0 && activeIndex < tabs.length - 1) {
        // Swipe left → next tab
        onTabChange(tabs[activeIndex + 1].id);
      } else if (dx > 0 && activeIndex > 0) {
        // Swipe right → previous tab
        onTabChange(tabs[activeIndex - 1].id);
      }
    },
    [disabled, tabs, activeIndex, onTabChange],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'ArrowRight' && activeIndex < tabs.length - 1) {
        e.preventDefault();
        onTabChange(tabs[activeIndex + 1].id);
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        e.preventDefault();
        onTabChange(tabs[activeIndex - 1].id);
      } else if (e.key === 'Home') {
        e.preventDefault();
        onTabChange(tabs[0].id);
      } else if (e.key === 'End') {
        e.preventDefault();
        onTabChange(tabs[tabs.length - 1].id);
      }
    },
    [disabled, tabs, activeIndex, onTabChange],
  );

  if (tabs.length === 0) return null;

  return (
    <div data-testid="bottom-tab-bar">
      {/* Scrollable tab strip */}
      <div
        ref={scrollRef}
        className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto scroll-smooth snap-x snap-mandatory"
        role="tablist"
        aria-label="Bottom panel tabs"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              data-active={isActive}
              disabled={disabled}
              className={clsx(
                'snap-center flex-shrink-0 px-3 sm:px-4 py-2 cursor-pointer text-xs sm:text-sm',
                'touch-manipulation min-w-[60px] sm:min-w-0',
                'flex flex-col items-center justify-center whitespace-nowrap',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isActive
                  ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                  : 'hover:bg-gray-700 text-gray-300',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="text-lg sm:text-base mb-0.5">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-[10px]">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Dots indicator (visible on mobile only when multiple tabs) */}
      {tabs.length > 1 && (
        <div
          className="sm:hidden flex justify-center gap-1 py-1 bg-gray-800"
          aria-hidden="true"
          data-testid="tab-dots"
        >
          {tabs.map((tab, i) => (
            <span
              key={tab.id}
              className={clsx(
                'inline-block w-1.5 h-1.5 rounded-full transition-colors',
                i === activeIndex ? 'bg-blue-500' : 'bg-gray-600',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
