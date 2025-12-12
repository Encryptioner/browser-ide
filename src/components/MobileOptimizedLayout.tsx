import { ReactNode, useEffect } from 'react';
import { useKeyboardDetection, useViewportHeight, useIsMobile } from '@/hooks/useKeyboardDetection';

interface MobileOptimizedLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Mobile-optimized layout component that adapts to keyboard visibility
 * Provides better UX for mobile typing and interaction
 */
export function MobileOptimizedLayout({ children, className = '' }: MobileOptimizedLayoutProps) {
  const { isVisible, height, isPortrait } = useKeyboardDetection();
  const isMobile = useIsMobile();
  const vh = useViewportHeight();

  // Set CSS custom properties for dynamic spacing
  useEffect(() => {
    if (isMobile) {
      const root = document.documentElement;

      if (isVisible && height > 0) {
        // Adjust padding when keyboard is visible
        root.style.setProperty('--keyboard-height', `${height}px`);
        root.style.setProperty('--effective-viewport-height', `calc(var(--vh, 1vh) * 100 - ${height}px)`);
        root.style.setProperty('--bottom-panel-height', isPortrait ? '20vh' : '25vh');
      } else {
        // Normal viewport
        root.style.setProperty('--keyboard-height', '0px');
        root.style.setProperty('--effective-viewport-height', '100vh');
        root.style.setProperty('--bottom-panel-height', '30vh');
      }
    }
  }, [isVisible, height, isPortrait, isMobile]);

  const layoutClasses = `
    mobile-optimized-layout
    ${isMobile ? 'is-mobile' : ''}
    ${isVisible ? 'keyboard-visible' : 'keyboard-hidden'}
    ${className}
  `.trim();

  return (
    <div
      className={layoutClasses}
      style={
        {
          '--vh': vh,
          height: isMobile && isVisible
            ? 'var(--effective-viewport-height, 100vh)'
            : '100vh',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

/**
 * Component for optimizing input areas on mobile
 * Prevents zoom and ensures proper focus handling
 */
interface MobileInputProps {
  children: ReactNode;
  className?: string;
  shouldPreventZoom?: boolean;
}

export function MobileInputWrapper({
  children,
  className = '',
  shouldPreventZoom = true
}: MobileInputProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={`
        mobile-input-wrapper
        ${shouldPreventZoom ? 'prevent-zoom' : ''}
        ${className}
      `.trim()}
      style={
        shouldPreventZoom && isMobile ? {
          fontSize: '16px', // Prevents zoom on iOS
        } : {}
      }
    >
      {children}
    </div>
  );
}

/**
 * Bottom panel that adjusts for keyboard visibility
 */
interface MobileBottomPanelProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export function MobileBottomPanel({
  children,
  isOpen,
  className = ''
}: MobileBottomPanelProps) {
  const { isVisible, height } = useKeyboardDetection();
  const isMobile = useIsMobile();

  const panelStyles: React.CSSProperties = {};

  if (isMobile && isOpen) {
    if (isVisible && height > 0) {
      // When keyboard is visible, make panel smaller and position properly
      panelStyles.height = 'var(--bottom-panel-height, 20vh)';
      panelStyles.maxHeight = 'var(--bottom-panel-height, 20vh)';
      panelStyles.position = 'fixed';
      panelStyles.bottom = `${height}px`;
      panelStyles.left = '0';
      panelStyles.right = '0';
      panelStyles.zIndex = '30';
    } else {
      // Normal bottom panel
      panelStyles.height = 'var(--bottom-panel-height, 30vh)';
      panelStyles.maxHeight = '40vh';
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`
        mobile-bottom-panel
        ${isMobile ? 'is-mobile' : ''}
        ${isVisible ? 'keyboard-visible' : ''}
        ${className}
      `.trim()}
      style={panelStyles}
    >
      {children}
    </div>
  );
}

/**
 * Editor area that adjusts for keyboard visibility
 */
interface MobileEditorPanelProps {
  children: ReactNode;
  className?: string;
}

export function MobileEditorPanel({
  children,
  className = ''
}: MobileEditorPanelProps) {
  const { isVisible, height } = useKeyboardDetection();
  const isMobile = useIsMobile();

  const editorStyles: React.CSSProperties = {};

  if (isMobile && isVisible && height > 0) {
    // Adjust editor height when keyboard is visible
    editorStyles.height = 'var(--effective-viewport-height, 100vh)';
    editorStyles.paddingBottom = 'var(--bottom-panel-height, 20vh)';
  }

  return (
    <div
      className={`
        mobile-editor-panel
        ${isMobile ? 'is-mobile' : ''}
        ${isVisible ? 'keyboard-visible' : ''}
        ${className}
      `.trim()}
      style={editorStyles}
    >
      {children}
    </div>
  );
}

/**
 * Touch-friendly button component
 */
interface MobileButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  ariaLabel?: string;
}

export function MobileButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  ariaLabel,
}: MobileButtonProps) {
  const isMobile = useIsMobile();

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs min-h-[36px]',
    md: 'px-4 py-3 text-sm min-h-[44px]',
    lg: 'px-6 py-4 text-base min-h-[52px]',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-100',
    icon: 'bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-100 p-3',
  };

  const buttonClasses = `
    mobile-button
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${isMobile ? 'touch-manipulation' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={buttonClasses}
    >
      {children}
    </button>
  );
}