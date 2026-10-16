import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  ReactNode,
  CSSProperties,
  HTMLAttributes,
  ButtonHTMLAttributes
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BookOpen, PanelLeft, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import './AnimatedSidebar.css';

type SidebarState = 'expanded' | 'collapsed';
const MOBILE_QUERY = '(max-width: 960px)';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

const SPRING_TRANSITION = {
  type: 'spring',
  stiffness: 380,
  damping: 35,
  mass: 0.75,
} as const;

function subscribeToMobileQuery(callback: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerMobileSnapshot() {
  return false;
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    getServerMobileSnapshot
  );
}

interface AnimatedSidebarContextValue {
  isMobile: boolean;
  layoutId: string;
  open: boolean;
  openMobile: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  state: SidebarState;
  toggleSidebar: () => void;
}

const AnimatedSidebarContext = createContext<AnimatedSidebarContextValue | null>(null);

export function useAnimatedSidebar() {
  const context = useContext(AnimatedSidebarContext);
  if (!context) {
    throw new Error('useAnimatedSidebar must be used inside AnimatedSidebarProvider');
  }
  return context;
}

export interface AnimatedSidebarProviderProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openMobile?: boolean;
  defaultOpenMobile?: boolean;
  onOpenMobileChange?: (open: boolean) => void;
  style?: CSSProperties;
}

export function AnimatedSidebarProvider({
  children,
  open,
  defaultOpen = true,
  onOpenChange,
  openMobile,
  defaultOpenMobile = false,
  onOpenMobileChange,
  className,
  style,
  ...props
}: AnimatedSidebarProviderProps) {
  const [internalOpen, setInternalOpen] = useState(() => {
    try {
      const stored = window.localStorage.getItem('duongsach:admin-sidebar-open');
      if (stored !== null) return stored === 'true';
    } catch { /* storage is optional */ }
    return defaultOpen;
  });

  const [internalOpenMobile, setInternalOpenMobile] = useState(defaultOpenMobile);
  const isMobile = useIsMobile();
  const generatedId = useId();
  const desktopOpen = open ?? internalOpen;
  const mobileOpen = openMobile ?? internalOpenMobile;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(nextOpen);
        try {
          window.localStorage.setItem('duongsach:admin-sidebar-open', String(nextOpen));
        } catch { /* optional */ }
      }
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open]
  );

  const setOpenMobile = useCallback(
    (nextOpen: boolean) => {
      if (openMobile === undefined) setInternalOpenMobile(nextOpen);
      onOpenMobileChange?.(nextOpen);
    },
    [onOpenMobileChange, openMobile]
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile(!mobileOpen);
    else setOpen(!desktopOpen);
  }, [desktopOpen, isMobile, mobileOpen, setOpen, setOpenMobile]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [toggleSidebar]);

  return (
    <AnimatedSidebarContext.Provider
      value={{
        isMobile,
        layoutId: `${generatedId}-active`,
        open: desktopOpen,
        openMobile: mobileOpen,
        setOpen,
        setOpenMobile,
        state: desktopOpen ? 'expanded' : 'collapsed',
        toggleSidebar
      }}
    >
      <div
        {...props}
        className={cn('animated-sidebar-root', className)}
        style={style}
      >
        {children}
      </div>
    </AnimatedSidebarContext.Provider>
  );
}

export interface AnimatedSidebarProps extends Omit<React.ComponentProps<typeof motion.aside>, 'children'> {
  children?: ReactNode;
  ariaLabel?: string;
}

