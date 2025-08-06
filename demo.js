#!/usr/bin/env node

import { generateBusinessCard } from './cardGenerator.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runDemo() {
  console.log('X.com Profile Business Card Creator - DEMO MODE');
  console.log('==============================================\n');
  
  const demoProfile = {
    name: 'John Developer',
    handle: '@johndev',
    description: 'Full-stack developer | Open source enthusiast | Building cool things with code | Coffee addict ☕',
    location: 'San Francisco, CA',
    website: 'johndeveloper.com',
    joinDate: 'March 2020',
    profilePicBuffer: null,
    headerImageBuffer: null
  };
  
  console.log('Using demo profile data:');
  console.log(`Name: ${demoProfile.name}`);
  console.log(`Handle: ${demoProfile.handle}`);
  console.log(`Description: ${demoProfile.description}`);
  console.log(`Location: ${demoProfile.location}`);
  console.log(`Website: ${demoProfile.website}`);
  console.log(`Join Date: ${demoProfile.joinDate}`);
  
  const outputFilename = 'demo_business_card.png';
  const outputPath = join(process.cwd(), outputFilename);
  
  console.log('\nGenerating business card...');
  
  try {
    await generateBusinessCard(demoProfile, outputPath);
    
    console.log(`\n✅ Demo business card successfully created!`);
    console.log(`📁 Saved as: ${outputPath}`);
    console.log(`📐 Size: 86mm x 54mm (standard business card dimensions)`);
    console.log('\nTo use with real X.com profiles:');
    console.log('1. Run: npm run setup (to install browser dependencies)');
    console.log('2. Then: npm start <username>');
  } catch (error) {
    console.error('\n❌ Error generating demo card:', error.message);
  }
}

runDemo();