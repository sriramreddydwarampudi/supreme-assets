#!/bin/bash
# Deploy Firestore Rules to Firebase

echo "🚀 Deploying Firestore Rules..."
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if user is logged in
echo "🔐 Checking Firebase authentication..."
firebase status

echo ""
echo "📋 Rules to be deployed from: firestore.rules"
echo ""
echo "🚀 Deploying rules..."
firebase deploy --only firestore:rules

echo ""
echo "✅ Deployment complete!"
echo ""
echo "If you see 'Permission denied' errors:"
echo "1. Make sure you're logged in: firebase login"
echo "2. Make sure you're in the correct directory"
echo "3. Make sure your Firebase project is set up"
