import React from 'react';
import { useLazyImage } from '../hooks/useLazyImage';

interface WallpaperBackgroundProps {
  imagePath: string;
  mobileImagePath?: string;
  children: React.ReactNode;
  className?: string;
  overlay?: boolean;
  floatingElements?: boolean;
}

export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({
  imagePath,
  mobileImagePath,
  children,
  className = '',
  overlay = true,
  floatingElements = true,
}) => {
  const { imageSrc, isLoading, isLoaded, ref } = useLazyImage({
    src: imagePath,
    fallback: mobileImagePath,
    threshold: 0.1,
    rootMargin: '100px'
  });

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Background Image */}
      <div 
        ref={ref}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
        style={{
          backgroundImage: imageSrc ? `url(${imageSrc})` : 'none',
          backgroundSize: 'cover',
          opacity: isLoaded ? 1 : 0.3,
        }}
      >
        {/* Loading placeholder */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 animate-pulse" />
        )}
      </div>
      
      {/* Overlay for text readability */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50" />
      )}
      
      {/* Floating Elements */}
      {floatingElements && (
        <>
          <div className="absolute top-8 left-8 w-24 h-24 bg-gradient-to-br from-white/10 to-blue-200/20 rounded-full blur-xl animate-pulse"></div>
          <div 
            className="absolute top-16 right-12 w-16 h-16 bg-gradient-to-br from-white/10 to-purple-200/20 rounded-full blur-lg animate-pulse" 
            style={{animationDelay: '1s'}}
          ></div>
          <div 
            className="absolute bottom-8 left-1/4 w-12 h-12 bg-gradient-to-br from-white/10 to-cyan-200/20 rounded-full blur-md animate-pulse" 
            style={{animationDelay: '2s'}}
          ></div>
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
};
