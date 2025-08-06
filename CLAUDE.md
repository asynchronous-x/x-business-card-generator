# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Running the Application
- **Main script**: `npm start [username]` or `node index.js [username]` - Scrapes X.com profile and generates business card PNG
- **Interactive mode**: `npm start` - Prompts for username input
- **Setup**: `npm install && npx playwright install chromium` - Install dependencies and browser

## Architecture

This is a Node.js ES modules application that scrapes X.com profiles and generates business card images. The codebase consists of:

1. **Entry Point** (`index.js`): CLI interface that accepts username input, orchestrates the scraping and card generation process

2. **Web Scraping** (`scraper.js`): Uses Playwright to:
   - Navigate to X.com profiles with retry logic
   - Extract profile data (name, handle, bio, location, website, join date)
   - Download profile picture and header images as buffers
   - Handles multiple selector strategies for robust data extraction

3. **Card Generation** (`cardGenerator.js`): 
   - Generates business cards as PNG images using Playwright
   - Renders HTML/CSS to standard business card dimensions (86mm x 54mm)
   - Embeds profile images as base64 data URIs
   - Includes X logo watermark

4. **HTML Export** (`generateHTML.js`): Alternative output format that creates standalone HTML files with embedded styling

The application uses Playwright for both web scraping and image generation, avoiding external image processing dependencies. All profile images are fetched and embedded directly into the output to ensure the business cards are self-contained.