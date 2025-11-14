// shopify-search-tab.js
const puppeteer = require('puppeteer');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

// Load your service account credentials
const CREDENTIALS = require('./credentials.json');
const SPREADSHEET_ID = '1IpVON7M0huaIehJr1zKD5UPOoCthdZGy71sDi11eENU';

// Updated function to include app link
async function saveToGoogleSheet(letter, appName, launchDate, rating, totalReviews, appLink) {
  try {
    const serviceAccountAuth = new JWT({
      email: CREDENTIALS.client_email,
      key: CREDENTIALS.private_key.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    
    await doc.loadInfo();
    
    let sheet = doc.sheetsByIndex[0];
    
    // Load existing headers
    await sheet.loadHeaderRow();
    
    // Check if headers exist
    if (!sheet.headerValues || sheet.headerValues.length === 0) {
      // Create new headers if none exist
      await sheet.setHeaderRow(['Search Letter', 'App Name', 'Launch Date', 'Rating', 'Total Reviews', 'App Link']);
      console.log('📝 Header row created with all columns including App Link');
    } else if (!sheet.headerValues.includes('App Link')) {
      // If headers exist but don't include 'App Link', we need to update them
      console.log('📝 Updating headers to include App Link column...');
      await sheet.setHeaderRow([...sheet.headerValues, 'App Link']);
      console.log('✅ App Link column added to headers');
    }
    
    // Reload headers after potential update
    await sheet.loadHeaderRow();
    
    // Add row with all data including app link
    const newRow = await sheet.addRow({
      'Search Letter': letter,
      'App Name': appName,
      'Launch Date': launchDate,
      'Rating': rating || 'N/A',
      'Total Reviews': totalReviews || 'N/A',
      'App Link': appLink || 'N/A'
    });
    
    console.log(`✅ Saved to Google Sheet: ${appName} - ${appLink}`);
  } catch (error) {
    console.error('❌ Error saving to Google Sheet:', error.message);
    console.error('Full error:', error);
  }
}

async function openShopifyAppStore() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    protocolTimeout: 240000,
    args: [
      '--start-maximized', 
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer'
    ]
  });

  const pages = await browser.pages();
  const page = pages[0];

  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);

  page.on('console', msg => {
    if (msg.text().includes('===') || msg.text().includes('Found')) {
      console.log('🖥️ Browser:', msg.text());
    }
  });

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120 Safari/537.36'
  );

  console.log('Opening Shopify App Store...');
  await page.goto('https://apps.shopify.com/', {
    waitUntil: 'networkidle2',
    timeout: 120000
  });

  console.log('✅ Shopify App Store opened.');

  let totalApps2025Found = 0;

  // Loop through alphabet from A to Z
  for (let charCode = 66; charCode <= 90; charCode++) {
    const letter = String.fromCharCode(charCode);
    console.log(`\n\n==================== SEARCHING FOR: ${letter} ====================`);

    await page.goto('https://apps.shopify.com/', {
      waitUntil: 'networkidle2',
      timeout: 120000
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      await page.waitForSelector('input[type="search"], input[name="q"]', { 
        visible: true,
        timeout: 30000 
      });
    } catch (error) {
      console.log(`⚠️ Search box not found for letter ${letter}, retrying...`);
      await page.reload({ waitUntil: 'networkidle2' });
      await page.waitForSelector('input[type="search"], input[name="q"]', { visible: true });
    }
    
    await page.evaluate(() => {
      const searchBox = document.querySelector('input[type="search"], input[name="q"]');
      if (searchBox) searchBox.value = '';
    });

    await page.type('input[type="search"], input[name="q"]', letter, { delay: 100 });
    
    console.log(`🔍 Typed "${letter}" in search bar...`);

    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 })
    ]);

    console.log(`✨ Search results loaded for "${letter}"!`);

    let apps2025FoundForLetter = 0;
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(`\n--- Page ${currentPage} for letter "${letter}" ---`);

      try {
        await page.waitForSelector('div[data-app-card-target="wrapper"]', { 
          visible: true, 
          timeout: 30000 
        });
      } catch (error) {
        console.log(`⚠️ No apps found on page ${currentPage}, moving to next letter`);
        break;
      }

      let appIndex = 0;
      let appCards = await page.$$('div[data-app-card-target="wrapper"]');
      
      console.log(`📱 Found ${appCards.length} apps on page ${currentPage}`);

      while (appIndex < appCards.length) {
        console.log(`\n🔍 Checking app ${appIndex + 1} of ${appCards.length}...`);

        // Variable to store app link
        let appLink = '';

        try {
          appCards = await page.$$('div[data-app-card-target="wrapper"]');
          
          if (appIndex >= appCards.length) break;

          const appCard = appCards[appIndex];
          
          await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), appCard);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await appCard.click();

          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });
          console.log('✅ App page opened');

          // Capture the current page URL
          appLink = page.url();
          console.log(`🔗 App Link captured: ${appLink}`);

          for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(resolve => setTimeout(resolve, 600));
          }

          await new Promise(resolve => setTimeout(resolve, 1500));

          const appData = await page.evaluate(() => {
            const appNameElement = document.querySelector('h1');
            const appName = appNameElement ? appNameElement.textContent.trim() : 'Unknown';

            let launchDate = null;
            
            const allParagraphs = Array.from(document.querySelectorAll('p'));
            const launchedIndex = allParagraphs.findIndex(p => p.textContent.trim() === 'Launched');
            
            if (launchedIndex !== -1 && launchedIndex < allParagraphs.length - 1) {
              const nextP = allParagraphs[launchedIndex + 1];
              if (nextP && nextP.classList.contains('tw-text-fg-secondary')) {
                launchDate = nextP.textContent.trim();
              }
            }
            
            if (!launchDate) {
              const gridDivs = Array.from(document.querySelectorAll('div.tw-grid'));
              const launchedGrid = gridDivs.find(div => {
                const paragraphs = div.querySelectorAll('p');
                return Array.from(paragraphs).some(p => p.textContent.trim() === 'Launched');
              });
              
              if (launchedGrid) {
                const dateParagraph = launchedGrid.querySelector('p.tw-text-fg-secondary');
                if (dateParagraph) {
                  launchDate = dateParagraph.textContent.trim();
                }
              }
            }

            const dtElements = Array.from(document.querySelectorAll('dt'));
            const ratingDt = dtElements.find(dt => dt.textContent.trim() === 'Rating');
            
            let rating = null;
            let totalReviews = null;
            if (ratingDt) {
              const parentDiv = ratingDt.closest('div');
              if (parentDiv) {
                const ddElement = parentDiv.querySelector('dd');
                
                if (ddElement) {
                  const ratingSpan = ddElement.querySelector('span.tw-text-fg-secondary');
                  rating = ratingSpan ? ratingSpan.textContent.trim() : null;
                  
                  const reviewLink = ddElement.querySelector('a[aria-label*="Reviews"]');
                  if (reviewLink) {
                    const ariaLabel = reviewLink.getAttribute('aria-label');
                    const match = ariaLabel.match(/(\d+)\s+Reviews?/i);
                    totalReviews = match ? match[1] : null;
                  }
                }
              }
            }

            return { appName, launchDate, rating, totalReviews };
          }).catch(error => {
            console.log('⚠️ Error extracting app data:', error.message);
            return { appName: 'Error', launchDate: null, rating: null, totalReviews: null };
          });

          console.log(`📱 App: ${appData.appName}`);
          console.log(`📅 Launch Date: ${appData.launchDate || 'Not found'}`);
          console.log(`⭐ Rating: ${appData.rating || 'Not found'} (${appData.totalReviews || 'N/A'} reviews)`);

          if (appData.launchDate && appData.launchDate.includes('2025')) {
            console.log(`✅ 🎉 App from 2025 found!`);
            console.log(`🔗 Saving with link: ${appLink}`);
            apps2025FoundForLetter++;
            totalApps2025Found++;

            // Updated to include appLink parameter
            await saveToGoogleSheet(
              letter,
              appData.appName,
              appData.launchDate,
              appData.rating,
              appData.totalReviews,
              appLink
            );

            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          await page.goBack({ waitUntil: 'networkidle2', timeout: 120000 });
          await new Promise(resolve => setTimeout(resolve, 1500));
          await page.waitForSelector('div[data-app-card-target="wrapper"]', { visible: true, timeout: 30000 });

        } catch (error) {
          console.log(`⚠️ Error processing app: ${error.message}`);
          try {
            const currentUrl = page.url();
            if (!currentUrl.includes('apps.shopify.com')) {
              await page.goto('https://apps.shopify.com/', { waitUntil: 'networkidle2' });
              break;
            }
            
            await page.goBack({ waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (backError) {
            console.log(`⚠️ Error going back: ${backError.message}`);
            break;
          }
        }

        appIndex++;
      }

      // Pagination logic
      await page.evaluate(() => {
        const paginationDiv = document.querySelector('div[data-pagination-controls]');
        if (paginationDiv) paginationDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let nextButton = await page.$('div[data-pagination-controls] a.tw-group\\/link-component[rel="next"]');
      if (!nextButton) nextButton = await page.$('a[rel="next"][aria-label="Go to Next Page"]');
      
      if (nextButton) {
        try {
          await Promise.all([
            nextButton.click(),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 })
          ]);
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 2500));
        } catch (navError) {
          console.log('⚠️ No more pages available or navigation timeout');
          hasNextPage = false;
        }
      } else {
        console.log('⚠️ Next button not found - reached last page');
        hasNextPage = false;
      }
    }

    if (apps2025FoundForLetter === 0) {
      console.log(`\n⚠️ No 2025 apps found for letter "${letter}".`);
    } else {
      console.log(`\n✅ Finished letter "${letter}" - Found ${apps2025FoundForLetter} apps from 2025`);
    }
  }

  console.log(`\n\n==================== AUTOMATION COMPLETE ====================`);
  console.log(`🎯 Total apps from 2025 found across all letters: ${totalApps2025Found}`);
  console.log(`✅ Automation stopped after completing letter Z`);
  
  await browser.close();
  console.log('✅ Browser closed!');
}

openShopifyAppStore().catch(console.error);
