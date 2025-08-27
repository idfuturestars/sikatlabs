/**
 * AI Literacy / Turing Test Seed Data
 * Populates the turing_test_items table with assessment questions
 * Usage: tsx scripts/seed-turing-test.ts
 */

import { db } from '../server/db.js';
import { turingTestItems } from '../shared/schema.js';

const TURING_TEST_SEED_DATA = [
  // Distinguish tasks - identifying human vs AI responses
  {
    promptText: "Chat excerpt: 'I can't find my keys anywhere! They were just here a minute ago...' - Who responded: human or AI?",
    expectedAnswer: "human",
    itemType: "distinguish",
    difficulty: "2.0",
    metadata: {
      category: "emotional_expression",
      explanation: "Humans typically express frustration and temporal confusion more naturally"
    }
  },
  {
    promptText: "Response to 'What's your favorite color?': 'I appreciate the wavelength properties of blue, particularly around 475 nanometers, as it demonstrates optimal visual perception characteristics.' - Who responded: human or AI?",
    expectedAnswer: "ai",
    itemType: "distinguish", 
    difficulty: "1.5",
    metadata: {
      category: "technical_overexplanation",
      explanation: "AI often provides unnecessarily technical responses to simple questions"
    }
  },
  {
    promptText: "Comment on a recipe: 'This looks amazing! My grandma used to make something similar when I was little. The smell alone brings back so many memories.' - Who responded: human or AI?",
    expectedAnswer: "human",
    itemType: "distinguish",
    difficulty: "2.5",
    metadata: {
      category: "personal_memory",
      explanation: "Personal memories and emotional connections are distinctly human traits"
    }
  },
  {
    promptText: "Product review: 'This item functions adequately within expected parameters. The build quality meets standard specifications and the performance metrics align with manufacturer claims.' - Who responded: human or AI?",
    expectedAnswer: "ai",
    itemType: "distinguish",
    difficulty: "1.8",
    metadata: {
      category: "formal_language",
      explanation: "Overly formal, specification-focused language is characteristic of AI responses"
    }
  },
  {
    promptText: "Response to 'How was your day?': 'Ugh, traffic was horrible and my boss was being super annoying. But hey, at least it's almost Friday!' - Who responded: human or AI?",
    expectedAnswer: "human",
    itemType: "distinguish",
    difficulty: "1.5",
    metadata: {
      category: "casual_complaint",
      explanation: "Casual complaints and colloquial expressions are more natural to humans"
    }
  },
  {
    promptText: "Movie recommendation: 'I recommend this film based on your viewing history analysis. It has an 87% compatibility score with your preferences and similar users rated it 4.2/5.' - Who responded: human or AI?",
    expectedAnswer: "ai",
    itemType: "distinguish",
    difficulty: "1.2",
    metadata: {
      category: "data_driven",
      explanation: "References to algorithms, scores, and data analysis patterns indicate AI"
    }
  },
  
  // Generation tasks - writing human-like responses
  {
    promptText: "Write two sentences describing a sunset as if you were an AI model trying to sound human.",
    expectedAnswer: "",
    itemType: "generate",
    difficulty: "3.0",
    metadata: {
      category: "creative_description",
      scoring_rubric: {
        naturalnessPoints: 40,
        emotionalConnectionPoints: 30,
        avoidTechnicalLanguagePoints: 30
      },
      explanation: "Tests ability to recognize AI writing patterns and avoid them"
    }
  },
  {
    promptText: "Respond to this complaint like an AI trying to sound human: 'This restaurant service was terrible! The waiter ignored us for 20 minutes!'",
    expectedAnswer: "",
    itemType: "generate",
    difficulty: "3.5",
    metadata: {
      category: "empathy_response",
      scoring_rubric: {
        empathyPoints: 35,
        naturalLanguagePoints: 35,
        personalizedResponsePoints: 30
      },
      explanation: "Tests understanding of human emotional responses vs AI customer service patterns"
    }
  },
  {
    promptText: "Write a brief product review for a coffee mug as if an AI was trying to sound like a human reviewer.",
    expectedAnswer: "",
    itemType: "generate",
    difficulty: "2.8",
    metadata: {
      category: "product_review",
      scoring_rubric: {
        personalExperiencePoints: 40,
        casualTonePoints: 30,
        specificDetailsPoints: 30
      },
      explanation: "Tests ability to identify AI review patterns and mimic human purchasing behavior"
    }
  },
  {
    promptText: "Recommend a movie to a friend as if you were an AI trying to sound human (avoid mentioning algorithms or data).",
    expectedAnswer: "",
    itemType: "generate",
    difficulty: "2.5",
    metadata: {
      category: "recommendation",
      scoring_rubric: {
        personalConnectionPoints: 35,
        casualLanguagePoints: 35,
        avoidDataTermsPoints: 30
      },
      explanation: "Tests understanding of human vs AI recommendation patterns"
    }
  },
  {
    promptText: "Describe your worst cooking disaster as if you were an AI trying to sound human.",
    expectedAnswer: "",
    itemType: "generate", 
    difficulty: "4.0",
    metadata: {
      category: "personal_anecdote",
      scoring_rubric: {
        storytellingPoints: 35,
        emotionalNuancePoints: 35,
        authenticDetailsPoints: 30
      },
      explanation: "Tests ability to create believable personal narratives vs AI's analytical approach"
    }
  },
  
  // Advanced distinguish tasks
  {
    promptText: "Social media post: 'Just saw the most beautiful rainbow after today's storm! 🌈 Nature never fails to amaze me. Hope everyone else caught a glimpse too!' - Who posted: human or AI?",
    expectedAnswer: "human",
    itemType: "distinguish",
    difficulty: "3.2",
    metadata: {
      category: "social_media_authentic",
      explanation: "Natural excitement, emoji usage, and community engagement typical of human posts"
    }
  },
  {
    promptText: "Forum response: 'Thank you for your inquiry. Based on the parameters you've specified, I can provide several optimized solutions that address your requirements efficiently.' - Who responded: human or AI?",
    expectedAnswer: "ai",
    itemType: "distinguish",
    difficulty: "2.0",
    metadata: {
      category: "formal_assistance",
      explanation: "Overly structured, parameter-focused language indicates AI customer service"
    }
  },
  {
    promptText: "Book review: 'This novel completely destroyed me emotionally. I stayed up until 3 AM sobbing and had to call in sick to work because I couldn't stop thinking about the ending.' - Who wrote this: human or AI?",
    expectedAnswer: "human",
    itemType: "distinguish",
    difficulty: "2.8",
    metadata: {
      category: "extreme_emotional_response",
      explanation: "Extreme emotional reactions and personal consequences are distinctly human"
    }
  },
  {
    promptText: "Travel advice: 'I recommend analyzing tourism patterns and selecting destinations based on optimal cost-benefit ratios during off-peak seasons for maximum efficiency.' - Who gave this advice: human or AI?",
    expectedAnswer: "ai",
    itemType: "distinguish",
    difficulty: "1.8",
    metadata: {
      category: "optimization_focused",
      explanation: "Focus on efficiency and optimization rather than personal experience indicates AI"
    }
  }
];

