// Personality Assessment Types

export interface MyersBriggsResult {
  type: string; // e.g., "INTJ", "ENFP"
  confidence: number; // 0-100
  dimensions: {
    EI: 'E' | 'I'; // Extraversion vs Introversion
    SN: 'S' | 'N'; // Sensing vs Intuition  
    TF: 'T' | 'F'; // Thinking vs Feeling
    JP: 'J' | 'P'; // Judging vs Perceiving
  };
  descriptions: {
    primary: string;
    cognitive_functions: string[];
    strengths: string[];
    growth_areas: string[];
  };
}

export interface DISCResult {
  dominance: number; // 0-100
  influence: number; // 0-100
  steadiness: number; // 0-100
  conscientiousness: number; // 0-100
  primaryStyle: 'D' | 'I' | 'S' | 'C';
  adaptedStyle?: 'D' | 'I' | 'S' | 'C';
  profile_description: string;
  work_style: string[];
  communication_preferences: string[];
}

export interface OCEANResult {
  openness: number; // 0-100
  conscientiousness: number; // 0-100
  extraversion: number; // 0-100
  agreeableness: number; // 0-100
  neuroticism: number; // 0-100
  personality_summary: string;
  behavioral_tendencies: string[];
  ideal_environments: string[];
}

export interface PersonalityRecommendations {
  learningStylePrimary: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  learningStyleSecondary?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  cognitiveStrengths: string[];
  growthAreas: string[];
  studyMethods: string[];
  collaborationStyle: string[];
  motivationTriggers: string[];
  stressManagement: string[];
  compatibleFields: string[];
  roleTypes: string[];
  workEnvironments: string[];
}

export interface PersonalityAssessmentResults {
  myersBriggs: MyersBriggsResult;
  disc: DISCResult;
  ocean: OCEANResult;
  recommendations: PersonalityRecommendations;
  overall_insights: {
    dominant_traits: string[];
    compatible_personalities: string[];
    leadership_style: string;
    decision_making_style: string;
    conflict_resolution_approach: string;
  };
}

// IQ Assessment Types

export interface TraditionalIQResult {
  overall: number; // 40-160 range (Wechsler scale)
  verbal: number;
  performance: number;
  workingMemory: number;
  processingSpeed: number;
  percentile: number;
  classification: string; // e.g., "Superior", "Above Average"
}

export interface EmotionalIQResult {
  overall: number; // 0-200 range
  selfAwareness: number;
  selfManagement: number;
  socialAwareness: number;
  relationshipManagement: number;
  eq_level: string; // e.g., "High", "Very High"
}

export interface AlternativeIQResult {
  overall: number; // 0-100 range
  linguistic: number;
  logicalMathematical: number;
  spatial: number;
  musicalRhythmic: number;
  bodilyKinesthetic: number;
  interpersonal: number;
  intrapersonal: number;
  naturalistic: number;
  dominant_intelligences: string[];
}

export interface ExtendedIQResults {
  eiq: number; // 300-850 FICO-like score
  traditional: TraditionalIQResult;
  emotional: EmotionalIQResult;
  alternative: AlternativeIQResult;
  overall_insights: {
    cognitive_profile: string;
    learning_recommendations: string[];
    career_suggestions: string[];
    development_areas: string[];
  };
}

// Assessment Question Types

export interface PersonalityQuestion {
  id: string;
  type: 'myers_briggs' | 'disc' | 'ocean';
  question_text: string;
  options?: {
    A: string;
    B: string;
  };
  likert_scale?: {
    min: number;
    max: number;
    labels: string[];
  };
  dimension?: string; // EI, SN, TF, JP for MBTI
  trait?: string; // O, C, E, A, N for Big Five
}

export interface IQQuestion {
  id: string;
  type: 'traditional' | 'emotional' | 'alternative';
  domain: string; // verbal, spatial, logical, etc.
  question_text: string;
  question_format: 'multiple_choice' | 'numeric' | 'spatial' | 'scenario';
  options?: string[];
  correct_answer?: string | number;
  difficulty: number; // 1-10
  time_limit?: number; // seconds
  media?: {
    type: 'image' | 'audio' | 'video';
    url: string;
    description: string;
  };
}

export interface AssessmentSession {
  id: string;
  userId: string;
  type: 'personality' | 'iq' | 'comprehensive';
  status: 'in_progress' | 'completed' | 'expired';
  questions: (PersonalityQuestion | IQQuestion)[];
  responses: AssessmentResponse[];
  started_at: Date;
  completed_at?: Date;
  time_remaining?: number; // seconds
}

export interface AssessmentResponse {
  questionId: string;
  response: any;
  responseTime: number; // milliseconds
  timestamp: Date;
  isCorrect?: boolean;
}

// Combined Assessment Result
export interface ComprehensiveAssessmentResult {
  personality: PersonalityAssessmentResults;
  iq: ExtendedIQResults;
  integrated_insights: {
    learning_profile: string;
    optimal_study_methods: string[];
    career_path_recommendations: string[];
    personal_development_plan: string[];
    compatibility_insights: {
      ideal_team_roles: string[];
      leadership_potential: string;
      collaboration_style: string;
    };
  };
}