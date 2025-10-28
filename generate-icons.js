#!/usr/bin/env node
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 创建渐变背景
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // 绘制搜索图标（圆形放大镜）
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  
  const centerX = size * 0.4;
  const centerY = size * 0.4;
  const radius = size * 0.2;
  
  // 圆形
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // 手柄
  const handleStartX = centerX + radius * 0.7;
  const handleStartY = centerY + radius * 0.7;
  ctx.beginPath();
  ctx.moveTo(handleStartX, handleStartY);
  ctx.lineTo(size * 0.75, size * 0.75);
  ctx.stroke();
  
  // 保存图标
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`✓ Generated ${filename}`);
}

// 生成所有图标
createIcon(128, 'icon128.png');
createIcon(48, 'icon48.png');
createIcon(16, 'icon16.png');

console.log('\n🎉 All icons generated successfully!');
