const fs = require('fs');
const path = require('path');

// 复制目录的递归函数
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source directory ${src} does not exist, skipping...`);
    return;
  }
  
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

console.log('Copying static files for standalone build...');

// 复制 .next/static 到 .next/standalone/.next/static
// （public 目录由 Next 构建时自动复制到 standalone 输出，无需手动处理）
copyDir('.next/static', '.next/standalone/.next/static');
console.log('✓ Copied .next/static');

console.log('Standalone build is ready!');
