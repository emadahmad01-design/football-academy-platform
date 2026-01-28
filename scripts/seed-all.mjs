#!/usr/bin/env node
/**
 * Master Seed Script - Run All Seeding Scripts
 * Populates all database tables with sample data
 * Run with: node scripts/seed-all.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scripts = [
  { name: 'Core Tables', file: 'seed-all-tables.mjs' },
  { name: 'Advanced Features', file: 'seed-advanced-tables.mjs' },
  { name: 'Match & Analytics Data', file: 'seed-match-data.mjs' }
];

console.log('🚀 Starting master seeding process...\n');
console.log('═'.repeat(60));

async function runScript(scriptPath, scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Running: ${scriptName}`);
    console.log('─'.repeat(60));
    
    const process = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${scriptName} failed with code ${code}`);
        reject(new Error(`Script failed: ${scriptName}`));
      }
    });

    process.on('error', (err) => {
      console.error(`❌ Error running ${scriptName}:`, err);
      reject(err);
    });
  });
}

async function main() {
  const startTime = Date.now();
  
  try {
    for (const script of scripts) {
      const scriptPath = join(__dirname, script.file);
      await runScript(scriptPath, script.name);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ ALL SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log(`\n⏱️  Total time: ${duration} seconds`);
    console.log('\n📊 Database Summary:');
    console.log('   • Core tables: Membership plans, locations, rewards, drills');
    console.log('   • Player data: Points, skills, performance, achievements');
    console.log('   • Training: Courses, laws, availability, feedback');
    console.log('   • Matches: Statistics, xG/xA, GPS data, formations');
    console.log('   • Health: Injuries, meal plans, nutrition logs');
    console.log('   • Engagement: Events, notifications, attendance');
    console.log('\n📖 See DATABASE_SEEDING_SUMMARY.md for full details');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Seeding process failed:', error.message);
    process.exit(1);
  }
}

main();
