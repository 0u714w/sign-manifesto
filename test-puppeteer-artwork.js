// Simple test to verify Puppeteer installation and artwork generation
// Run this after npm install completes

async function testPuppeteerArtwork() {
  console.log("🎨 Testing Puppeteer artwork generation...");
  
  const testParams = {
    name: "Test User",
    date: "January 1, 2025",
    signature: "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234",
    signerNumber: 42,
    isMobile: false
  };

  try {
    console.log("📡 Sending request to /api/generate-artwork...");
    const startTime = Date.now();
    
    const response = await fetch('/api/generate-artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testParams),
    });

    const endTime = Date.now();
    console.log(`⏱️  Request took ${endTime - startTime}ms`);
    console.log("📊 Response status:", response.status);
    console.log("📋 Response headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const blob = await response.blob();
      console.log("📦 Blob received - size:", blob.size, "type:", blob.type);
      
      if (blob.size > 0 && blob.type === 'image/png') {
        console.log("✅ SUCCESS: PNG artwork generated with Puppeteer!");
        
        // Display the artwork
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '500px';
        img.style.border = '3px solid green';
        img.style.margin = '10px';
        img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        img.title = 'Puppeteer-generated PNG from p5.js sketch';
        
        // Add to page with label
        const container = document.createElement('div');
        container.style.textAlign = 'center';
        container.style.margin = '20px';
        
        const label = document.createElement('h3');
        label.textContent = '🎉 Your p5.js sketch rendered as PNG!';
        label.style.color = 'green';
        
        container.appendChild(label);
        container.appendChild(img);
        document.body.appendChild(container);
        
        console.log("🖼️  Artwork displayed on page!");
        return true;
      } else {
        console.error("❌ Invalid response - expected PNG, got:", blob.type);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.error("❌ API error:", response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
    
    if (error.message.includes('fetch')) {
      console.log("💡 Make sure your dev server is running: npm run dev");
    }
    return false;
  }
}

// Test mobile version too
async function testMobileArtwork() {
  console.log("📱 Testing mobile artwork generation...");
  
  const testParams = {
    name: "Mobile Tester",
    date: "January 1, 2025",
    signature: "0x987654321fedcba987654321fedcba987654321fedcba987654321fedcba9876",
    signerNumber: 123,
    isMobile: true
  };

  try {
    const response = await fetch('/api/generate-artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testParams),
    });

    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 0 && blob.type === 'image/png') {
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '300px';
        img.style.border = '3px solid blue';
        img.style.margin = '10px';
        img.title = 'Mobile PNG Artwork';
        
        const container = document.createElement('div');
        container.style.textAlign = 'center';
        container.style.margin = '20px';
        
        const label = document.createElement('h4');
        label.textContent = '📱 Mobile Version';
        label.style.color = 'blue';
        
        container.appendChild(label);
        container.appendChild(img);
        document.body.appendChild(container);
        
        console.log("✅ Mobile artwork generated successfully!");
        return true;
      }
    }
  } catch (error) {
    console.error("❌ Mobile test failed:", error);
  }
  return false;
}

// Run comprehensive tests
async function runAllTests() {
  console.log("🚀 Starting comprehensive artwork tests...");
  console.log("⏳ This may take a moment as Puppeteer launches a browser...");
  
  const desktopResult = await testPuppeteerArtwork();
  const mobileResult = await testMobileArtwork();
  
  console.log("\n📊 === TEST RESULTS ===");
  console.log("🖥️  Desktop PNG:", desktopResult ? "✅ PASS" : "❌ FAIL");
  console.log("📱 Mobile PNG:", mobileResult ? "✅ PASS" : "❌ FAIL");
  
  if (desktopResult && mobileResult) {
    console.log("🎉 ALL TESTS PASSED! Your artwork generation is working perfectly!");
    console.log("💡 Mobile loading and IPFS uploads should now work reliably.");
  } else {
    console.log("⚠️  Some tests failed. Check the errors above.");
  }
}

// Instructions
console.log(`
🎨 PUPPETEER ARTWORK TEST READY!

Once npm install completes:
1. Run: npm run dev
2. Open your browser to localhost:3000
3. Open developer console
4. Paste and run: runAllTests()

This will test your new PNG artwork generation system!
`);

// Auto-run if this script is pasted directly
if (typeof window !== 'undefined') {
  console.log("🎯 Ready to test! Run: runAllTests()");
}