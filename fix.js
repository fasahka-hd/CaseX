const fs = require('fs');
const path = require('path');

const mediaDir = path.join(__dirname, 'static', 'media');

// List of missing files that the JS is trying to load
const missingFiles = [
  'logo-min.e831959903138193764e56101c32fe0d.svg',
  'logo-grey.5311b3efc232ad255b2e8befab92e41a.svg',
  'logo-min.e831959903138193764e.svg'  // already exists
];

const sourceFile = 'logo-min.e831959903138193764e.svg';

missingFiles.forEach(file => {
  const targetPath = path.join(mediaDir, file);
  const sourcePath = path.join(mediaDir, sourceFile);
  
  if (!fs.existsSync(targetPath) && fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log('Created:', file);
  }
});

console.log('Done fixing missing files!');
