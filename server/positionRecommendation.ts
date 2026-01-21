/**
 * AI Position Recommendation Engine
 * Analyzes player skills and recommends optimal positions
 */

export interface PlayerSkills {
  // Physical attributes
  speed: number;          // 0-100
  agility: number;        // 0-100
  power: number;          // 0-100
  stamina: number;        // 0-100
  
  // Technical skills
  dribbling: number;      // 0-100
  firstTouch: number;     // 0-100
  passing: number;        // 0-100
  shooting: number;       // 0-100
  heading: number;        // 0-100
  tackling: number;       // 0-100
  
  // Tactical attributes
  positioning: number;    // 0-100
  vision: number;         // 0-100
  decisionMaking: number; // 0-100
  
  // Mental attributes
  composure: number;      // 0-100
  leadership: number;     // 0-100
  workRate: number;       // 0-100
  
  // Goalkeeper specific (optional)
  reflexes?: number;      // 0-100
  handling?: number;      // 0-100
  distribution?: number;  // 0-100
}

export interface PositionRecommendation {
  position: string;
  suitabilityScore: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  strengths: string[];
  improvements: string[];
}

// Position requirements (weighted attributes)
const POSITION_REQUIREMENTS = {
  GK: {
    reflexes: 0.25,
    handling: 0.20,
    positioning: 0.15,
    composure: 0.15,
    distribution: 0.10,
    heading: 0.05,
    power: 0.05,
    decisionMaking: 0.05,
  },
  CB: {
    tackling: 0.20,
    heading: 0.20,
    positioning: 0.15,
    power: 0.15,
    composure: 0.10,
    passing: 0.10,
    speed: 0.05,
    leadership: 0.05,
  },
  LB: {
    speed: 0.20,
    stamina: 0.15,
    tackling: 0.15,
    positioning: 0.15,
    passing: 0.10,
    dribbling: 0.10,
    agility: 0.10,
    workRate: 0.05,
  },
  RB: {
    speed: 0.20,
    stamina: 0.15,
    tackling: 0.15,
    positioning: 0.15,
    passing: 0.10,
    dribbling: 0.10,
    agility: 0.10,
    workRate: 0.05,
  },
  CDM: {
    tackling: 0.20,
    positioning: 0.15,
    passing: 0.15,
    stamina: 0.10,
    workRate: 0.10,
    composure: 0.10,
    decisionMaking: 0.10,
    power: 0.10,
  },
  CM: {
    passing: 0.20,
    vision: 0.15,
    stamina: 0.15,
    positioning: 0.10,
    dribbling: 0.10,
    workRate: 0.10,
    decisionMaking: 0.10,
    firstTouch: 0.10,
  },
  CAM: {
    vision: 0.20,
    passing: 0.20,
    dribbling: 0.15,
    shooting: 0.15,
    firstTouch: 0.10,
    decisionMaking: 0.10,
    agility: 0.05,
    composure: 0.05,
  },
  LW: {
    speed: 0.20,
    dribbling: 0.20,
    agility: 0.15,
    shooting: 0.15,
    firstTouch: 0.10,
    passing: 0.10,
    workRate: 0.05,
    stamina: 0.05,
  },
  RW: {
    speed: 0.20,
    dribbling: 0.20,
    agility: 0.15,
    shooting: 0.15,
    firstTouch: 0.10,
    passing: 0.10,
    workRate: 0.05,
    stamina: 0.05,
  },
  ST: {
    shooting: 0.25,
    positioning: 0.20,
    firstTouch: 0.15,
    heading: 0.10,
    power: 0.10,
    composure: 0.10,
    speed: 0.05,
    agility: 0.05,
  },
};

/**
 * Calculate suitability score for a specific position
 */
function calculatePositionScore(
  skills: PlayerSkills,
  requirements: Record<string, number>
): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [attribute, weight] of Object.entries(requirements)) {
    const skillValue = (skills as any)[attribute] || 0;
    totalScore += skillValue * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Get strengths for a position based on skills
 */
function getPositionStrengths(
  skills: PlayerSkills,
  position: string
): string[] {
  const strengths: string[] = [];
  const requirements = POSITION_REQUIREMENTS[position as keyof typeof POSITION_REQUIREMENTS];
  
  for (const [attribute, weight] of Object.entries(requirements)) {
    const skillValue = (skills as any)[attribute] || 0;
    if (weight >= 0.15 && skillValue >= 75) {
      strengths.push(attribute);
    }
  }
  
  return strengths;
}

/**
 * Get areas for improvement for a position
 */
function getPositionImprovements(
  skills: PlayerSkills,
  position: string
): string[] {
  const improvements: string[] = [];
  const requirements = POSITION_REQUIREMENTS[position as keyof typeof POSITION_REQUIREMENTS];
  
  for (const [attribute, weight] of Object.entries(requirements)) {
    const skillValue = (skills as any)[attribute] || 0;
    if (weight >= 0.15 && skillValue < 60) {
      improvements.push(attribute);
    }
  }
  
  return improvements;
}

/**
 * Recommend optimal positions for a player based on their skills
 */
export function recommendPositions(
  skills: PlayerSkills
): PositionRecommendation[] {
  const recommendations: PositionRecommendation[] = [];
  
  // Calculate scores for all positions
  for (const [position, requirements] of Object.entries(POSITION_REQUIREMENTS)) {
    const score = calculatePositionScore(skills, requirements);
    const strengths = getPositionStrengths(skills, position);
    const improvements = getPositionImprovements(skills, position);
    
    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 75 && improvements.length <= 1) {
      confidence = 'high';
    } else if (score >= 60 && improvements.length <= 2) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    recommendations.push({
      position,
      suitabilityScore: Math.round(score),
      confidence,
      strengths,
      improvements,
    });
  }
  
  // Sort by suitability score (descending)
  recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  
  return recommendations;
}

/**
 * Get top N position recommendations
 */
export function getTopPositionRecommendations(
  skills: PlayerSkills,
  topN: number = 3
): PositionRecommendation[] {
  const allRecommendations = recommendPositions(skills);
  return allRecommendations.slice(0, topN);
}

/**
 * Get position transition suggestions
 * (e.g., CM → CAM if player develops shooting and dribbling)
 */
export function getPositionTransitionSuggestions(
  currentPosition: string,
  skills: PlayerSkills
): { targetPosition: string; requiredImprovements: string[] }[] {
  const transitions: { targetPosition: string; requiredImprovements: string[] }[] = [];
  
  // Define common position transitions
  const transitionPaths: Record<string, string[]> = {
    CM: ['CAM', 'CDM'],
    CAM: ['CM', 'LW', 'RW'],
    CDM: ['CM', 'CB'],
    LB: ['LW', 'CB'],
    RB: ['RW', 'CB'],
    CB: ['CDM', 'LB', 'RB'],
    LW: ['CAM', 'ST'],
    RW: ['CAM', 'ST'],
    ST: ['CAM', 'LW', 'RW'],
  };
  
  const possibleTransitions = transitionPaths[currentPosition] || [];
  
  for (const targetPosition of possibleTransitions) {
    const improvements = getPositionImprovements(skills, targetPosition);
    if (improvements.length > 0 && improvements.length <= 3) {
      transitions.push({
        targetPosition,
        requiredImprovements: improvements,
      });
    }
  }
  
  return transitions;
}
