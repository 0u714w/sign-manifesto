#!/bin/bash

# Rollback script for mobile loading fixes
# This script will restore your original files from the backups

echo "🔄 Rolling back changes..."

# Check if backup files exist
if [ ! -f "backups/page.tsx.backup" ]; then
    echo "❌ Error: Backup file for page.tsx not found!"
    exit 1
fi

if [ ! -f "backups/globals.css.backup" ]; then
    echo "❌ Error: Backup file for globals.css not found!"
    exit 1
fi

if [ ! -f "backups/generate-artwork.ts.backup" ]; then
    echo "❌ Error: Backup file for generate-artwork.ts not found!"
    exit 1
fi

# Restore the original reveal page
echo "📄 Restoring reveal page..."
cp "backups/page.tsx.backup" "src/app/reveal/[tokenId]/page.tsx"

# Restore the original CSS
echo "🎨 Restoring CSS..."
cp "backups/globals.css.backup" "src/app/globals.css"

# Restore the original API endpoint
echo "🔧 Restoring API endpoint..."
cp "backups/generate-artwork.ts.backup" "src/pages/api/generate-artwork.ts"

# Restore original package.json (remove puppeteer)
echo "📦 Restoring package.json..."
cat > package.json << 'EOF'
{
  "name": "sign-manifesto",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@emailjs/browser": "^4.4.1",
    "@farcaster/miniapp-sdk": "^0.1.8",
    "@privy-io/react-auth": "^2.21.0",
    "@web3-storage/w3up-client": "^17.3.0",
    "autoprefixer": "^10.4.21",
    "bs58": "^6.0.0",
    "ethers": "^6.14.3",
    "form-data": "^4.0.2",
    "formidable": "^3.5.4",
    "next": "^14.2.29",
    "nft.storage": "^3.4.0",
    "permissionless": "^0.2.52",
    "postcss": "^8.5.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-p5": "^1.4.1",
    "react-places-autocomplete": "^7.3.0",
    "viem": "^2.33.2"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4.1.8",
    "@types/formidable": "^3.4.5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "tailwindcss": "^4.1.8",
    "typescript": "^5"
  }
}
EOF

echo "✅ Rollback complete!"
echo "Your original files have been restored."
echo ""
echo "To complete rollback:"
echo "1. Run: rm -rf node_modules package-lock.json"
echo "2. Run: npm install"
echo "3. Run: npm run dev"