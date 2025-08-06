#!/usr/bin/env node

import { generateHTMLCard } from './generateHTML.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runHTMLDemo() {
  console.log('X.com Profile Business Card Creator - HTML DEMO');
  console.log('==============================================\n');
  
  const demoProfile = {
    name: 'John Developer',
    handle: '@johndev',
    description: 'Full-stack developer | Open source enthusiast | Building cool things with code | Coffee addict ☕',
    location: 'San Francisco, CA',
    website: 'johndeveloper.com',
    joinDate: 'March 2020'
  };
  
  console.log('Using demo profile data:');
  console.log(`Name: ${demoProfile.name}`);
  console.log(`Handle: ${demoProfile.handle}`);
  console.log(`Description: ${demoProfile.description}`);
  console.log(`Location: ${demoProfile.location}`);
  console.log(`Website: ${demoProfile.website}`);
  console.log(`Join Date: ${demoProfile.joinDate}`);
  
  const outputFilename = 'demo_business_card.html';
  const outputPath = join(process.cwd(), outputFilename);
  
  console.log('\nGenerating HTML business card...');
  
  try {
    await generateHTMLCard(demoProfile, outputPath);
    
    console.log(`\n✅ HTML business card successfully created!`);
    console.log(`📁 Saved as: ${outputPath}`);
    console.log(`📐 Size: 86mm x 54mm (standard business card dimensions)`);
    console.log('\n📌 Open the HTML file in your browser to view and save the card');
    console.log('   You can then right-click to save as image or print to PDF');
  } catch (error) {
    console.error('\n❌ Error generating HTML card:', error.message);
  }
}

runHTMLDemo();