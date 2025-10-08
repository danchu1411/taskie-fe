#!/usr/bin/env node

/**
 * Performance Testing Script
 * Measures page load performance before/after wallpaper implementation
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const RESULTS_FILE = 'performance-results.json';

async function measurePerformance(url, testName) {
  console.log(`\n🔍 Testing: ${testName}`);
  console.log(`📱 URL: ${url}`);
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  const startTime = Date.now();
  
  // Navigate to page
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Wait for page to fully load
  await page.waitForTimeout(2000);
  
  const endTime = Date.now();
  const loadTime = endTime - startTime;
  
  // Get performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      // Core Web Vitals
      LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
      FID: performance.getEntriesByType('first-input')[0]?.processingStart || 0,
      CLS: performance.getEntriesByType('layout-shift').reduce((acc, entry) => acc + entry.value, 0),
      
      // Load times
      DOMContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      LoadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Paint times
      FirstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      FirstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      
      // Resource info
      ResourceCount: performance.getEntriesByType('resource').length,
      ImageCount: performance.getEntriesByType('resource').filter(r => r.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)).length,
      TotalImageSize: performance.getEntriesByType('resource')
        .filter(r => r.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
        .reduce((acc, r) => acc + (r.transferSize || 0), 0),
    };
  });
  
  // Get coverage data
  const jsCoverage = await page.coverage.stopJSCoverage();
  const cssCoverage = await page.coverage.stopCSSCoverage();
  
  // Calculate unused CSS/JS
  const unusedCSS = cssCoverage.reduce((acc, entry) => {
    const unusedBytes = entry.ranges
      .filter(range => range.count === 0)
      .reduce((sum, range) => sum + range.end - range.start, 0);
    return acc + unusedBytes;
  }, 0);
  
  const unusedJS = jsCoverage.reduce((acc, entry) => {
    const unusedBytes = entry.ranges
      .filter(range => range.count === 0)
      .reduce((sum, range) => sum + range.end - range.start, 0);
    return acc + unusedBytes;
  }, 0);
  
  await browser.close();
  
  const result = {
    testName,
    url,
    timestamp: new Date().toISOString(),
    loadTime,
    metrics: {
      ...metrics,
      unusedCSS,
      unusedJS,
    }
  };
  
  console.log(`✅ Load time: ${loadTime}ms`);
  console.log(`📊 LCP: ${metrics.LCP.toFixed(2)}ms`);
  console.log(`🎨 FCP: ${metrics.FirstContentfulPaint.toFixed(2)}ms`);
  console.log(`🖼️ Images: ${metrics.ImageCount} (${(metrics.TotalImageSize / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`📦 Unused CSS: ${(unusedCSS / 1024).toFixed(2)}KB`);
  console.log(`📦 Unused JS: ${(unusedJS / 1024).toFixed(2)}KB`);
  
  return result;
}

async function runPerformanceTests() {
  const baseUrl = 'http://localhost:5175';
  const results = [];
  
  try {
    // Test TodayPage
    const todayResult = await measurePerformance(`${baseUrl}/today`, 'TodayPage with Wallpaper');
    results.push(todayResult);
    
    // Test TasksPage  
    const tasksResult = await measurePerformance(`${baseUrl}/tasks`, 'TasksPage with Wallpaper');
    results.push(tasksResult);
    
    // Test without wallpaper (if you have a version without)
    // const todayNoWallpaper = await measurePerformance(`${baseUrl}/today?no-wallpaper=true`, 'TodayPage without Wallpaper');
    // results.push(todayNoWallpaper);
    
  } catch (error) {
    console.error('❌ Error running performance tests:', error.message);
    console.log('💡 Make sure the dev server is running: npm run dev');
    process.exit(1);
  }
  
  // Save results
  const existingResults = fs.existsSync(RESULTS_FILE) 
    ? JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'))
    : [];
  
  const allResults = [...existingResults, ...results];
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));
  
  console.log(`\n📊 Results saved to ${RESULTS_FILE}`);
  console.log(`\n📈 Performance Summary:`);
  
  results.forEach(result => {
    console.log(`\n${result.testName}:`);
    console.log(`  Load Time: ${result.loadTime}ms`);
    console.log(`  LCP: ${result.metrics.LCP.toFixed(2)}ms`);
    console.log(`  Images: ${result.metrics.ImageCount} (${(result.metrics.TotalImageSize / 1024 / 1024).toFixed(2)}MB)`);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTests().catch(console.error);
}

export { measurePerformance, runPerformanceTests };
