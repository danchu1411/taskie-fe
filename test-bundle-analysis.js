#!/usr/bin/env node

/**
 * Phase 3 Test: Bundle Size Analysis
 * Analyzes bundle size and code splitting effectiveness
 */

import fs from 'fs';
import path from 'path';

function analyzeBundleSize() {
  console.log('🧪 Phase 3 Test: Bundle Size Analysis');
  console.log('=====================================');

  const distDir = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.log('❌ Dist directory not found. Please run npm run build first.');
    return;
  }

  console.log('📁 Analyzing dist directory...');
  
  // Get all files in dist
  const files = getAllFiles(distDir);
  
  // Categorize files
  const categories = {
    js: [],
    css: [],
    assets: [],
    other: []
  };
  
  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    const size = fs.statSync(file).size;
    const relativePath = path.relative(distDir, file);
    
    if (ext === '.js') {
      categories.js.push({ path: relativePath, size });
    } else if (ext === '.css') {
      categories.css.push({ path: relativePath, size });
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'].includes(ext)) {
      categories.assets.push({ path: relativePath, size });
    } else {
      categories.other.push({ path: relativePath, size });
    }
  });
  
  // Analyze JavaScript chunks
  console.log('\n📊 JavaScript Bundle Analysis:');
  console.log('==============================');
  
  const totalJsSize = categories.js.reduce((sum, file) => sum + file.size, 0);
  console.log(`Total JS size: ${formatBytes(totalJsSize)}`);
  
  // Sort by size
  categories.js.sort((a, b) => b.size - a.size);
  
  categories.js.forEach((file, index) => {
    const percentage = ((file.size / totalJsSize) * 100).toFixed(1);
    console.log(`${index + 1}. ${file.path}: ${formatBytes(file.size)} (${percentage}%)`);
  });
  
  // Check for stats-related chunks
  console.log('\n🎯 Stats Feature Analysis:');
  console.log('=========================');
  
  const statsChunks = categories.js.filter(file => 
    file.path.includes('stats') || 
    file.path.includes('recharts') ||
    file.path.includes('vendor-charts')
  );
  
  if (statsChunks.length > 0) {
    const statsSize = statsChunks.reduce((sum, file) => sum + file.size, 0);
    console.log(`Stats-related chunks: ${formatBytes(statsSize)}`);
    statsChunks.forEach(file => {
      console.log(`  - ${file.path}: ${formatBytes(file.size)}`);
    });
  } else {
    console.log('⚠️  No dedicated stats chunks found (may be bundled with main)');
  }
  
  // Check code splitting effectiveness
  console.log('\n🔀 Code Splitting Analysis:');
  console.log('===========================');
  
  const vendorChunks = categories.js.filter(file => 
    file.path.includes('vendor-') || 
    file.path.includes('chunk')
  );
  
  if (vendorChunks.length > 0) {
    console.log(`Number of vendor chunks: ${vendorChunks.length}`);
    const vendorSize = vendorChunks.reduce((sum, file) => sum + file.size, 0);
    console.log(`Total vendor size: ${formatBytes(vendorSize)}`);
    
    // Check for specific vendor chunks
    const reactChunk = categories.js.find(file => file.path.includes('vendor-react'));
    const rechartsChunk = categories.js.find(file => file.path.includes('vendor-charts'));
    
    if (reactChunk) {
      console.log(`✅ React chunk separated: ${formatBytes(reactChunk.size)}`);
    }
    if (rechartsChunk) {
      console.log(`✅ Recharts chunk separated: ${formatBytes(rechartsChunk.size)}`);
    }
  }
  
  // CSS Analysis
  console.log('\n🎨 CSS Analysis:');
  console.log('================');
  
  const totalCssSize = categories.css.reduce((sum, file) => sum + file.size, 0);
  console.log(`Total CSS size: ${formatBytes(totalCssSize)}`);
  
  categories.css.forEach(file => {
    console.log(`  - ${file.path}: ${formatBytes(file.size)}`);
  });
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  console.log('================================');
  
  if (totalJsSize > 500000) { // 500KB
    console.log('⚠️  JavaScript bundle is large (>500KB). Consider:');
    console.log('   - More aggressive code splitting');
    console.log('   - Tree shaking unused code');
    console.log('   - Lazy loading non-critical features');
  } else {
    console.log('✅ JavaScript bundle size is reasonable');
  }
  
  if (statsChunks.length === 0) {
    console.log('💡 Consider creating dedicated stats chunk for better caching');
  }
  
  if (vendorChunks.length < 3) {
    console.log('💡 Consider splitting vendor libraries into smaller chunks');
  }
  
  console.log('\n🎉 Bundle analysis completed!');
}

function getAllFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  });
  
  return files;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the analysis
analyzeBundleSize();
