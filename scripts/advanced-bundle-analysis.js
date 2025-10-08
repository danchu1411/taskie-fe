#!/usr/bin/env node

/**
 * Advanced Bundle Analysis Script
 * Phân tích chi tiết bundle size và đưa ra khuyến nghị cụ thể
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeBundleAdvanced() {
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Dist folder not found. Please run "npm run build" first.');
    return;
  }

  console.log('🔍 Advanced Bundle Analysis Report');
  console.log('==================================\n');

  // Analyze JavaScript files
  const jsFiles = findFiles(distPath, '.js');
  let totalJsSize = 0;
  const jsAnalysis = [];
  
  console.log('📦 JavaScript Bundle Analysis:');
  jsFiles.forEach(file => {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const gzipSize = estimateGzipSize(stats.size);
    totalJsSize += stats.size;
    
    const fileName = path.relative(distPath, file);
    const category = categorizeFile(fileName);
    
    jsAnalysis.push({
      name: fileName,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      gzipSize: gzipSize,
      category: category
    });
    
    console.log(`  ${fileName}: ${sizeKB} KB (${gzipSize} KB gzipped) [${category}]`);
  });

  // Analyze CSS files
  const cssFiles = findFiles(distPath, '.css');
  let totalCssSize = 0;
  
  console.log('\n🎨 CSS Bundle Analysis:');
  cssFiles.forEach(file => {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const gzipSize = estimateGzipSize(stats.size);
    totalCssSize += stats.size;
    console.log(`  ${path.relative(distPath, file)}: ${sizeKB} KB (${gzipSize} KB gzipped)`);
  });

  // Performance Analysis
  console.log('\n📊 Performance Analysis:');
  
  const mainBundle = jsAnalysis.find(f => f.name.includes('index-') && !f.name.includes('vendor'));
  const vendorBundles = jsAnalysis.filter(f => f.name.includes('vendor-'));
  const featureBundles = jsAnalysis.filter(f => f.category === 'feature');
  
  console.log(`  Main Bundle: ${mainBundle ? mainBundle.sizeKB.toFixed(2) + ' KB' : 'Not found'}`);
  console.log(`  Vendor Bundles: ${vendorBundles.reduce((sum, b) => sum + b.sizeKB, 0).toFixed(2)} KB`);
  console.log(`  Feature Bundles: ${featureBundles.reduce((sum, b) => sum + b.sizeKB, 0).toFixed(2)} KB`);
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  
  if (mainBundle && mainBundle.sizeKB > 200) {
    console.log(`  ⚠️  Main bundle is large (${mainBundle.sizeKB.toFixed(2)} KB). Consider further splitting.`);
  }
  
  const largeVendor = vendorBundles.find(b => b.sizeKB > 50);
  if (largeVendor) {
    console.log(`  ⚠️  Large vendor bundle: ${largeVendor.name} (${largeVendor.sizeKB.toFixed(2)} KB)`);
  }
  
  const totalSize = totalJsSize + totalCssSize;
  if (totalSize > 1000 * 1024) {
    console.log(`  ⚠️  Total bundle size is large (${(totalSize / 1024).toFixed(2)} KB). Consider lazy loading.`);
  }
  
  // Code splitting effectiveness
  const chunkCount = jsFiles.length;
  const avgChunkSize = totalJsSize / chunkCount / 1024;
  console.log(`  📈 Code Splitting: ${chunkCount} chunks, avg ${avgChunkSize.toFixed(2)} KB per chunk`);
  
  if (avgChunkSize > 100) {
    console.log(`  💡 Consider splitting large chunks further (avg ${avgChunkSize.toFixed(2)} KB)`);
  }
  
  // Gzip effectiveness
  const totalGzipSize = jsAnalysis.reduce((sum, f) => sum + f.gzipSize, 0) + 
                       cssFiles.reduce((sum, f) => estimateGzipSize(fs.statSync(f).size), 0);
  const gzipRatio = ((totalSize - totalGzipSize) / totalSize * 100).toFixed(1);
  console.log(`  📦 Gzip Compression: ${gzipRatio}% reduction (${(totalGzipSize / 1024).toFixed(2)} KB total)`);
  
  console.log('\n✅ Advanced analysis complete!');
}

function categorizeFile(fileName) {
  if (fileName.includes('vendor-')) return 'vendor';
  if (fileName.includes('schedule')) return 'feature';
  if (fileName.includes('tasks')) return 'feature';
  if (fileName.includes('auth')) return 'feature';
  if (fileName.includes('ui-')) return 'ui';
  if (fileName.includes('lib')) return 'lib';
  if (fileName.includes('index-')) return 'main';
  return 'other';
}

function estimateGzipSize(originalSize) {
  // Rough estimation: gzip typically reduces size by 60-70%
  return Math.round(originalSize * 0.35 / 1024 * 100) / 100;
}

function findFiles(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extension));
    } else if (!extension || path.extname(file) === extension) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Run analysis
analyzeBundleAdvanced();
