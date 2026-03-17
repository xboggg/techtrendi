import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface CarouselItem {
  src: string;
  alt: string;
  label?: string;
  sublabel?: string;
  link?: string;
}

interface CardCarouselProps {
  items: CarouselItem[];
  autoplayDelay?: number;
  showPagination?: boolean;
  showNavigation?: boolean;
  onSlideClick?: (item: CarouselItem) => void;
}

export const CardCarousel: React.FC<CardCarouselProps> = ({
  items,
  autoplayDelay = 2000,
  showPagination = true,
  showNavigation = false,
  onSlideClick,
}) => {
  const css = `
  .article-swiper {
    width: 100%;
    padding-bottom: 50px;
  }
  .article-swiper .swiper-slide {
    background-position: center;
    background-size: cover;
    width: 300px;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .article-swiper .swiper-slide img {
    display: block;
    width: 100%;
    border-radius: 16px;
  }
  .article-swiper .swiper-3d .swiper-slide-shadow-left,
  .article-swiper .swiper-3d .swiper-slide-shadow-right {
    background: none;
  }
  .article-swiper .swiper-pagination-bullet {
    background: hsl(var(--primary));
    opacity: 0.3;
  }
  .article-swiper .swiper-pagination-bullet-active {
    opacity: 1;
  }
  `;

  return (
    <div className="w-full">
      <style>{css}</style>
      <Swiper
        className="article-swiper"
        spaceBetween={50}
        autoplay={{
          delay: autoplayDelay,
          disableOnInteraction: false,
        }}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        loop={true}
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        }}
        pagination={showPagination ? { clickable: true } : false}
        navigation={
          showNavigation
            ? {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              }
            : undefined
        }
        modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
      >
        {items.concat(items).map((item, index) => (
          <SwiperSlide key={index}>
            <div
              className="relative rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => onSlideClick?.(item)}
            >
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-[480px] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {(item.label || item.sublabel) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-2xl flex flex-col justify-end p-4">
                  {item.sublabel && (
                    <span className="text-xs font-medium text-white/80 mb-1">{item.sublabel}</span>
                  )}
                  {item.label && (
                    <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight">{item.label}</h4>
                  )}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
