import { chromium } from 'playwright';

export async function scrapeXProfile(username) {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Set default timeout for the page
    page.setDefaultTimeout(10000);
    
    const url = `https://x.com/${username}`;
    console.log(`Scraping profile: ${url}`);
    
    // Try navigation with retry logic
    let retries = 2;
    while (retries > 0) {
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 45000 
        });
        break; // Success, exit retry loop
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`Navigation timeout, retrying... (${retries} attempts left)`);
        await page.waitForTimeout(2000);
      }
    }
    
    // Wait for any sign of the page loading
    try {
      await page.waitForFunction(() => {
        return document.querySelector('[data-testid="UserName"]') || 
               document.querySelector('main[role="main"]') ||
               document.querySelector('[data-testid="primaryColumn"]') ||
               document.querySelector('div[dir="ltr"]') ||
               document.title.includes('@');
      }, { timeout: 10000 });
    } catch (e) {
      console.log('Warning: Page may not have fully loaded, continuing anyway...');
    }
    
    // Small wait for dynamic content
    await page.waitForTimeout(2000);
    
    const profileData = await page.evaluate(() => {
      const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : '';
      };
      
      const getImageSrc = (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          if (element.tagName === 'IMG') {
            return element.src;
          } else {
            const img = element.querySelector('img');
            return img ? img.src : '';
          }
        }
        return '';
      };
      
      const getBgImage = (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const style = window.getComputedStyle(element);
          const bgImage = style.backgroundImage;
          if (bgImage && bgImage !== 'none') {
            const match = bgImage.match(/url\(["']?(.+?)["']?\)/);
            return match ? match[1] : '';
          }
        }
        return '';
      };
      
      const profilePicSelector = 'a[href$="/photo"] img, img[alt*="profile"], img[alt*="avatar"], div[aria-label*="profile"] img';
      const profilePic = getImageSrc(profilePicSelector);
      
      const headerSelector = 'a[href$="/header_photo"] img, div[data-testid="ProfileBanner"] img, [aria-label*="header"] img';
      let headerImage = getImageSrc(headerSelector);
      
      if (!headerImage) {
        const bgElements = document.querySelectorAll('div[style*="background-image"]');
        for (let el of bgElements) {
          const bg = getBgImage(`div[style*="background-image"]`);
          if (bg && bg.includes('profile_banners')) {
            headerImage = bg;
            break;
          }
        }
      }
      
      // Get the display name and handle
      let name = '';
      let handle = '';
      
      // Method 1: Look for UserName section which contains both
      const userNameSection = document.querySelector('[data-testid="UserName"]');
      if (userNameSection) {
        // Look for divs with dir="ltr" - the first one is usually the display name
        const ltrDivs = userNameSection.querySelectorAll('div[dir="ltr"]');
        for (let div of ltrDivs) {
          const text = div.textContent.trim();
          if (text && !text.startsWith('@') && !text.includes('Follow') && !name) {
            // Check this isn't a parent containing the handle
            const hasHandleChild = div.querySelector('span[dir="ltr"]');
            if (!hasHandleChild || !hasHandleChild.textContent.startsWith('@')) {
              name = text;
            }
          }
        }
        
        // Look for handle in spans with dir="ltr" 
        const ltrSpans = userNameSection.querySelectorAll('span[dir="ltr"]');
        for (let span of ltrSpans) {
          const text = span.textContent.trim();
          if (text.startsWith('@')) {
            handle = text;
            break;
          }
        }
      }
      
      // Method 2: Look for profile header with specific structure
      if (!name) {
        // The display name often appears in a span within specific divs
        const nameSpans = document.querySelectorAll('div[dir="auto"] span:not([dir])');
        for (let span of nameSpans) {
          const text = span.textContent.trim();
          // Check if this could be a display name (not a handle, not common UI text)
          if (text && 
              !text.startsWith('@') && 
              !text.includes('Follow') && 
              !text.includes("Don't miss") &&
              !text.includes('happening') &&
              !text.includes('Log in') &&
              !text.includes('Sign up') &&
              text.length < 50) {
            // Check if there's a handle nearby (sibling or cousin element)
            const parent = span.closest('div');
            if (parent) {
              const nearbyHandle = parent.querySelector('span[dir="ltr"]');
              if (nearbyHandle && nearbyHandle.textContent.startsWith('@')) {
                name = text;
                break;
              }
            }
          }
        }
      }
      
      // Method 3: Page title fallback
      if (!name && document.title) {
        // X.com page titles are often "Display Name (@handle) / X"
        const titleMatch = document.title.match(/^([^(@]+?)(?:\s*\(@[^)]+\))?\s*[\/|]/);
        if (titleMatch) {
          name = titleMatch[1].trim();
        }
      }
      
      // Get handle if we haven't found it yet
      if (!handle) {
        const handleElement = Array.from(document.querySelectorAll('span[dir="ltr"]')).find(el => {
          const text = el.textContent.trim();
          return text.startsWith('@') && text.length > 1;
        });
        handle = handleElement ? handleElement.textContent.trim() : '@' + window.location.pathname.split('/')[1];
      }
      
      const descElement = document.querySelector('[data-testid="UserDescription"], [data-testid="UserBio"], div[dir="auto"][style*="line-height"]');
      const description = descElement ? descElement.textContent.trim() : '';
      
      const locationElement = document.querySelector('[data-testid="UserLocation"] span, span[aria-label*="location"], svg[aria-label*="Location"] + span');
      const location = locationElement ? locationElement.textContent.trim() : '';
      
      const websiteElement = document.querySelector('[data-testid="UserUrl"] a, a[href^="http"]:not([href*="x.com"]):not([href*="twitter.com"])');
      const website = websiteElement ? websiteElement.textContent.trim() : '';
      
      const joinDateElement = document.querySelector('[data-testid="UserJoinDate"] span, span[aria-label*="Joined"], svg[aria-label*="Calendar"] + span');
      const joinDate = joinDateElement ? joinDateElement.textContent.replace('Joined ', '').trim() : '';
      
      return {
        name,
        handle,
        description,
        location,
        website,
        joinDate,
        profilePic,
        headerImage
      };
    });
    
    if (profileData.profilePic) {
      const profilePicBuffer = await page.goto(profileData.profilePic);
      if (profilePicBuffer.ok()) {
        profileData.profilePicBuffer = await profilePicBuffer.body();
      }
    }
    
    if (profileData.headerImage) {
      const headerBuffer = await page.goto(profileData.headerImage);
      if (headerBuffer.ok()) {
        profileData.headerImageBuffer = await headerBuffer.body();
      }
    }
    
    return profileData;
    
  } finally {
    await browser.close();
  }
}