// Test script to check if frontend is actively aborting generate requests
// Run this in browser console to test request behavior

console.log('🧪 Testing Frontend Request Abort Behavior...\n');

// Test 1: Check if AbortController is being used
console.log('Test 1: Checking AbortController usage...');
try {
  const httpClient = window.httpClient || null;
  if (httpClient) {
    console.log('✅ HTTPClient found');
    console.log('- AbortController disabled:', httpClient.retryConfig?.attempts === 1);
  } else {
    console.log('❌ HTTPClient not found in window');
  }
} catch (error) {
  console.log('❌ Error checking HTTPClient:', error);
}

// Test 2: Monitor fetch requests
console.log('\nTest 2: Monitoring fetch requests...');
const originalFetch = window.fetch;
let requestCount = 0;
let abortCount = 0;

window.fetch = function(...args) {
  requestCount++;
  console.log(`📤 Fetch request #${requestCount}:`, args[0]);
  
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Monitor abort events
  signal.addEventListener('abort', () => {
    abortCount++;
    console.log(`🚫 Request #${requestCount} was ABORTED by client!`);
    console.log('- Abort reason:', signal.reason);
  });
  
  // Add signal to request
  const newArgs = [...args];
  if (newArgs[1]) {
    newArgs[1].signal = signal;
  } else {
    newArgs[1] = { signal };
  }
  
  return originalFetch.apply(this, newArgs).then(response => {
    console.log(`✅ Request #${requestCount} completed:`, response.status);
    return response;
  }).catch(error => {
    if (error.name === 'AbortError') {
      console.log(`🚫 Request #${requestCount} aborted:`, error.message);
    } else {
      console.log(`❌ Request #${requestCount} failed:`, error.message);
    }
    throw error;
  });
};

// Test 3: Check modal state during API calls
console.log('\nTest 3: Checking modal state management...');
const checkModalState = () => {
  const modalElement = document.querySelector('.ai-suggestions-modal-container');
  if (modalElement) {
    const isOpen = modalElement.style.display !== 'none';
    const hasLoadingClass = modalElement.classList.contains('loading');
    console.log('- Modal open:', isOpen);
    console.log('- Loading state:', hasLoadingClass);
    console.log('- Close button disabled:', modalElement.querySelector('.ai-suggestions-modal-close')?.disabled);
  } else {
    console.log('- Modal not found');
  }
};

// Test 4: Simulate form submission
console.log('\nTest 4: Simulating form submission...');
const simulateFormSubmission = () => {
  const form = document.querySelector('.manual-input-form');
  if (form) {
    console.log('✅ Form found, simulating submission...');
    
    // Fill form fields
    const titleInput = form.querySelector('#title');
    const descriptionInput = form.querySelector('#description');
    const durationSelect = form.querySelector('#duration');
    const deadlineInput = form.querySelector('#deadline');
    
    if (titleInput) titleInput.value = 'Test Math Session';
    if (descriptionInput) descriptionInput.value = 'Test description';
    if (durationSelect) durationSelect.value = '45';
    if (deadlineInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);
      deadlineInput.value = tomorrow.toISOString().slice(0, 16);
    }
    
    // Trigger form submission
    const submitButton = form.querySelector('.submit-button');
    if (submitButton && !submitButton.disabled) {
      console.log('🚀 Triggering form submission...');
      submitButton.click();
      
      // Monitor for 10 seconds
      let monitorCount = 0;
      const monitor = setInterval(() => {
        monitorCount++;
        console.log(`⏱️ Monitoring... ${monitorCount}s`);
        checkModalState();
        
        if (monitorCount >= 10) {
          clearInterval(monitor);
          console.log('\n📊 Test Results:');
          console.log(`- Total requests: ${requestCount}`);
          console.log(`- Aborted requests: ${abortCount}`);
          console.log(`- Success rate: ${((requestCount - abortCount) / requestCount * 100).toFixed(1)}%`);
        }
      }, 1000);
      
    } else {
      console.log('❌ Submit button not available or disabled');
    }
  } else {
    console.log('❌ Form not found');
  }
};

// Test 5: Check React StrictMode
console.log('\nTest 5: Checking React StrictMode...');
const checkStrictMode = () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const reactRoot = rootElement._reactInternalFiber || rootElement._reactInternals;
    if (reactRoot) {
      console.log('✅ React root found');
      // Check if StrictMode is enabled by looking for double rendering
      console.log('- StrictMode detection: Check console for double logs');
    }
  }
};

// Run all tests
console.log('🚀 Starting comprehensive abort test...\n');

// Wait for page to load
setTimeout(() => {
  checkModalState();
  checkStrictMode();
  
  // Wait a bit more then simulate
  setTimeout(() => {
    simulateFormSubmission();
  }, 2000);
}, 1000);

// Export test functions for manual use
window.abortTest = {
  checkModalState,
  simulateFormSubmission,
  checkStrictMode,
  getStats: () => ({
    requestCount,
    abortCount,
    successRate: requestCount > 0 ? ((requestCount - abortCount) / requestCount * 100).toFixed(1) : 0
  })
};

console.log('\n💡 Manual test functions available:');
console.log('- window.abortTest.checkModalState()');
console.log('- window.abortTest.simulateFormSubmission()');
console.log('- window.abortTest.getStats()');











