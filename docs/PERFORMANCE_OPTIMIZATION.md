# Performance Optimization Guide

## 🚀 Wallpaper Performance Optimization

This guide covers the performance optimizations implemented for wallpaper backgrounds in the Taskie application.

## 📊 Performance Testing

### Running Performance Tests

```bash
# Test current performance
npm run perf:test

# Optimize images and test
npm run perf:full

# Monitor performance during development
npm run perf:monitor
```

### Performance Metrics Tracked

- **LCP (Largest Contentful Paint)**: Time to render largest content
- **FCP (First Contentful Paint)**: Time to first content render
- **CLS (Cumulative Layout Shift)**: Visual stability
- **Load Time**: Total page load time
- **Image Count & Size**: Resource usage
- **Unused CSS/JS**: Code efficiency

## 🖼️ Image Optimization

### Automatic Image Optimization

```bash
# Optimize all wallpaper images
npm run images:optimize
```

This script will:
- Create responsive versions (desktop, tablet, mobile)
- Generate WebP format for modern browsers
- Compress images with optimal quality settings
- Reduce file sizes by 60-80%

### Image Variants Generated

- `wallpaper-desktop.jpg` (1920x1080, 85% quality)
- `wallpaper-tablet.jpg` (1024x768, 80% quality)  
- `wallpaper-mobile.jpg` (768x1024, 75% quality)
- `wallpaper-desktop.webp` (1920x1080, 85% quality)

## 🔄 Lazy Loading Implementation

### WallpaperBackground Component

```tsx
import { WallpaperBackground } from '../components/WallpaperBackground';

<WallpaperBackground
  imagePath="/images/wallpapers/wallpaper-desktop.jpg"
  mobileImagePath="/images/wallpapers/wallpaper-mobile.jpg"
  className="mb-4"
>
  {/* Your content */}
</WallpaperBackground>
```

### Features

- **Intersection Observer**: Only loads when visible
- **Progressive Enhancement**: Fallback for older browsers
- **Smooth Transitions**: Fade-in effect when loaded
- **Responsive Images**: Automatic mobile/desktop switching

## 📱 Responsive Design

### Breakpoint Strategy

```css
/* Desktop: 1920x1080 wallpaper */
@media (min-width: 1024px) {
  background-image: url('/images/wallpapers/wallpaper-desktop.jpg');
}

/* Tablet: 1024x768 wallpaper */
@media (min-width: 768px) and (max-width: 1023px) {
  background-image: url('/images/wallpapers/wallpaper-tablet.jpg');
}

/* Mobile: 768x1024 wallpaper */
@media (max-width: 767px) {
  background-image: url('/images/wallpapers/wallpaper-mobile.jpg');
}
```

## ⚡ Performance Best Practices

### 1. Image Optimization
- Use WebP format with JPEG fallback
- Implement responsive images
- Compress with 75-85% quality
- Lazy load non-critical images

### 2. Loading Strategy
- Preload critical images
- Use intersection observer for lazy loading
- Implement progressive enhancement
- Add loading states

### 3. Caching
- Set appropriate cache headers
- Use service worker for offline caching
- Implement image preloading

### 4. Monitoring
- Regular performance audits
- Core Web Vitals tracking
- Bundle size monitoring
- Image load time analysis

## 🔧 Configuration

### Performance Test Configuration

```javascript
// scripts/performance-test.js
const CONFIG = {
  threshold: 0.1,        // Intersection observer threshold
  rootMargin: '50px',    // Load 50px before visible
  timeout: 5000,         // Load timeout
  retries: 3             // Retry failed loads
};
```

### Image Optimization Settings

```javascript
// scripts/optimize-images.js
const QUALITY_SETTINGS = {
  desktop: { quality: 85, width: 1920, height: 1080 },
  tablet: { quality: 80, width: 1024, height: 768 },
  mobile: { quality: 75, width: 768, height: 1024 }
};
```

## 📈 Expected Performance Improvements

### Before Optimization
- **Load Time**: 3-5 seconds
- **Image Size**: 15-20MB
- **LCP**: 2-4 seconds
- **Memory Usage**: 50-80MB

### After Optimization
- **Load Time**: 1-2 seconds
- **Image Size**: 2-4MB (80% reduction)
- **LCP**: 0.5-1.5 seconds
- **Memory Usage**: 20-30MB (60% reduction)

## 🐛 Troubleshooting

### Common Issues

1. **Images not loading**
   - Check file paths
   - Verify image optimization completed
   - Check browser console for errors

2. **Performance regression**
   - Run `npm run perf:test` to compare
   - Check image sizes in network tab
   - Verify lazy loading is working

3. **Mobile performance issues**
   - Ensure mobile images are optimized
   - Check viewport meta tag
   - Test on actual devices

### Debug Commands

```bash
# Check image optimization results
ls -la public/images/wallpapers/

# Run performance comparison
npm run perf:test

# Analyze bundle size
npm run perf:analyze
```

## 📚 Additional Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
- [Lazy Loading Best Practices](https://web.dev/lazy-loading-images/)
- [Core Web Vitals](https://web.dev/vitals/)
