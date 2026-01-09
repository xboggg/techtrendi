import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download, Share2, Maximize2, Play, Grid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  thumbnail?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  showCaptions?: boolean;
  enableLightbox?: boolean;
  className?: string;
}

export function ImageGallery({
  images,
  columns = 3,
  gap = 'md',
  showCaptions = true,
  enableLightbox = true,
  className,
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const gapSizes = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  const openLightbox = (index: number) => {
    if (enableLightbox) {
      setCurrentIndex(index);
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div className={cn('grid', columnClasses[columns], gapSizes[gap], className)}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-lg bg-muted cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            <img
              src={image.thumbnail || image.src}
              alt={image.alt}
              className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {showCaptions && image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {enableLightbox && lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={currentIndex}
          onClose={() => setLightboxOpen(false)}
          onChange={setCurrentIndex}
        />
      )}
    </>
  );
}

// Lightbox Component
interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
}

export function Lightbox({ images, currentIndex, onClose, onChange }: LightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const currentImage = images[currentIndex];

  const goNext = useCallback(() => {
    onChange((currentIndex + 1) % images.length);
    setZoom(1);
  }, [currentIndex, images.length, onChange]);

  const goPrev = useCallback(() => {
    onChange((currentIndex - 1 + images.length) % images.length);
    setZoom(1);
  }, [currentIndex, images.length, onChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(z + 0.25, 3));
          break;
        case '-':
          setZoom((z) => Math.max(z - 0.25, 0.5));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [goNext, goPrev, onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = currentImage.alt || 'image';
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentImage.alt,
          url: currentImage.src,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(currentImage.src);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <span className="text-white text-sm">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/20 mx-2" />
          <button
            onClick={handleDownload}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={cn(
              'p-2 transition-colors',
              showThumbnails ? 'text-white' : 'text-white/70 hover:text-white'
            )}
            title="Show thumbnails"
          >
            <Grid className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/20 mx-2" />
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />

        {/* Navigation */}
        <button
          onClick={goPrev}
          className="absolute left-4 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <div className="p-4 text-center bg-black/50">
          <p className="text-white">{currentImage.caption}</p>
        </div>
      )}

      {/* Thumbnails */}
      {showThumbnails && (
        <div className="p-4 bg-black/50 overflow-x-auto">
          <div className="flex gap-2 justify-center">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => {
                  onChange(index);
                  setZoom(1);
                }}
                className={cn(
                  'w-16 h-16 rounded overflow-hidden flex-shrink-0 transition-all',
                  currentIndex === index
                    ? 'ring-2 ring-white'
                    : 'opacity-50 hover:opacity-100'
                )}
              >
                <img
                  src={image.thumbnail || image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Carousel Component
interface CarouselProps {
  images: GalleryImage[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export function ImageCarousel({
  images,
  autoPlay = false,
  interval = 5000,
  showDots = true,
  showArrows = true,
  className,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoPlay || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, isPaused, images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex transition-transform duration-500"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image) => (
          <div key={image.id} className="w-full flex-shrink-0">
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover aspect-video"
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                currentIndex === index ? 'bg-white' : 'bg-white/50'
              )}
            />
          ))}
        </div>
      )}

      {/* Play/Pause for autoPlay */}
      {autoPlay && (
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <Play className={cn('w-4 h-4', !isPaused && 'opacity-50')} />
        </button>
      )}
    </div>
  );
}

// Before/After Comparison
interface BeforeAfterProps {
  before: { src: string; label?: string };
  after: { src: string; label?: string };
  className?: string;
}

export function BeforeAfterSlider({ before, after, className }: BeforeAfterProps) {
  const [position, setPosition] = useState(50);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percent)));
  };

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl cursor-ew-resize', className)}
      onMouseMove={handleMove}
    >
      {/* After Image (background) */}
      <img src={after.src} alt="After" className="w-full aspect-video object-cover" />

      {/* Before Image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img src={before.src} alt="Before" className="w-full h-full object-cover" />
      </div>

      {/* Slider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ChevronLeft className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Labels */}
      {before.label && (
        <span className="absolute top-4 left-4 px-2 py-1 bg-black/50 text-white text-sm rounded">
          {before.label}
        </span>
      )}
      {after.label && (
        <span className="absolute top-4 right-4 px-2 py-1 bg-black/50 text-white text-sm rounded">
          {after.label}
        </span>
      )}
    </div>
  );
}

export default ImageGallery;
