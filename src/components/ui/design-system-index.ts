/**
 * TechTrendi Design System
 *
 * This file exports all custom UI components for easy importing.
 * Import components like: import { GlassCard, TiltCard, FloatingActionButton } from '@/components/ui/design-system-index';
 */

// ============================================
// ANIMATION & EFFECTS
// ============================================
export {
  ScrollAnimation,
  StaggerAnimation,
  ParallaxSection
} from './scroll-animation';

export {
  TiltCard,
  LiftCard,
  RotateCard
} from './tilt-card';

export {
  GradientMesh,
  GradientHero,
  BlobBackground
} from './gradient-mesh';

// ============================================
// GLASSMORPHISM
// ============================================
export {
  GlassCard,
  GlassPanel,
  GlassNavbar,
  GlassButton,
  GlassInput,
  GlassBadge
} from './glassmorphism';

// ============================================
// NAVIGATION
// ============================================
export {
  MegaMenu,
  DropdownMenu
} from './mega-menu';

export {
  SmartNavbar,
  ReadingProgressBar
} from './smart-navbar';

export {
  CollapsibleSidebar
} from './collapsible-sidebar';

export {
  CommandPalette,
  useCommandPalette
} from './command-palette';

export {
  FloatingActionButton,
  ScrollToTopButton
} from './floating-action-button';

export {
  TableOfContents,
  InlineTableOfContents
} from './table-of-contents';

export {
  FooterSitemap,
  SimpleFooter
} from './footer-sitemap';

// ============================================
// CONTENT BLOCKS
// ============================================
export {
  AlertBox,
  Blockquote,
  CodeBlock,
  Accordion,
  Timeline,
  StatCounter
} from './content-blocks';

// ============================================
// MEDIA
// ============================================
export {
  ImageLightbox,
  useLightbox
} from './image-lightbox';

export {
  LazyImage
} from './lazy-image';

// ============================================
// TOAST / NOTIFICATIONS
// ============================================
export {
  ToastProvider,
  useToast
} from './toast-enhanced';

// ============================================
// ACCESSIBILITY
// ============================================
export {
  SkipLink,
  FocusTrap,
  VisuallyHidden,
  LiveRegion,
  announce,
  FocusRing,
  useKeyboardNavigation,
  useReducedMotion,
  FontSizeControls,
  ReadingMode
} from './accessibility';

// ============================================
// LOADING STATES
// ============================================
export {
  Skeleton,
  CardSkeleton,
  CardGridSkeleton,
  ArticleSkeleton,
  TableSkeleton,
  CommentSkeleton,
  ToolCardSkeleton,
  ToolsGridSkeleton
} from './skeleton';