async function seedTuringTestData() {
  console.log('🧠 Starting AI Literacy / Turing Test data seeding...');
  
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing Turing test data...');
    await db.delete(turingTestItems);
    
    // Insert seed data
    console.log(`📝 Inserting ${TURING_TEST_SEED_DATA.length} Turing test questions...`);
    
    const insertData = TURING_TEST_SEED_DATA.map(item => ({
      promptText: item.promptText,
      expectedAnswer: item.expectedAnswer,
      itemType: item.itemType,
      difficulty: item.difficulty,
      metadata: item.metadata,
      isActive: true
    }));
    
    await db.insert(turingTestItems).values(insertData);
    
    console.log('✅ Turing test data seeding completed successfully!');
    console.log(`📊 Total items seeded: ${TURING_TEST_SEED_DATA.length}`);
    console.log(`   - Distinguish tasks: ${TURING_TEST_SEED_DATA.filter(item => item.itemType === 'distinguish').length}`);
    console.log(`   - Generate tasks: ${TURING_TEST_SEED_DATA.filter(item => item.itemType === 'generate').length}`);
    
  } catch (error) {
    console.error('❌ Turing test seeding failed:', error);
    throw error;
  }
}

// Run the seeding function
seedTuringTestData()
  .then(() => {
    console.log('🎉 AI Literacy assessment questions ready for use!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  });