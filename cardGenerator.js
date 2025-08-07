import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDescription(text) {
  if (!text) return '';
  
  // First escape HTML
  let formatted = escapeHtml(text);
  
  // Replace @ mentions with styled spans
  formatted = formatted.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  
  // Replace URLs with styled spans
  formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<span class="link">$1</span>');
  
  return formatted;
}

export async function generateBusinessCard(profileData, outputPath = 'business_card.png', theme = 'dark') {
  const mmToPixels = (mm) => Math.round(mm * 3.779527559 * 4); // 4x resolution increase
  
  const cardWidth = mmToPixels(86);
  const cardHeight = mmToPixels(54);
  
  // Determine description font size based on length
  const descriptionLength = profileData.description ? profileData.description.length : 0;
  let descriptionFontSize = 44;
  let descriptionLineClamp = 3;
  
  if (descriptionLength > 100) {
    descriptionFontSize = 32;
    descriptionLineClamp = 3;
  }
  if (descriptionLength > 140) {
    descriptionFontSize = 28;
    descriptionLineClamp = 3;
  }
  if (descriptionLength > 180) {
    descriptionFontSize = 22;
    descriptionLineClamp = 3;
  }
  if (descriptionLength > 220) {
    descriptionFontSize = 20;
    descriptionLineClamp = 3;
  }
  if (descriptionLength > 280) {
    descriptionFontSize = 18;
    descriptionLineClamp = 3;
  }
  if (descriptionLength > 350) {
    descriptionFontSize = 16;
    descriptionLineClamp = 3;
  }
  
  // Calculate total details length to determine font size
  const detailsLength = 
    (profileData.location ? profileData.location.length + 10 : 0) +
    (profileData.website ? profileData.website.length + 10 : 0) +
    (profileData.joinDate ? profileData.joinDate.length + 10 : 0);
  
  let detailsFontSize = 36;
  if (detailsLength > 60) detailsFontSize = 32;
  if (detailsLength > 80) detailsFontSize = 28;
  if (detailsLength > 100) detailsFontSize = 24;
  if (detailsLength > 120) detailsFontSize = 20;
  if (detailsLength > 140) detailsFontSize = 18;
  
  // Define color schemes
  const colors = {
    dark: {
      background: '#000000',
      profilePicBorder: '#000000',
      profilePicBg: '#1a1a1a',
      name: '#ffffff',
      handle: '#8899a6',
      description: '#e1e8ed',
      mention: '#1d9bf0',
      link: '#1d9bf0',
      details: '#8899a6',
      xLogo: '#ffffff'
    },
    light: {
      background: '#ffffff',
      profilePicBorder: '#ffffff',
      profilePicBg: '#f7f9fa',
      name: '#0f1419',
      handle: '#536471',
      description: '#0f1419',
      mention: '#1d9bf0',
      link: '#1d9bf0',
      details: '#536471',
      xLogo: '#0f1419'
    }
  };
  
  const scheme = colors[theme] || colors.dark;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: ${scheme.background};
    }
    
    .business-card {
      width: ${cardWidth}px;
      height: ${cardHeight}px;
      position: relative;
      overflow: visible;
      background: ${scheme.background};
      padding: 40px;
      display: flex;
      flex-direction: column;
    }
    
    .header-image {
      width: 100%;
      aspect-ratio: 3 / 1;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      background-size: 100% auto;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
      opacity: ${theme === 'light' ? '1' : '0.8'};
      margin-bottom: 10px;
      flex-shrink: 0;
      clip-path: inset(10px 0);
      margin-top: -10px;
    }
    
    .profile-pic {
      width: 420px;
      height: 420px;
      border-radius: 50%;
      border: 18px solid ${scheme.profilePicBorder};
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      background: ${scheme.profilePicBg};
      object-fit: cover;
      z-index: 1;
    }
    
    .content {
      padding: 0;
      padding-right: 40px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin-right: 420px;
      min-height: 0;
      position: relative;
      z-index: 10;
    }
    
    .name-section {
      margin-bottom: 16px;
    }
    
    .name {
      font-size: 56px;
      font-weight: 700;
      color: ${scheme.name};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 800px;
      margin-bottom: 4px;
    }
    
    .handle {
      font-size: 44px;
      color: ${scheme.handle};
      white-space: nowrap;
    }
    
    .description {
      font-size: ${descriptionFontSize}px;
      color: ${scheme.description};
      line-height: 1.3;
      margin: 16px 0;
      display: -webkit-box;
      -webkit-line-clamp: ${descriptionLineClamp};
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-grow: 1;
      max-height: ${descriptionFontSize * 1.3 * descriptionLineClamp}px;
    }
    
    .description .mention {
      color: ${scheme.mention};
      text-decoration: none;
      font-weight: 500;
    }
    
    .description .link {
      color: ${scheme.link};
      text-decoration: underline;
      text-decoration-color: rgba(29, 155, 240, 0.3);
      text-underline-offset: 2px;
    }
    
    .details {
      display: flex;
      flex-wrap: nowrap;
      gap: 20px;
      font-size: ${detailsFontSize}px;
      color: ${scheme.details};
      margin-top: auto;
      overflow: visible;
      position: relative;
      z-index: 20;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      flex-shrink: 0;
      position: relative;
      z-index: 21;
    }
    
    .icon {
      width: ${Math.round(detailsFontSize * 1.3)}px;
      height: ${Math.round(detailsFontSize * 1.3)}px;
      flex-shrink: 0;
    }
    
    .detail-item span {
      white-space: nowrap;
    }
    
    .x-logo {
      position: absolute;
      bottom: 40px;
      right: 40px;
      width: 64px;
      height: 64px;
      opacity: 0.4;
      color: ${scheme.xLogo};
    }
  </style>
