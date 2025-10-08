#!/usr/bin/env node

/**
 * Script để analyze bundle size và performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeBundleSize() {
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Dist folder not found. Please run "npm run build" first.');
    return;
  }

  console.log('📊 Bundle Analysis Report');
  console.log('========================\n');

  // Analyze JavaScript files
  const jsFiles = findFiles(distPath, '.js');
  let totalJsSize = 0;
  
  console.log('📦 JavaScript Files:');
  jsFiles.forEach(file => {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalJsSize += stats.size;
    console.log(`  ${path.relative(distPath, file)}: ${sizeKB} KB`);
  });

  // Analyze CSS files
  const cssFiles = findFiles(distPath, '.css');
  let totalCssSize = 0;
  
  console.log('\n🎨 CSS Files:');
  cssFiles.forEach(file => {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalCssSize += stats.size;
    console.log(`  ${path.relative(distPath, file)}: ${sizeKB} KB`);
  });

  // Analyze other assets
  const otherFiles = findFiles(distPath, null).filter(file => {
    const ext = path.extname(file);
    return !['.js', '.css', '.html'].includes(ext);
  });
  let totalOtherSize = 0;
  
  if (otherFiles.length > 0) {
    console.log('\n🖼️  Other Assets:');
    otherFiles.forEach(file => {
      const stats = fs.statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalOtherSize += stats.size;
      console.log(`  ${path.relative(distPath, file)}: ${sizeKB} KB`);
    });
  }

  // Total analysis
  const totalSize = totalJsSize + totalCssSize + totalOtherSize;
  
  console.log('\n📈 Summary:');
  console.log(`  JavaScript: ${(totalJsSize / 1024).toFixed(2)} KB`);
  console.log(`  CSS: ${(totalCssSize / 1024).toFixed(2)} KB`);
  console.log(`  Other: ${(totalOtherSize / 1024).toFixed(2)} KB`);
  console.log(`  Total: ${(totalSize / 1024).toFixed(2)} KB`);

  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  
  if (totalJsSize > 500 * 1024) { // 500KB
    console.log('  ⚠️  JavaScript bundle is large. Consider code splitting.');
  }
  
  if (totalCssSize > 100 * 1024) { // 100KB
    console.log('  ⚠️  CSS bundle is large. Consider purging unused styles.');
  }
  
  if (totalSize > 1000 * 1024) { // 1MB
    console.log('  ⚠️  Total bundle size is large. Consider lazy loading.');
  }

  // Check for large individual files
  const allFiles = [...jsFiles, ...cssFiles, ...otherFiles];
  const largeFiles = allFiles.filter(file => {
    const stats = fs.statSync(file);
    return stats.size > 200 * 1024; // 200KB
  });

  if (largeFiles.length > 0) {
    console.log('\n🔍 Large Files (>200KB):');
    largeFiles.forEach(file => {
      const stats = fs.statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ${path.relative(distPath, file)}: ${sizeKB} KB`);
    });
  }

  console.log('\n✅ Bundle analysis complete!');
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
analyzeBundleSize();
