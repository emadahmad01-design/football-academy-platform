#!/usr/bin/env node
/**
 * Seed Player Match Stats
 * Populates `player_match_stats` with random but realistic data for every player.
 * Run: node scripts/seed-player-match-stats.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
console.log('Seeding player match stats...');

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

try {
  const [players] = await connection.execute('SELECT id FROM players');
  const [matches] = await connection.execute('SELECT id, teamId, matchDate FROM matches');

  if (!players.length) {
    console.log('No players found. Aborting.');
    process.exit(0);
  }
  if (!matches.length) {
    console.log('No matches found. Aborting.');
    process.exit(0);
  }

  // For each player, create between 5 and 20 match stat rows, using matches belonging to player's team when possible
  const batchSize = 200;
  let inserts = [];
  let total = 0;

  // Build a map: teamId -> match ids
  const teamMatches = {};
  for (const m of matches) {
    const t = m.teamId || 0;
    if (!teamMatches[t]) teamMatches[t] = [];
    teamMatches[t].push(m.id);
  }

  for (const p of players) {
    // choose how many matches for this player
    const count = randomInt(6, 18);
    // fetch player's team to bias match selection
    const [[playerRow]] = await connection.execute('SELECT teamId FROM players WHERE id = ? LIMIT 1', [p.id]);
    const teamId = playerRow ? playerRow.teamId : null;

    // get candidate matches
    let candidateMatches = [];
    if (teamId && teamMatches[teamId] && teamMatches[teamId].length > 0) {
      candidateMatches = teamMatches[teamId];
    } else {
      candidateMatches = matches.map(m => m.id);
    }

    // shuffle candidateMatches
    candidateMatches = candidateMatches.slice().sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, candidateMatches.length); i++) {
      const matchId = candidateMatches[i];
      // realistic metrics
      const minutesPlayed = randChoice([90, 90, 90, 75, 60, 45, 30]);
      const goals = minutesPlayed >= 60 ? randomInt(0, 2) : randomInt(0, 1);
      const assists = randomInt(0, goals <= 0 ? 1 : 1);
      const distanceCovered = Math.round((randomInt(80, 120) * 10)); // meters *10 to simulate stored value
      const sprints = randomInt(0, 12);
      const topSpeed = Math.round(randomInt(250, 360)); // stored as integer (e.g., in some setups)
      const successfulPasses = randomInt(5, 60);
      const passAccuracy = randomInt(60, 95);
      const tackles = randomInt(0, 6);
      const interceptions = randomInt(0, 5);

      // Match the actual schema columns in player_match_stats
      inserts.push([
        p.id, // playerId
        matchId, // matchId
        minutesPlayed, // minutesPlayed
        minutesPlayed >= 60, // started (simple heuristic)
        goals, // goals
        assists, // assists
        randomInt(20, 90), // touches
        (function(){ return randomInt(5,60); })(), // passes
        passAccuracy, // passAccuracy
        randomInt(0, 8), // shots
        randomInt(0, 5), // shotsOnTarget
        randomInt(0, 10), // dribbles
        randomInt(0, 8), // successfulDribbles
        tackles, // tackles
        interceptions, // interceptions
        randomInt(0, 6), // clearances
        randomInt(0, 4), // blocks
        distanceCovered, // distanceCovered
        topSpeed, // topSpeed
        sprints, // sprints
        0, // yellowCards
        0, // redCards
        0, // foulsCommitted
        0, // foulsSuffered
        randomInt(5, 9), // coachRating
        Math.round((goals * 20) + (assists * 15) + (passAccuracy / 10) + (minutesPlayed / 10)), // performanceScore
        new Date()
      ]);

      if (inserts.length >= batchSize) {
        // Build placeholders matching number of columns per row
        const placeholders = inserts.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
        const flat = inserts.flat();
        await connection.execute(
          `INSERT INTO player_match_stats (playerId, matchId, minutesPlayed, started, goals, assists, touches, passes, passAccuracy, shots, shotsOnTarget, dribbles, successfulDribbles, tackles, interceptions, clearances, blocks, distanceCovered, topSpeed, sprints, yellowCards, redCards, foulsCommitted, foulsSuffered, coachRating, performanceScore, createdAt) VALUES ${placeholders}`,
          flat
        );
        total += inserts.length;
        inserts = [];
      }
    }
  }

  if (inserts.length > 0) {
    const placeholders = inserts.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
    const flat = inserts.flat();
    await connection.execute(
      `INSERT INTO player_match_stats (playerId, matchId, minutesPlayed, started, goals, assists, touches, passes, passAccuracy, shots, shotsOnTarget, dribbles, successfulDribbles, tackles, interceptions, clearances, blocks, distanceCovered, topSpeed, sprints, yellowCards, redCards, foulsCommitted, foulsSuffered, coachRating, performanceScore, createdAt) VALUES ${placeholders}`,
      flat
    );
    total += inserts.length;
  }

  console.log(`Inserted ${total} player match stats rows.`);

} catch (err) {
  console.error('Error seeding player match stats:', err);
  process.exit(1);
} finally {
  await connection.end();
}
