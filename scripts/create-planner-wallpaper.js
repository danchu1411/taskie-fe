#!/usr/bin/env node

/**
 * Create Planner Wallpaper Script
 * Creates a lighter, more subtle wallpaper for the planner page
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

const PLANNER_CONFIGS = {
  desktop: {
    width: 1280,
    height: 720,
    quality: 70,
    suffix: '-planner-desktop'
  },
  tablet: {
    width: 1024,
    height: 576,
    quality: 65,
    suffix: '-planner-tablet'
  },
  mobile: {
    width: 768,
    height: 432,
    quality: 60,
    suffix: '-planner-mobile'
  }
};

async function createPlannerWallpaper() {
  console.log('🎨 Creating planner wallpaper...\n');
  
  const inputPath = path.join(INPUT_DIR, 'clear-lake-mountains-sunrays-water-reflection-4k.jpg');
  
  if (!fs.existsSync(inputPath)) {
    console.log('❌ Source wallpaper not found. Please ensure the 4K wallpaper exists in public directory.');
    return;
  }
  
  try {
    // Create a subtle, planner-appropriate version
    for (const [variant, config] of Object.entries(PLANNER_CONFIGS)) {
      const outputFileName = `wallpaper${config.suffix}.jpg`;
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      console.log(`🖼️  Creating ${variant} version...`);
      
      await sharp(inputPath)
        .resize(config.width, config.height, {
          fit: 'cover',
          position: 'center'
        })
        .modulate({
          brightness: 0.8,  // Slightly darker
          saturation: 0.6,  // Less saturated
          hue: 0
        })
        .blur(0.5)  // Slight blur for subtlety
        .jpeg({ quality: config.quality })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      const originalStats = fs.statSync(inputPath);
      const compressionRatio = ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1);
      
      console.log(`✅ Created: ${outputFileName} (${(stats.size / 1024).toFixed(1)}KB, ${compressionRatio}% smaller)`);
    }
    
    console.log('\n📊 Planner Wallpaper Summary:');
    console.log('='.repeat(50));
    console.log('📱 Desktop: 1280x720 (70% quality, subtle)');
    console.log('📱 Tablet: 1024x576 (65% quality, subtle)');
    console.log('📱 Mobile: 768x432 (60% quality, subtle)');
    console.log('\n💡 These wallpapers are optimized for planner pages:');
    console.log('   - Lower resolution for better performance');
    console.log('   - Subtle appearance to not distract from calendar');
    console.log('   - Reduced saturation and brightness');
    console.log('   - Slight blur for professional look');
    
  } catch (error) {
    console.error('❌ Error creating planner wallpaper:', error.message);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('create-planner-wallpaper.js')) {
  createPlannerWallpaper().catch(console.error);
}

export { createPlannerWallpaper };
