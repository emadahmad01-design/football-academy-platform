#!/usr/bin/env node
/**
 * Seed Default Formations Script
 * Adds the 6 standard formations to the database
 * Run with: node scripts/seed-default-formations.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// Formation positions for home team (blue)
const formations = {
  '4-3-3': [
    { x: 100, y: 400, label: 'GK' },
    { x: 200, y: 150, label: 'LB' },
    { x: 200, y: 300, label: 'CB' },
    { x: 200, y: 500, label: 'CB' },
    { x: 200, y: 650, label: 'RB' },
    { x: 350, y: 200, label: 'CM' },
    { x: 350, y: 400, label: 'CM' },
    { x: 350, y: 600, label: 'CM' },
    { x: 500, y: 150, label: 'LW' },
    { x: 500, y: 400, label: 'ST' },
    { x: 500, y: 650, label: 'RW' },
  ],
  '4-4-2': [
    { x: 100, y: 400, label: 'GK' },
    { x: 200, y: 150, label: 'LB' },
    { x: 200, y: 300, label: 'CB' },
    { x: 200, y: 500, label: 'CB' },
    { x: 200, y: 650, label: 'RB' },
    { x: 350, y: 150, label: 'LM' },
    { x: 350, y: 300, label: 'CM' },
    { x: 350, y: 500, label: 'CM' },
    { x: 350, y: 650, label: 'RM' },
    { x: 500, y: 300, label: 'ST' },
    { x: 500, y: 500, label: 'ST' },
  ],
  '4-2-3-1': [
    { x: 100, y: 400, label: 'GK' },
    { x: 200, y: 150, label: 'LB' },
    { x: 200, y: 300, label: 'CB' },
    { x: 200, y: 500, label: 'CB' },
    { x: 200, y: 650, label: 'RB' },
    { x: 300, y: 300, label: 'CDM' },
    { x: 300, y: 500, label: 'CDM' },
    { x: 450, y: 150, label: 'LAM' },
    { x: 450, y: 400, label: 'CAM' },
    { x: 450, y: 650, label: 'RAM' },
    { x: 550, y: 400, label: 'ST' },
  ],
  '3-5-2': [
    { x: 100, y: 400, label: 'GK' },
    { x: 200, y: 250, label: 'CB' },
    { x: 200, y: 400, label: 'CB' },
    { x: 200, y: 550, label: 'CB' },
    { x: 350, y: 100, label: 'LWB' },
    { x: 350, y: 300, label: 'CM' },
    { x: 350, y: 400, label: 'CM' },
    { x: 350, y: 500, label: 'CM' },
    { x: 350, y: 700, label: 'RWB' },
    { x: 500, y: 300, label: 'ST' },
    { x: 500, y: 500, label: 'ST' },
  ],
  '3-4-3': [
    { x: 100, y: 400, label: 'GK' },
    { x: 200, y: 250, label: 'CB' },
    { x: 200, y: 400, label: 'CB' },
    { x: 200, y: 550, label: 'CB' },
    { x: 350, y: 150, label: 'LM' },
    { x: 350, y: 300, label: 'CM' },
    { x: 350, y: 500, label: 'CM' },
    { x: 350, y: 650, label: 'RM' },
    { x: 500, y: 200, label: 'LW' },
    { x: 500, y: 400, label: 'ST' },
    { x: 500, y: 600, label: 'RW' },
  ],
  '5-3-2': [
    { x: 100, y: 400, label: 'GK' },
    { x: 200, y: 100, label: 'LWB' },
    { x: 200, y: 250, label: 'CB' },
    { x: 200, y: 400, label: 'CB' },
    { x: 200, y: 550, label: 'CB' },
    { x: 200, y: 700, label: 'RWB' },
    { x: 380, y: 250, label: 'CM' },
    { x: 380, y: 400, label: 'CM' },
    { x: 380, y: 550, label: 'CM' },
    { x: 500, y: 300, label: 'ST' },
    { x: 500, y: 500, label: 'ST' },
  ],
};

console.log('🚀 Starting default formations seeding...\n');

try {
  // First, delete any existing default formations (to avoid duplicates)
  const defaultNames = Object.keys(formations);
  await connection.execute(
    `DELETE FROM formations WHERE name IN (?, ?, ?, ?, ?, ?) AND isTemplate = 1`,
    defaultNames
  );
  console.log('✅ Cleared existing default formations');
  
  // Insert each default formation
  for (const [name, players] of Object.entries(formations)) {
    const positions = JSON.stringify({
      homeFormation: name,
      awayFormation: '',
      homePlayers: players.map((p, index) => ({
        id: `home-${index}`,
        x: p.x,
        y: p.y,
        label: p.label,
        team: 'home',
        number: index + 1
      })),
      awayPlayers: [],
      drawings: []
    });
    
    await connection.execute(
      `INSERT INTO formations (name, templateName, description, positions, isTemplate, createdBy, createdAt) 
       VALUES (?, ?, ?, ?, 1, 1, NOW())`,
      [name, name, `Default ${name} formation`, positions]
    );
    console.log(`✅ Added formation: ${name}`);
  }
  
  console.log('\n🎉 All default formations seeded successfully!');
  
} catch (error) {
  console.error('❌ Error seeding formations:', error);
} finally {
  await connection.end();
}
