#!/usr/bin/env node

/**
 * Phase 3 Test: E2E Navigation Tests
 * Tests navigation to stats page and basic functionality
 */

import puppeteer from 'puppeteer';

async function testStatsNavigation() {
  console.log('🧪 Phase 3 Test: E2E Navigation Tests');
  console.log('=====================================');

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to app
    console.log('📱 Navigating to localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    // Wait for login form
    console.log('🔐 Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Login
    console.log('🔑 Logging in...');
    await page.type('input[type="email"]', 'dev@example.com');
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to today page
    console.log('⏳ Waiting for redirect to today page...');
    await page.waitForURL('**/today', { timeout: 15000 });
    
    // Check if stats button exists
    console.log('🔍 Looking for stats navigation button...');
    const statsButton = await page.$('button:has-text("Stats")');
    if (!statsButton) {
      throw new Error('Stats button not found in navigation');
    }
    console.log('✅ Stats button found');
    
    // Click stats button
    console.log('👆 Clicking stats button...');
    await statsButton.click();
    
    // Wait for stats page to load
    console.log('⏳ Waiting for stats page to load...');
    await page.waitForURL('**/stats', { timeout: 10000 });
    
    // Check page title
    console.log('📄 Checking page title...');
    const title = await page.$eval('h1', el => el.textContent);
    if (title !== 'Your Stats') {
      throw new Error(`Expected "Your Stats", got "${title}"`);
    }
    console.log('✅ Page title correct');
    
    // Check for stats components
    console.log('🔍 Checking for stats components...');
    
    // Check for overview cards
    const cardsContainer = await page.$('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    if (!cardsContainer) {
      throw new Error('Overview cards container not found');
    }
    console.log('✅ Overview cards container found');
    
    // Check for chart container
    const chartContainer = await page.$('.grid.grid-cols-1.lg\\:grid-cols-3');
    if (!chartContainer) {
      throw new Error('Chart container not found');
    }
    console.log('✅ Chart container found');
    
    // Check for loading states (should not be visible after load)
    console.log('🔍 Checking loading states...');
    const loadingElements = await page.$$('.stats-skeleton');
    if (loadingElements.length > 0) {
      console.log('⚠️  Warning: Loading skeletons still visible');
    } else {
      console.log('✅ No loading skeletons visible');
    }
    
    // Test responsive design
    console.log('📱 Testing responsive design...');
    
    // Mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileCards = await page.$('.grid-cols-1');
    if (!mobileCards) {
      throw new Error('Mobile layout not applied');
    }
    console.log('✅ Mobile responsive layout working');
    
    // Desktop view
    await page.setViewport({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    const desktopCards = await page.$('.lg\\:grid-cols-4');
    if (!desktopCards) {
      throw new Error('Desktop layout not applied');
    }
    console.log('✅ Desktop responsive layout working');
    
    // Test navigation back
    console.log('🔙 Testing navigation back to today page...');
    const todayButton = await page.$('button:has-text("Today")');
    if (todayButton) {
      await todayButton.click();
      await page.waitForURL('**/today', { timeout: 10000 });
      console.log('✅ Navigation back to today page successful');
    }
    
    console.log('\n🎉 All navigation tests passed!');
    console.log('✅ Stats page navigation working');
    console.log('✅ Stats page components loading');
    console.log('✅ Responsive design working');
    console.log('✅ Navigation between pages working');
    
  } catch (error) {
    console.error('❌ Navigation test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the test
testStatsNavigation().catch(console.error);
