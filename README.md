# Sopify - Shopify App Store Automation

An automated web scraping tool that searches the Shopify App Store for apps launched in 2025 and saves the data to a Google Spreadsheet.

## 📋 Overview

This Node.js automation script uses Puppeteer to:
- Search the Shopify App Store for each letter of the alphabet (B-Z)
- Identify apps launched in 2025
- Extract app information including name, launch date, rating, total reviews, and app link
- Automatically save the collected data to a Google Spreadsheet

## ✨ Features

- 🔍 **Automated Search**: Searches through all letters from B to Z
- 📅 **2025 Filter**: Automatically filters apps launched in 2025
- 📊 **Data Collection**: Extracts app name, launch date, rating, reviews, and app link
- 📝 **Google Sheets Integration**: Automatically saves data to Google Spreadsheet
- 🔄 **Pagination Support**: Handles multiple pages of search results
- ⚡ **Error Handling**: Robust error handling with retry logic

## 🚀 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v14 or higher) installed on your system
- **Google Service Account** credentials with Google Sheets API access
- **Google Spreadsheet** with appropriate permissions for your service account

## 📦 Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

## ⚙️ Configuration

### 1. Google Service Account Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API** for your project
4. Create a **Service Account**:
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Fill in the details and create
5. Create a **JSON key** for the service account:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the key file

### 2. Add Credentials

1. Rename the downloaded JSON key file to `credentials.json`
2. Place it in the root directory of this project
3. **Important**: The `credentials.json` file is already in `.gitignore` to prevent accidental commits

### 3. Configure Spreadsheet

1. Create a new Google Spreadsheet or use an existing one
2. Share the spreadsheet with the service account email (found in `credentials.json` as `client_email`)
3. Give the service account **Editor** permissions
4. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
5. Update the `SPREADSHEET_ID` constant in `open-shopify-appstore.js` (line 9)

## 🎯 Usage

Run the automation script:

```bash
node open-shopify-appstore.js
```

The script will:
1. Open a browser window (headless mode is disabled for visibility)
2. Navigate to the Shopify App Store
3. Search for each letter from B to Z
4. Process all apps on each page
5. Save apps launched in 2025 to your Google Spreadsheet
6. Display progress and results in the console

## 📊 Output

The script saves data to Google Sheets with the following columns:
- **Search Letter**: The letter used to search (B-Z)
- **App Name**: Name of the Shopify app
- **Launch Date**: Date when the app was launched
- **Rating**: App rating (if available)
- **Total Reviews**: Number of reviews (if available)
- **App Link**: Direct link to the app page

## 🔧 Configuration Options

You can modify the following in `open-shopify-appstore.js`:

- **Search Range**: Change the letter range (currently B-Z) by modifying line 106
- **Spreadsheet ID**: Update line 9 with your Google Spreadsheet ID
- **Browser Settings**: Adjust Puppeteer launch options (lines 64-76) for different browser behavior

## ⚠️ Important Notes

- The script runs in **non-headless mode** by default, so you can see the browser automation
- The script includes delays to avoid overwhelming the Shopify servers
- Network timeouts are set to 120 seconds to handle slow connections
- The script automatically handles pagination and navigates through all search result pages

## 🛠️ Dependencies

- **puppeteer**: ^24.29.1 - Browser automation
- **google-spreadsheet**: ^5.0.2 - Google Sheets API integration
- **google-auth-library**: ^10.5.0 - Google authentication

## 📝 License

ISC

## 🤝 Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements.

## ⚡ Troubleshooting

### Browser doesn't open
- Ensure Puppeteer is properly installed: `npm install puppeteer`
- Check if Chrome/Chromium is available on your system

### Google Sheets API errors
- Verify your service account has access to the spreadsheet
- Check that the Google Sheets API is enabled in your Google Cloud project
- Ensure `credentials.json` is in the correct location and format

### No apps found
- The script searches for apps launched in 2025. If no apps match this criteria, none will be saved
- Check the console output for detailed progress information

