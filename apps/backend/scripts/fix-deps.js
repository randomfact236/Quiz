const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..', '..');
const sourceDir = path.join(rootDir, 'node_modules', 'passport-google-oauth20');
const targetDir = path.join(__dirname, '..', 'node_modules', 'passport-google-oauth20');

if (fs.existsSync(sourceDir) && !fs.existsSync(targetDir)) {
  console.log('Linking passport-google-oauth20 to backend node_modules...');
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDir(sourceDir, targetDir);
  console.log('Linked passport-google-oauth20 successfully!');
} else if (!fs.existsSync(sourceDir)) {
  console.warn('passport-google-oauth20 not found in root node_modules');
}
