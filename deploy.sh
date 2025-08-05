#!/usr/bin/env sh

# abort on errors
set -e

# build
echo "Building for production..."
npm run build

# navigate into the build output directory
cd dist/spa

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io/<REPO>
# git push -f git@github.com:<USERNAME>/<REPO>.git main:gh-pages

echo "Built files are ready in dist/spa"
echo "You can now push to your GitHub repository's gh-pages branch"
echo ""
echo "To deploy to GitHub Pages:"
echo "1. Create a new repository on GitHub called 'drinkcounter'"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/drinkcounter.git"
echo "3. Run: git push -u origin main"
echo "4. Run: git push -f origin \`git subtree split --prefix dist/spa main\`:gh-pages"
echo "5. Enable GitHub Pages in your repository settings, using the gh-pages branch"

cd ../../
