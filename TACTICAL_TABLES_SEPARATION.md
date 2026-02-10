# Tactical Tables Separation

## Overview
Separated the `formations` and `tactical_boards` into distinct database tables with their own specific data structures and API endpoints.

## Problem
Previously, both the Formation Builder and Tactical Board were saving to the same `formations` table, causing:
- Data format conflicts (single-team array vs dual-team object)
- Parsing errors when loading formations
- Confusion between different feature types

## Solution

### Database Schema Changes

#### New Table: `tactical_boards`
```sql
CREATE TABLE tactical_boards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  homeFormation VARCHAR(20),
  awayFormation VARCHAR(20),
  homePlayers TEXT NOT NULL,      -- JSON array
  awayPlayers TEXT NOT NULL,      -- JSON array
  drawings TEXT NOT NULL,         -- JSON array
  teamId INT,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (teamId) REFERENCES teams(id),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);
```

#### Existing Table: `formations` (unchanged)
```sql
CREATE TABLE formations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  templateName VARCHAR(20),
  description TEXT,
  positions TEXT NOT NULL,        -- JSON array [{x, y, role}]
  teamId INT,
  createdBy INT NOT NULL,
  isTemplate BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

### Backend Changes

#### New Functions in `server/db.ts`:
- `createTacticalBoard(data)` - Create new tactical board
- `getTacticalBoardById(id)` - Get specific tactical board
- `getTacticalBoardsByTeam(teamId)` - Get team's tactical boards
- `getUserTacticalBoards(userId)` - Get user's tactical boards
- `updateTacticalBoard(id, data)` - Update tactical board
- `deleteTacticalBoard(id)` - Delete tactical board

#### New Router Endpoints in `server/routers.ts`:
- `tactics.saveTacticalBoard` - Now saves to `tactical_boards` table
- `tactics.getTacticalBoards` - Get user's tactical boards
- `tactics.getTacticalBoard` - Get specific tactical board
- `tactics.updateTacticalBoard` - Update tactical board
- `tactics.deleteTacticalBoard` - Delete tactical board

### Frontend Changes

#### Formation Builder (`FormationBuilder.tsx`)
- ✅ Simplified `loadTemplate()` - removed tactical board format parsing
- ✅ Now only handles formation array format: `[{x, y, role}]`
- ✅ Uses `trpc.tactics.getFormationTemplates()` for loading
- ✅ Uses `trpc.tactics.createFormation()` for saving

#### Tactical Board (`ProfessionalTacticalBoardNew.tsx`)
- ✅ Updated to use `trpc.tactics.getTacticalBoards()` instead of `getUserFormations()`
- ✅ Updated to use `trpc.tactics.deleteTacticalBoard()` for deletion
- ✅ Updated `loadFormation()` to parse new format with separate `homePlayers` and `awayPlayers` fields
- ✅ Save functionality already uses correct `saveTacticalBoard` endpoint

## Data Format Comparison

### Formation Builder Format
```json
{
  "id": 1,
  "name": "4-3-3 Attack",
  "templateName": "4-3-3",
  "positions": [
    { "x": 100, "y": 400, "role": "GK" },
    { "x": 200, "y": 200, "role": "LB" },
    ...
  ]
}
```

### Tactical Board Format
```json
{
  "id": 1,
  "name": "Match Strategy vs Team X",
  "homeFormation": "4-3-3",
  "awayFormation": "4-4-2",
  "homePlayers": [
    { "id": "home-0", "x": 100, "y": 400, "number": 1, "team": "home" },
    ...
  ],
  "awayPlayers": [
    { "id": "away-0", "x": 1100, "y": 400, "number": 1, "team": "away" },
    ...
  ],
  "drawings": [
    { "type": "arrow", "startX": 300, "startY": 400, ... },
    ...
  ]
}
```

## Migration

### Files Modified:
1. `drizzle/schema.ts` - Added `tacticalBoards` table and types
2. `drizzle/0017_nostalgic_hitman.sql` - Migration file (auto-generated)
3. `server/db.ts` - Added tactical board CRUD functions
4. `server/routers.ts` - Updated tactical endpoints
5. `client/src/pages/FormationBuilder.tsx` - Simplified loading logic
6. `client/src/pages/ProfessionalTacticalBoardNew.tsx` - Updated to use new endpoints

### Migration Steps:
1. ✅ Schema updated with new `tacticalBoards` table
2. ✅ Migration file generated
3. ⏳ Migration will apply automatically on next dev server start
4. ✅ Backend functions and routers updated
5. ✅ Frontend components updated

## Testing Checklist

### Formation Builder
- [ ] Load formation templates from database
- [ ] Edit player positions (drag and role change)
- [ ] Save new formation
- [ ] Load saved formation
- [ ] Verify saved data has correct format

### Tactical Board
- [ ] Create new tactical board with home/away teams
- [ ] Add drawings (arrows, circles, lines)
- [ ] Save tactical board
- [ ] Load saved tactical board
- [ ] Delete tactical board
- [ ] Verify formations from Formation Builder don't appear in Tactical Board list

### Data Integrity
- [ ] Formations table only contains single-team formations
- [ ] Tactical boards table only contains dual-team tactical setups
- [ ] No parsing errors when switching between features
- [ ] Both features work independently without conflicts

## Benefits

1. **Clear Separation of Concerns**: Each feature has its own optimized data structure
2. **No Format Conflicts**: Formations and tactical boards can't interfere with each other
3. **Better Query Performance**: Queries are simpler and more efficient
4. **Easier Maintenance**: Changes to one feature don't affect the other
5. **Type Safety**: Distinct TypeScript types for each table
6. **Future Extensibility**: Easy to add features specific to each table

## Notes

- Migration will auto-apply when dev server starts with `npm run dev`
- Existing formations in database remain unchanged
- New tactical board saves will go to new table
- Both features maintain backward compatibility with existing UI