</head>
<body>
  <div class="business-card">
    <div class="header-image" ${profileData.headerImageBuffer ? 
      `style="background-image: url('data:image/jpeg;base64,${profileData.headerImageBuffer.toString('base64')}');"` : ''}></div>
    
    ${profileData.profilePicBuffer ? 
      `<img class="profile-pic" src="data:image/jpeg;base64,${profileData.profilePicBuffer.toString('base64')}" alt="Profile">` :
      `<div class="profile-pic" style="background: ${scheme.profilePicBg};"></div>`
    }
    
    <div class="content">
      <div>
        <div class="name-section">
          <div class="name">${escapeHtml(profileData.name || 'Unknown User')}</div>
          <div class="handle">${escapeHtml(profileData.handle || '@unknown')}</div>
        </div>
        
        <div class="description">
          ${formatDescription(profileData.description || '')}
        </div>
      </div>
      
      <div class="details">
        ${profileData.location ? `
          <div class="detail-item">
            <svg class="icon" viewBox="0 0 24 24" fill="${scheme.details}">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>${escapeHtml(profileData.location)}</span>
          </div>
        ` : ''}
        
        ${profileData.website ? `
          <div class="detail-item">
            <svg class="icon" viewBox="0 0 24 24" fill="${scheme.details}">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span>${escapeHtml(profileData.website)}</span>
          </div>
        ` : ''}
        
        ${profileData.joinDate ? `
          <div class="detail-item">
            <svg class="icon" viewBox="0 0 24 24" fill="${scheme.details}">
              <path d="M7 11h2v2H7v-2zm14-5v14c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zM5 8h14V6H5v2zm14 12V10H5v10h14zm-4-7h2v-2h-2v2zm-4 0h2v-2h-2v2z"/>
            </svg>
            <span>${escapeHtml(profileData.joinDate)}</span>
          </div>
        ` : ''}
      </div>
    </div>
    
    <svg class="x-logo" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  </div>
</body>
</html>
  `;
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: cardWidth + 50, height: cardHeight + 50 });
    await page.setContent(html);
    await page.waitForTimeout(1000);
    
    const card = await page.locator('.business-card');
    await card.screenshot({ 
      path: outputPath,
      type: 'png'
    });
    
    console.log(`Business card saved to: ${outputPath}`);
    return outputPath;
    
  } finally {
    await browser.close();
  }
}