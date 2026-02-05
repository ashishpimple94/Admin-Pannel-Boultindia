#!/bin/bash

echo "🚀 Starting Hostinger deployment for Admin Panel..."

# Build the project
echo "📦 Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Create deployment package
echo "📁 Creating deployment package..."
cd build

# Create a zip file with all build contents
zip -r ../admin-panel-build.zip . -x "*.DS_Store*" "*.git*"

cd ..

echo "✅ Deployment package created: admin-panel-build.zip"

echo "📋 Hostinger Deployment Instructions:"
echo "1. Login to your Hostinger control panel"
echo "2. Go to File Manager"
echo "3. Navigate to public_html/admin (or create this folder)"
echo "4. Upload admin-panel-build.zip"
echo "5. Extract the zip file"
echo "6. Delete the zip file after extraction"
echo "7. Your admin panel will be available at: yourdomain.com/admin"

echo ""
echo "🔧 Important Notes:"
echo "- Make sure your backend API URL is correct in .env.production"
echo "- Current API URL: ${REACT_APP_BACKEND_URL:-https://boult-india-bakend-new.onrender.com}"
echo "- Admin login credentials:"
echo "  Username: admin | Password: admin123"
echo "  Username: boultadmin | Password: boult2026"

echo ""
echo "🎉 Deployment package ready!"