/**
 * Script Originality Checker
 * Analyzes scripts for human voice and originality using heuristics
 * This is a guide, not a judgment - meant to help students improve their writing
 */

export function analyzeScript(text) {
  if (!text || text.trim().length === 0) {
    return {
      score: 100,
      flags: [],
      suggestions: ['Start writing your story to see feedback!']
    }
  }

  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const charCount = text.length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let score = 100
  const flags = []
  const suggestions = []

  // 1. Check minimum length
  if (wordCount < 80) {
    score -= 20
    flags.push('Short script')
    suggestions.push(`Your story is ${wordCount} words. Try to write at least 80 words with more details, characters, and actions.`)
  } else if (wordCount < 150) {
    score -= 10
    suggestions.push('Great start! Adding more details will make your story even better.')
  }

  // 2. Detect generic/AI-like phrases
  const genericPhrases = [
    /\bin today's world\b/gi,
    /\bit is important to\b/gi,
    /\bin conclusion\b/gi,
    /\bmoreover\b/gi,
    /\bfurthermore\b/gi,
    /\badditionally\b/gi,
    /\bit should be noted that\b/gi,
    /\bas previously mentioned\b/gi,
    /\bin summary\b/gi,
    /\bto sum up\b/gi,
    /\bit is crucial\b/gi,
    /\bit is essential\b/gi,
    /\bwithout a doubt\b/gi,
    /\bit goes without saying\b/gi,
  ]

  let genericCount = 0
  genericPhrases.forEach(phrase => {
    const matches = text.match(phrase)
    if (matches) {
      genericCount += matches.length
    }
  })

  if (genericCount > 0) {
    score -= genericCount * 3
    flags.push('Generic phrases detected')
    suggestions.push(`Avoid phrases like "in today's world" or "it is important to". Use your own words and be specific!`)
  }

  // 3. Check for personal voice (I, we, my, our, me, us)
  const personalPronouns = /\b(I|we|my|our|me|us|myself|ourselves)\b/gi
  const personalMatches = text.match(personalPronouns)
  const hasPersonalVoice = personalMatches && personalMatches.length > 0

  if (!hasPersonalVoice && wordCount > 50) {
    score -= 15
    flags.push('Missing personal voice')
    suggestions.push('Add personal touches! Use "I", "we", "my", or "our" to make it feel like YOUR story.')
  }

  // 4. Check for specifics (numbers, locations, concrete actions)
  const hasNumbers = /\d+/.test(text)
  const hasLocation = /\b(in|at|on|near|by|from|to)\s+[A-Z][a-z]+/.test(text) || 
                     /\b(city|town|village|country|place|home|school|park|river|ocean|forest)\b/gi.test(text)
  const hasConcreteActions = /\b(run|walk|jump|climb|build|create|make|help|save|clean|plant|grow|learn|teach|share|work|play|sing|dance|write|read|draw|paint)\b/gi.test(text)

  let specificityScore = 0
  if (hasNumbers) specificityScore++
  if (hasLocation) specificityScore++
  if (hasConcreteActions) specificityScore++

  if (specificityScore < 2 && wordCount > 50) {
    score -= 10
    flags.push('Needs more specifics')
    suggestions.push('Add specific details: numbers ("10 trees"), locations ("in the park"), and actions ("planted seeds").')
  }

  // 5. Detect AI giveaway phrases (shouldn't appear in student scripts)
  const aiPhrases = [
    /\bas an ai\b/gi,
    /\blanguage model\b/gi,
    /\bchatgpt\b/gi,
    /\bopenai\b/gi,
    /\bassistant\b/gi,
    /\bI cannot\b/gi,
    /\bI don't have\b/gi,
  ]

  let aiPhraseCount = 0
  aiPhrases.forEach(phrase => {
    if (phrase.test(text)) {
      aiPhraseCount++
    }
  })

  if (aiPhraseCount > 0) {
    score -= 30
    flags.push('AI-like phrases detected')
    suggestions.push('Remove phrases that sound like AI responses. Write in your own voice!')
  }

  // 6. Check for repetitive structure (very long paragraphs)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const avgParagraphLength = paragraphs.length > 0 
    ? paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length 
    : text.length

  if (avgParagraphLength > 500 && paragraphs.length < 3) {
    score -= 10
    flags.push('Long paragraphs')
    suggestions.push('Break up long paragraphs! Shorter paragraphs with line breaks make stories easier to read.')
  }

  // 7. Check for variety in sentence length
  if (sentences.length > 0) {
    const avgSentenceLength = words.length / sentences.length
    if (avgSentenceLength > 25) {
      score -= 5
      suggestions.push('Mix short and long sentences for better flow!')
    }
  }

  // 8. Check for emotional words (makes it more human)
  const emotionalWords = /\b(happy|sad|excited|worried|proud|scared|brave|kind|helpful|grateful|hopeful|determined|inspired|joyful|peaceful|angry|frustrated|calm|nervous|confident)\b/gi
  const hasEmotions = emotionalWords.test(text)

  if (!hasEmotions && wordCount > 80) {
    score -= 5
    suggestions.push('Add emotions! How do your characters feel? (happy, worried, proud, etc.)')
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score))

  // Add positive feedback if score is good
  if (score >= 80) {
    suggestions.unshift('Great job! Your story has a strong personal voice.')
  } else if (score >= 60) {
    suggestions.unshift('Good start! A few improvements will make it even better.')
  }

  return {
    score: Math.round(score),
    flags,
    suggestions: suggestions.slice(0, 5) // Limit to 5 suggestions
  }
}

