#!/usr/bin/env node

/**
 * Image Optimization Script
 * Compresses and creates responsive versions of wallpapers
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const INPUT_DIR = 'public';
const OUTPUT_DIR = 'public/images/wallpapers';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WALLPAPER_CONFIGS = {
  desktop: {
    width: 1920,
    height: 1080,
    quality: 85,
    suffix: '-desktop'
  },
  tablet: {
    width: 1024,
    height: 768,
    quality: 80,
    suffix: '-tablet'
  },
  mobile: {
    width: 768,
    height: 1024,
    quality: 75,
    suffix: '-mobile'
  },
  webp: {
    width: 1920,
    height: 1080,
    quality: 85,
    format: 'webp',
    suffix: '-desktop'
  }
};

async function optimizeImage(inputPath, outputPath, config) {
  try {
    console.log(`🖼️  Processing: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    
    let pipeline = sharp(inputPath)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      });

    if (config.format === 'webp') {
      pipeline = pipeline.webp({ quality: config.quality });
    } else {
      pipeline = pipeline.jpeg({ quality: config.quality });
    }

    await pipeline.toFile(outputPath);
    
    const stats = fs.statSync(outputPath);
    const originalStats = fs.statSync(inputPath);
    const compressionRatio = ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1);
    
    console.log(`✅ Created: ${path.basename(outputPath)} (${(stats.size / 1024 / 1024).toFixed(2)}MB, ${compressionRatio}% smaller)`);
    
    return {
      path: outputPath,
      size: stats.size,
      originalSize: originalStats.size,
      compressionRatio: parseFloat(compressionRatio)
    };
  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message);
    return null;
  }
}

async function findWallpaperImages() {
  const files = fs.readdirSync(INPUT_DIR);
  return files.filter(file => 
    file.match(/\.(jpg|jpeg|png)$/i) && 
    (file.includes('wallpaper') || file.includes('background') || file.includes('4k'))
  );
}

async function optimizeAllImages() {
  console.log('🚀 Starting image optimization...\n');
  
  const images = await findWallpaperImages();
  
  if (images.length === 0) {
    console.log('❌ No wallpaper images found in public directory');
    console.log('💡 Place your wallpaper images in the public directory');
    return;
  }
  
  console.log(`📁 Found ${images.length} wallpaper image(s):`);
  images.forEach(img => console.log(`  - ${img}`));
  console.log('');
  
  const results = [];
  
  for (const image of images) {
    const inputPath = path.join(INPUT_DIR, image);
    const baseName = path.parse(image).name;
    
    console.log(`\n🔄 Processing: ${image}`);
    
    // Create all variants
    for (const [variant, config] of Object.entries(WALLPAPER_CONFIGS)) {
      const outputFileName = `${baseName}${config.suffix}.${config.format || 'jpg'}`;
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      const result = await optimizeImage(inputPath, outputPath, config);
      if (result) {
        results.push({
          variant,
          ...result
        });
      }
    }
  }
  
  // Generate summary
  console.log('\n📊 Optimization Summary:');
  console.log('='.repeat(50));
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimizedSize = results.reduce((sum, r) => sum + r.size, 0);
  const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
  
  console.log(`📦 Total original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`📦 Total optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`💾 Space saved: ${totalSavings}%`);
  
  console.log('\n📁 Generated files:');
  results.forEach(result => {
    console.log(`  ${result.variant}: ${path.basename(result.path)} (${(result.size / 1024 / 1024).toFixed(2)}MB)`);
  });
  
  // Generate usage instructions
  console.log('\n💡 Usage Instructions:');
  console.log('='.repeat(50));
  console.log('1. Update your wallpaper components to use responsive images:');
  console.log('   - Desktop: /images/wallpapers/[name]-desktop.jpg');
  console.log('   - Tablet: /images/wallpapers/[name]-tablet.jpg');
  console.log('   - Mobile: /images/wallpapers/[name]-mobile.jpg');
  console.log('   - WebP: /images/wallpapers/[name]-desktop.webp (for modern browsers)');
  console.log('\n2. Use the WallpaperBackground component for lazy loading');
  console.log('\n3. Consider implementing WebP with fallback for better performance');
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('optimize-images.js')) {
  optimizeAllImages().catch(console.error);
}

export { optimizeAllImages, optimizeImage };