export const AnimatedSidebar = forwardRef<HTMLElement, AnimatedSidebarProps>(
  function AnimatedSidebar(
    {
      ariaLabel = 'Thanh điều hướng',
      children,
      className,
      style,
      ...props
    },
    forwardedRef
  ) {
    const context = useAnimatedSidebar();
    const reduce = useReducedMotion();
    const collapsed = !context.open;
    const width = collapsed ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)';

    if (context.isMobile) {
      return (
        <AnimatePresence>
          {context.openMobile && (
            <>
              <motion.div
                className="animated-sidebar-mobile-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => context.setOpenMobile(false)}
              />
              <motion.aside
                role="complementary"
                aria-label={ariaLabel}
                className={cn('animated-sidebar-mobile-drawer is-mobile-open', className)}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="animated-sidebar-panel">
                  {children}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      );
    }

    return (
      <motion.aside
        {...props}
        ref={forwardedRef}
        role="complementary"
        aria-label={ariaLabel}
        data-state={collapsed ? 'collapsed' : 'expanded'}
        initial={false}
        animate={{ width }}
        transition={reduce ? { duration: 0 } : SPRING_TRANSITION}
        style={style}
        className={cn(
          'animated-sidebar-aside',
          collapsed ? 'is-collapsed' : '',
          className
        )}
      >
        <div className="animated-sidebar-panel">
          {children}
        </div>
      </motion.aside>
    );
  }
);

export const AnimatedSidebarHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function AnimatedSidebarHeader({ className, children, ...props }, forwardedRef) {
  return (
    <div
      {...props}
      ref={forwardedRef}
      className={cn('animated-sidebar-header', className)}
    >
      {children}
    </div>
  );
});

export const AnimatedSidebarContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function AnimatedSidebarContent({ className, children, ...props }, forwardedRef) {
  return (
    <div
      {...props}
      ref={forwardedRef}
      className={cn('animated-sidebar-content', className)}
    >
      {children}
    </div>
  );
});

export const AnimatedSidebarGroup = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function AnimatedSidebarGroup({ className, children, ...props }, forwardedRef) {
  return (
    <div
      {...props}
      ref={forwardedRef}
      className={cn('animated-sidebar-group', className)}
    >
      {children}
    </div>
  );
});

export const AnimatedSidebarGroupLabel = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function AnimatedSidebarGroupLabel({ className, children, ...props }, forwardedRef) {
  const context = useAnimatedSidebar();
  if (!context.open && !context.isMobile) return null;

  return (
    <div
      {...props}
      ref={forwardedRef}
      className={cn('animated-sidebar-group-label', className)}
    >
      {children}
    </div>
  );
});

export const AnimatedSidebarGroupContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function AnimatedSidebarGroupContent({ className, children, ...props }, forwardedRef) {
  return (
    <div
      {...props}
      ref={forwardedRef}
      style={{ width: '100%' }}
      className={className}
    >
      {children}
    </div>
  );
});

export const AnimatedSidebarMenu = forwardRef<
  HTMLUListElement,
  HTMLAttributes<HTMLUListElement>
>(function AnimatedSidebarMenu({ className, children, ...props }, forwardedRef) {
  return (
    <ul
      {...props}
      ref={forwardedRef}
      className={cn('animated-sidebar-menu', className)}
    >
      {children}
    </ul>
  );
});

export const AnimatedSidebarMenuItem = forwardRef<
  HTMLLIElement,
  HTMLAttributes<HTMLLIElement>
>(function AnimatedSidebarMenuItem({ className, children, ...props }, forwardedRef) {
  return (
    <li
      {...props}
      ref={forwardedRef}
      className={cn('animated-sidebar-item', className)}
    >
      {children}
    </li>
  );
});

export interface AnimatedSidebarMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  badge?: number;
  isActive?: boolean;
  label: string;
}

export const AnimatedSidebarMenuButton = forwardRef<
  HTMLButtonElement,
  AnimatedSidebarMenuButtonProps
>(function AnimatedSidebarMenuButton(
  { icon, badge, isActive, label, className, onClick, ...props },
  forwardedRef
) {
  const context = useAnimatedSidebar();
  const collapsed = !context.open && !context.isMobile;

  return (
    <button
      {...props}
      ref={forwardedRef}
      type="button"
      className={cn(
        'animated-sidebar-btn',
        isActive ? 'is-active' : '',
        className
      )}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon && <span className="animated-sidebar-btn-icon">{icon}</span>}
      {!collapsed && (
        <span className="animated-sidebar-btn-label">{label}</span>
      )}
      {!collapsed && badge && badge > 0 ? (
        <span className="animated-sidebar-btn-badge">{badge}</span>
      ) : null}
    </button>
  );
});

export const AnimatedSidebarFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function AnimatedSidebarFooter({ className, children, ...props }, forwardedRef) {
  const context = useAnimatedSidebar();
  if (!context.open && !context.isMobile) return null;

  return (
    <div
      {...props}
      ref={forwardedRef}
      className={cn('animated-sidebar-footer', className)}
    >
      {children}
    </div>
  );
});
