import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const htmlInputPath = path.join(__dirname, '../public/IPP Project (2).html');
const htmlOutputPath = path.join(__dirname, '../public/IPP Project (2).mobile.html');
const publicDir = path.join(__dirname, '../public');

// Read HTML file
let htmlContent = fs.readFileSync(htmlInputPath, 'utf-8');

// Function to convert image to Base64
function imageToBase64(imagePath) {
  try {
    const fullPath = path.resolve(publicDir, imagePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Image not found: ${fullPath}`);
      return null;
    }
    const imageBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(imagePath).toLowerCase().slice(1);
    const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error converting ${imagePath}:`, error.message);
    return null;
  }
}

// Find and replace <img src="...">
const imgRegex = /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi;
htmlContent = htmlContent.replace(imgRegex, (match, before, src, after) => {
  // Skip if already Base64
  if (src.startsWith('data:')) {
    return match;
  }
  
  // Clean path (remove ./ or /)
  let cleanPath = src.replace(/^\.\//, '').replace(/^\//, '');
  
  // Convert to Base64
  const base64 = imageToBase64(cleanPath);
  if (base64) {
    console.log(`✓ Embedded: ${cleanPath}`);
    return `<img${before} src="${base64}"${after}>`;
  }
  
  console.warn(`✗ Failed to embed: ${cleanPath}`);
  return match;
});

// Find and replace CSS url(...) in style attributes and <style> tags
const urlRegex = /url\(["']?([^"')]+)["']?\)/gi;
htmlContent = htmlContent.replace(urlRegex, (match, urlPath) => {
  // Skip if already Base64 or external
  if (urlPath.startsWith('data:') || urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return match;
  }
  
  // Clean path
  let cleanPath = urlPath.replace(/^\.\//, '').replace(/^\//, '');
  
  // Only process image files
  if (!/\.(png|jpg|jpeg|svg|gif|webp)$/i.test(cleanPath)) {
    return match;
  }
  
  // Convert to Base64
  const base64 = imageToBase64(cleanPath);
  if (base64) {
    console.log(`✓ Embedded CSS: ${cleanPath}`);
    return `url("${base64}")`;
  }
  
  return match;
});

// Write output file
fs.writeFileSync(htmlOutputPath, htmlContent, 'utf-8');
console.log(`\n✅ Created mobile-safe HTML: ${htmlOutputPath}`);
console.log(`📱 This file works offline on desktop, Android, and iOS!`);

