
# Fix Imports Script
# This script uses sed to update import paths in App.jsx and potentially other files.
# It maps 'pages/xyz/File' to 'features/xyz/pages/File'.

# 1. Update App.jsx imports for features
sed -i '' 's|pages/admin/|features/admin/pages/|g' src/App.jsx
sed -i '' 's|pages/analytics/|features/analytics/pages/|g' src/App.jsx
sed -i '' 's|pages/claims/|features/claims/pages/|g' src/App.jsx
sed -i '' 's|pages/coding/|features/coding/pages/|g' src/App.jsx
sed -i '' 's|pages/collections/|features/collections/pages/|g' src/App.jsx
sed -i '' 's|pages/dashboard/|features/dashboard/pages/|g' src/App.jsx
sed -i '' 's|pages/denials/|features/denials/pages/|g' src/App.jsx
sed -i '' 's|pages/developer/|features/developer/pages/|g' src/App.jsx
sed -i '' 's|pages/evv/|features/evv/pages/|g' src/App.jsx
sed -i '' 's|pages/finance/|features/finance/pages/|g' src/App.jsx
sed -i '' 's|pages/insurance/|features/insurance/pages/|g' src/App.jsx
sed -i '' 's|pages/lida/|features/lida/pages/|g' src/App.jsx
sed -i '' 's|pages/patients/|features/patients/pages/|g' src/App.jsx
sed -i '' 's|pages/reporting/|features/reporting/pages/|g' src/App.jsx
sed -i '' 's|pages/settings/|features/settings/pages/|g' src/App.jsx

# 2. Update components imports if they moved (Core Layout)
# They were in src/components/layout, now they are still there but let's check.
# Sidebar, Header, Layout are in src/components/layout.

# 3. Check for specific relative imports inside the moved files.
# E.g. inside src/features/claims/pages/ClaimsLayout.jsx, if it imports '../../components/xyz', that depth is now different?
# src/pages/claims/ClaimsLayout.jsx (depth 3)
# src/features/claims/pages/ClaimsLayout.jsx (depth 4)
# So '../' becomes '../../'.
# This is the hard part.
# "pages/claims/X" -> "features/claims/pages/X". Depth increased by 1 ("features" added).

# Recursive find and replace for imports in JS/JSX files
find src/features -name "*.jsx" -print0 | xargs -0 sed -i '' 's|\.\./\.\./components|\.\./\.\./\.\./components|g'
find src/features -name "*.jsx" -print0 | xargs -0 sed -i '' 's|\.\./\.\./data|\.\./\.\./\.\./data|g'
# If they used alias '@', it would be fine, but I don't see aliases used everywhere.

