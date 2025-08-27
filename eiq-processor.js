module.exports = {
  generateRandomUser,
  selectRandomAnswer,
  validateResponse
};

function generateRandomUser(context, events, done) {
  const userId = Math.floor(Math.random() * 100000);
  const username = `artillery_user_${userId}`;
  
  context.vars.username = username;
  context.vars.userId = userId;
  
  return done();
}

function selectRandomAnswer(context, events, done) {
  const questions = context.vars.questions;
  if (questions && questions.length > 0) {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    if (randomQuestion.options && randomQuestion.options.length > 0) {
      context.vars.selectedAnswer = randomQuestion.options[Math.floor(Math.random() * randomQuestion.options.length)];
      context.vars.questionId = randomQuestion.id;
    }
  }
  
  return done();
}

function validateResponse(context, events, done) {
  // Custom response validation logic
  const response = context.response;
  
  if (response && response.body) {
    try {
      const body = JSON.parse(response.body);
      
      // Validate viral challenge response structure
      if (body.questions) {
        const hasUniqueIds = new Set(body.questions.map(q => q.id)).size === body.questions.length;
        if (!hasUniqueIds) {
          events.emit('error', 'Duplicate question IDs detected');
        }
        
        // Check for proper randomization
        const sequences = context.vars.previousSequences || [];
        const currentSequence = body.questions.map(q => q.id).join(',');
        
        if (sequences.includes(currentSequence)) {
          events.emit('error', 'Non-randomized question sequence detected');
        }
        
        sequences.push(currentSequence);
        context.vars.previousSequences = sequences.slice(-10); // Keep last 10 sequences
      }
      
      // Validate assessment session
      if (body.sessionId) {
        context.vars.sessionId = body.sessionId;
        
        // Ensure session IDs are unique
        const sessionIds = context.vars.sessionIds || new Set();
        if (sessionIds.has(body.sessionId)) {
          events.emit('error', 'Duplicate session ID detected');
        }
        sessionIds.add(body.sessionId);
        context.vars.sessionIds = sessionIds;
      }
      
    } catch (error) {
      events.emit('error', `Response validation failed: ${error.message}`);
    }
  }
  
  return done();
}