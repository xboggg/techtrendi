import { Suspense, lazy, Component, ReactNode } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

// Error boundary to prevent Spline crashes from taking down the page
class SplineErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

interface SplineSceneProps {
  scene: string;
  className?: string;
  fallback?: ReactNode;
}

export function SplineScene({ scene, className, fallback }: SplineSceneProps) {
  return (
    <SplineErrorBoundary fallback={fallback}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="loader"></span>
          </div>
        }
      >
        <Spline scene={scene} className={className} />
      </Suspense>
    </SplineErrorBoundary>
  );
}
