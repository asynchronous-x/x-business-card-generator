#!/usr/bin/env node

import { scrapeXProfile } from './scraper.js';
import { generateBusinessCard } from './cardGenerator.js';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function processSingleUsername(username) {
  const cleanUsername = username.replace('@', '').trim();
  
  console.log(`\nFetching profile data for @${cleanUsername}...`);
  console.log('This may take a few moments...\n');
  
  const profileData = await scrapeXProfile(cleanUsername);
  
  if (!profileData.name && !profileData.handle) {
    throw new Error('Could not fetch profile data. The profile might be private or the username might be incorrect.');
  }
  
  console.log('Profile data fetched successfully!');
  console.log(`Name: ${profileData.name || 'N/A'}`);
  console.log(`Handle: ${profileData.handle || 'N/A'}`);
  console.log(`Description: ${profileData.description ? profileData.description.substring(0, 50) + '...' : 'N/A'}`);
  console.log(`Location: ${profileData.location || 'N/A'}`);
  console.log(`Website: ${profileData.website || 'N/A'}`);
  console.log(`Join Date: ${profileData.joinDate || 'N/A'}`);
  
  return { profileData, cleanUsername };
}

async function processBatchFile(filePath) {
  try {
    // Read the file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const usernames = fileContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Remove empty lines
    
    if (usernames.length === 0) {
      console.error('No usernames found in the file!');
      return;
    }
    
    console.log(`Found ${usernames.length} username(s) to process`);
    
    // Create output folder
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputFolder = join(process.cwd(), `business_cards_${timestamp}`);
    await fs.mkdir(outputFolder, { recursive: true });
    console.log(`\nOutput folder created: ${outputFolder}`);
    
    // Process each username
    const results = { success: [], failed: [] };
    
    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      console.log(`\n[${i + 1}/${usernames.length}] Processing: ${username}`);
      console.log('='.repeat(50));
      
      try {
        const { profileData, cleanUsername } = await processSingleUsername(username);
        
        const outputFilename = `${cleanUsername}_business_card.png`;
        const outputPath = join(outputFolder, outputFilename);
        
        console.log('\nGenerating business card...');
        await generateBusinessCard(profileData, outputPath);
        
        console.log(`✅ Business card successfully created!`);
        console.log(`📁 Saved as: ${outputPath}`);
        
        results.success.push(cleanUsername);
      } catch (error) {
        console.error(`❌ Failed to process ${username}: ${error.message}`);
        results.failed.push(username);
      }
      
      // Add a small delay between requests to be respectful
      if (i < usernames.length - 1) {
        console.log('\nWaiting before next profile...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('BATCH PROCESSING COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${results.success.length} profile(s)`);
    if (results.success.length > 0) {
      console.log('   - ' + results.success.join('\n   - '));
    }
    if (results.failed.length > 0) {
      console.log(`\n❌ Failed to process: ${results.failed.length} profile(s)`);
      console.log('   - ' + results.failed.join('\n   - '));
    }
    console.log(`\n📁 All cards saved in: ${outputFolder}`);
    
  } catch (error) {
    console.error('Error reading file:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('X.com Profile Business Card Creator');
    console.log('====================================\n');
    
    const inputArg = process.argv[2];
    
    if (!inputArg) {
      // Interactive mode
      const choice = await question('Enter (1) for single username or (2) for batch file: ');
      
      if (choice === '2') {
        const filePath = await question('Enter path to .txt file with usernames: ');
        await processBatchFile(filePath);
      } else {
        const username = await question('Enter X.com username (without @): ');
        if (!username) {
          console.error('Username is required!');
          process.exit(1);
        }
        
        const { profileData, cleanUsername } = await processSingleUsername(username);
        
        const outputFilename = `${cleanUsername}_business_card.png`;
        const outputPath = join(process.cwd(), outputFilename);
        
        console.log('\nGenerating business card...');
        await generateBusinessCard(profileData, outputPath);
        
        console.log(`\n✅ Business card successfully created!`);
        console.log(`📁 Saved as: ${outputPath}`);
        console.log(`📐 Size: 86mm x 54mm (standard business card dimensions)`);
      }
    } else if (inputArg.endsWith('.txt')) {
      // Batch file mode
      await processBatchFile(inputArg);
    } else {
      // Single username mode
      const { profileData, cleanUsername } = await processSingleUsername(inputArg);
      
      const outputFilename = `${cleanUsername}_business_card.png`;
      const outputPath = join(process.cwd(), outputFilename);
      
      console.log('\nGenerating business card...');
      await generateBusinessCard(profileData, outputPath);
      
      console.log(`\n✅ Business card successfully created!`);
      console.log(`📁 Saved as: ${outputPath}`);
      console.log(`📐 Size: 86mm x 54mm (standard business card dimensions)`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nIf you continue to experience issues:');
    console.error('1. Make sure the username is correct');
    console.error('2. Check that the profile is public');
    console.error('3. For batch processing: npm start usernames.txt');
    console.error('4. For single user: npm start <username>');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();