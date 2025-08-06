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

export async function generateHTMLCard(profileData, outputPath = 'business_card.html') {
  const mmToPixels = (mm) => Math.round(mm * 3.779527559);
  
  const cardWidth = mmToPixels(86);
  const cardHeight = mmToPixels(54);
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(profileData.name)} - Business Card</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      margin: 20px;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f5f8fa;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    
    .instructions {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      max-width: 600px;
    }
    
    .instructions h1 {
      color: #14171a;
      margin-bottom: 10px;
      font-size: 24px;
    }
    
    .instructions p {
      color: #657786;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .instructions strong {
      color: #14171a;
    }
    
    .business-card {
      width: ${cardWidth}px;
      height: ${cardHeight}px;
      position: relative;
      overflow: hidden;
      background: white;
      border: 1px solid #e1e8ed;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    
    .header-image {
      width: 100%;
      height: 35%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-size: cover;
      background-position: center;
      position: relative;
    }
    
    .profile-pic {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 3px solid white;
      position: absolute;
      left: 15px;
      bottom: -30px;
      background: #e1e8ed;
      object-fit: cover;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #657786;
      font-weight: bold;
    }
    
    .content {
      padding: 35px 15px 10px 15px;
      height: 65%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .name-section {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 3px;
    }
    
    .name {
      font-size: 14px;
      font-weight: 700;
      color: #14171a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
    
    .handle {
      font-size: 11px;
      color: #657786;
      white-space: nowrap;
    }
    
    .description {
      font-size: 9px;
      color: #14171a;
      line-height: 1.3;
      margin: 5px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-grow: 1;
    }
    
    .details {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 8px;
      color: #657786;
      margin-top: auto;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .icon {
      width: 10px;
      height: 10px;
      flex-shrink: 0;
    }
    
    .x-logo {
      position: absolute;
      bottom: 8px;
      right: 10px;
      width: 16px;
      height: 16px;
      opacity: 0.3;
    }
    
    @media print {
      body {
        margin: 0;
        background: white;
      }
      
      .instructions {
        display: none;
      }
      
      .business-card {
        box-shadow: none;
        border: none;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="instructions">
    <h1>X.com Profile Business Card</h1>
    <p><strong>Profile:</strong> ${escapeHtml(profileData.name)} (${escapeHtml(profileData.handle)})</p>
    <p><strong>Card Size:</strong> 86mm × 54mm (standard business card)</p>
    <p><strong>To save as image:</strong></p>
    <p>1. Right-click on the card below and select "Save Image As..." or</p>
    <p>2. Take a screenshot of the card or</p>
    <p>3. Print to PDF and then convert to image</p>
    <p><strong>To print:</strong> Use Ctrl+P (or Cmd+P on Mac) and ensure scale is set to 100%</p>
  </div>
  
  <div class="business-card">
    <div class="header-image">
      <div class="profile-pic">${profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'}</div>
    </div>
    
    <div class="content">
      <div>
        <div class="name-section">
          <div class="name">${escapeHtml(profileData.name || 'Unknown User')}</div>
          <div class="handle">${escapeHtml(profileData.handle || '@unknown')}</div>
        </div>
        
        <div class="description">
          ${escapeHtml(profileData.description || 'No description available')}
        </div>
      </div>
      
      <div class="details">
        ${profileData.location ? `
          <div class="detail-item">
            <svg class="icon" viewBox="0 0 24 24" fill="#657786">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            ${escapeHtml(profileData.location)}
          </div>
        ` : ''}
        
        ${profileData.website ? `
          <div class="detail-item">
            <svg class="icon" viewBox="0 0 24 24" fill="#657786">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            ${escapeHtml(profileData.website)}
          </div>
        ` : ''}
        
        ${profileData.joinDate ? `
          <div class="detail-item">
            <svg class="icon" viewBox="0 0 24 24" fill="#657786">
              <path d="M7 11h2v2H7v-2zm14-5v14c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zM5 8h14V6H5v2zm14 12V10H5v10h14zm-4-7h2v-2h-2v2zm-4 0h2v-2h-2v2z"/>
            </svg>
            ${escapeHtml(profileData.joinDate)}
          </div>
        ` : ''}
      </div>
    </div>
    
    <svg class="x-logo" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  </div>
</body>
</html>`;
  
  await fs.writeFile(outputPath, html, 'utf8');
  console.log(`HTML business card saved to: ${outputPath}`);
  return outputPath;
}