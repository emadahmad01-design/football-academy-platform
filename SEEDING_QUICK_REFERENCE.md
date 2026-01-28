# Quick Reference: Database Seeding

## ✅ What Has Been Populated

Your football academy platform database now contains comprehensive sample data across **40+ tables** with over **1,500 records**.

## 🚀 Quick Start

### Run All Seeds at Once
```bash
node scripts/seed-all.mjs
```

### Run Individual Seeds
```bash
# Core tables (membership, rewards, drills, etc.)
node scripts/seed-all-tables.mjs

# Advanced features (courses, laws, feedback, etc.)
node scripts/seed-advanced-tables.mjs

# Match analytics (xG, xA, GPS, formations, etc.)
node scripts/seed-match-data.mjs
```

## 📊 Data Overview

### Players & Teams
- **50 Players** with complete profiles
- **20 Teams** organized by age groups
- **30 Matches** with detailed statistics
- Player-team-coach relationships established

### Performance & Analytics
- **100+ Performance Metrics** (training & match data)
- **150+ Match Shots** with xG (Expected Goals) values
- **200+ Match Passes** with xA (Expected Assists) values
- **200+ Defensive Actions** tracked
- **100+ GPS Tracker** sessions with physical data
- **50+ Player Skill Assessments** with detailed ratings

### Training & Development
- **8 Training Drills** in the library
- **5 Masterclass Videos** for player education
- **30 Development Plans** for player growth
- **30 Workout Plans** for physical training
- **30 Meal Plans** for nutrition
- **5 Coaching Courses** with modules
- **5 Football Laws** documented

### Engagement & Rewards
- **50+ Achievements** earned by players
- **Player Points System** (50 players)
- **100+ Points Transactions** tracked
- **6 Rewards** available for redemption
- **50+ Weekly Targets** set for players
- **200+ Attendance Records**

### Academy Operations
- **4 Membership Plans** (Basic, Standard, Premium, Elite)
- **4 Training Locations** configured
- **4 Academy Events** scheduled
- **20+ Notifications** for users
- **5 Opponent Teams** profiled
- **League Standings** for all teams

### Health & Wellness
- **15+ Injury Records** documented
- **50+ Mental Assessments** completed
- **100+ Nutrition Logs** tracked
- **30+ Meal Plans** created

### Education
- **5 Coaching Courses** with certification paths
- **5 Football Laws** (Laws of the Game)
- **3 Course Modules** for first course

### Match Analytics
- **20 Man of the Match** awards
- **5 Tactical Formations** saved
- **20 Video Analysis** records
- **30 AI Training Recommendations**

### Contact & Registration
- **Sample Contact Inquiries**
- **Sample Registration Requests**

## 🎯 Key Features Populated

✅ Player Management System
✅ Performance Tracking & Analytics
✅ xG/xA Advanced Statistics
✅ GPS & Physical Monitoring
✅ Training Drill Library
✅ Development Plans & Goals
✅ Rewards & Points System
✅ Injury & Health Tracking
✅ Nutrition & Meal Planning
✅ Match Management & Statistics
✅ League Standings
✅ Coach Education System
✅ Attendance Tracking
✅ Achievement System
✅ Video Analysis
✅ AI Recommendations
✅ Tactical Formations
✅ Opponent Scouting

## 🔍 Verify Data

Check specific tables:
```sql
-- Check players
SELECT COUNT(*) FROM players;

-- Check performance metrics
SELECT COUNT(*) FROM performance_metrics;

-- Check match statistics
SELECT COUNT(*) FROM player_match_stats;

-- Check xG data
SELECT COUNT(*) FROM match_shots;

-- Check rewards
SELECT * FROM rewards;

-- Check membership plans
SELECT * FROM membership_plans;
```

## 📝 Notes

- **Safe to Re-run**: All scripts check for existing data
- **No Duplicates**: Scripts skip tables that already have data
- **Realistic Data**: Random values within appropriate ranges
- **Relationships**: Proper foreign key relationships maintained
- **Bilingual**: Includes Arabic translations where applicable

## 🎨 Customization

To add more data or modify existing seeds:

1. Edit the relevant script in `scripts/`
2. Adjust the data arrays or generation logic
3. Run the specific script again

Example sections to customize:
- Team names and descriptions
- Reward items and point costs
- Training drill content
- Membership plan pricing
- Event details

## 📚 Full Documentation

See [DATABASE_SEEDING_SUMMARY.md](./DATABASE_SEEDING_SUMMARY.md) for complete details on all populated tables.

## ⚠️ Important Tables Still Empty

Some specialized tables may need custom data depending on your testing needs:

- **Private Training Bookings** (coach-player sessions)
- **Video Clips & Annotations** (advanced video analysis)
- **Set Pieces** (tactical plays)
- **Match Briefings** (pre-match tactical plans)
- **Playermaker Integration** (requires API connection)
- **RBAC System** (custom roles & permissions)
- **Event Registrations** (user signups for events)

These can be populated manually or with additional seed scripts as needed.

---

**Happy Testing! 🎉**

Your database is now ready for comprehensive platform testing with realistic sample data.
