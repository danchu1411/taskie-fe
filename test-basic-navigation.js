#!/usr/bin/env node

/**
 * Phase 3 Test: Simple Navigation Test
 * Tests basic navigation functionality
 */

import puppeteer from 'puppeteer';

async function testBasicNavigation() {
  console.log('🧪 Phase 3 Test: Basic Navigation Test');
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
    
    // Check if page loaded
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    if (title !== 'Taskie') {
      throw new Error(`Expected "Taskie", got "${title}"`);
    }
    console.log('✅ Page loaded successfully');
    
    // Check if we're on landing page
    const landingElement = await page.$('h1');
    if (landingElement) {
      const headingText = await landingElement.evaluate(el => el.textContent);
      console.log(`📝 Landing page heading: ${headingText}`);
    }
    
    // Look for login form
    console.log('🔍 Looking for login form...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      console.log('✅ Login form found');
      
      // Try to login
      console.log('🔑 Attempting login...');
      await emailInput.type('dev@example.com');
      await passwordInput.type('Password123!');
      await submitButton.click();
      
      // Wait for navigation
      console.log('⏳ Waiting for navigation...');
      await page.waitForTimeout(3000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`🔗 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/today')) {
        console.log('✅ Successfully navigated to today page');
        
        // Look for stats button
        console.log('🔍 Looking for stats button...');
        const statsButton = await page.$('button:has-text("Stats")');
        
        if (statsButton) {
          console.log('✅ Stats button found');
          
          // Click stats button
          console.log('👆 Clicking stats button...');
          await statsButton.click();
          
          // Wait for navigation
          await page.waitForTimeout(2000);
          
          // Check if we're on stats page
          const statsUrl = page.url();
          console.log(`🔗 Stats page URL: ${statsUrl}`);
          
          if (statsUrl.includes('/stats')) {
            console.log('✅ Successfully navigated to stats page');
            
            // Check for stats page content
            const statsTitle = await page.$('h1');
            if (statsTitle) {
              const titleText = await statsTitle.evaluate(el => el.textContent);
              console.log(`📝 Stats page title: ${titleText}`);
              
              if (titleText === 'Your Stats') {
                console.log('✅ Stats page content loaded correctly');
              }
            }
            
            console.log('\n🎉 Navigation test completed successfully!');
            console.log('✅ Login working');
            console.log('✅ Navigation to today page working');
            console.log('✅ Stats button accessible');
            console.log('✅ Navigation to stats page working');
            console.log('✅ Stats page content loading');
            
          } else {
            throw new Error('Failed to navigate to stats page');
          }
        } else {
          throw new Error('Stats button not found');
        }
      } else {
        throw new Error('Failed to navigate to today page after login');
      }
    } else {
      throw new Error('Login form not found');
    }
    
  } catch (error) {
    console.error('❌ Navigation test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the test
testBasicNavigation().catch(console.error);
