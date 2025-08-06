// Test script for the new PNG artwork generation API
// Run this in browser console after starting your dev server

async function testPngArtworkGeneration() {
  const testParams = {
    name: "Test User",
    date: "January 1, 2025",
    signature: "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234",
    signerNumber: 42,
    isMobile: false // Test desktop first
  };

  console.log("Testing PNG artwork generation with params:", testParams);

  try {
    const response = await fetch('/api/generate-artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testParams),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const blob = await response.blob();
      console.log("Blob received - size:", blob.size, "type:", blob.type);
      
      if (blob.size > 0 && blob.type === 'image/png') {
        console.log("✅ PNG artwork generation successful!");
        
        // Create a preview
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '400px';
        img.style.border = '2px solid green';
        img.style.margin = '10px';
        img.title = 'Generated PNG Artwork';
        document.body.appendChild(img);
        
        return true;
      } else {
        console.error("❌ Invalid blob received - expected PNG, got:", blob.type);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.error("❌ API error:", response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
    return false;
  }
}

// Test both mobile and desktop
async function runPngTests() {
  console.log("=== Testing PNG Generation ===");
  
  console.log("\n--- Testing Desktop PNG ---");
  const desktopResult = await testPngArtworkGeneration();
  
  console.log("\n--- Testing Mobile PNG ---");
  // Test mobile version
  const testParamsMobile = {
    name: "Mobile User",
    date: "January 1, 2025", 
    signature: "0x987654321abcdef987654321abcdef987654321abcdef987654321abcdef9876",
    signerNumber: 123,
    isMobile: true
  };
  
  try {
    const response = await fetch('/api/generate-artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testParamsMobile),
    });

    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 0 && blob.type === 'image/png') {
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '300px';
        img.style.border = '2px solid blue';
        img.style.margin = '10px';
        img.title = 'Mobile PNG Artwork';
        document.body.appendChild(img);
        console.log("✅ Mobile PNG generation successful!");
      }
    }
  } catch (error) {
    console.error("❌ Mobile test failed:", error);
  }
  
  console.log("\n=== Results ===");
  console.log("Desktop PNG:", desktopResult ? "✅ PASS" : "❌ FAIL");
}

// Auto-run the tests
console.log("Starting PNG artwork generation tests...");
runPngTests();