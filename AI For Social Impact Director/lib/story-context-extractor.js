/**
 * Story Context Extractor
 * Extracts characters, setting, and visual style from script to maintain consistency
 */

/**
 * Extract story context from script
 * @param {string} script - The user's script
 * @returns {Object} Story context with characters, setting, and style
 */
export function extractStoryContext(script) {
  if (!script || script.trim().length < 10) {
    return getDefaultContext()
  }

  const trimmedScript = script.trim().toLowerCase()
  
  // Extract characters (look for names, pronouns, descriptions)
  const characters = extractCharacters(trimmedScript)
  
  // Extract setting/environment
  const setting = extractSetting(trimmedScript)
  
  // Extract visual style
  const visualStyle = extractVisualStyle(trimmedScript)
  
  // Extract main theme/topic
  const theme = extractTheme(trimmedScript)
  
  return {
    characters: characters.length > 0 ? characters : getDefaultContext().characters,
    setting: setting || getDefaultContext().setting,
    visualStyle: visualStyle || getDefaultContext().visualStyle,
    theme: theme || 'Sustainable Development Goals',
    summary: script.substring(0, 200)
  }
}

/**
 * Extract character information from script
 */
function extractCharacters(script) {
  const characters = []
  
  // Common name patterns
  const namePatterns = [
    /\b([A-Z][a-z]+)\b/g, // Capitalized names
    /\b(maria|aisha|ahmed|sara|ali|fatima|omar|layla|yusuf|zainab)\b/gi, // Common names
  ]
  
  const foundNames = new Set()
  
  // Find names
  for (const pattern of namePatterns) {
    const matches = script.match(pattern)
    if (matches) {
      matches.forEach(name => {
        if (name.length > 2 && name.length < 20) {
          foundNames.add(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
        }
      })
    }
  }
  
  // Extract character descriptions
  const characterKeywords = [
    'student', 'child', 'boy', 'girl', 'teacher', 'villager', 'person', 'people',
    'young', 'old', 'teenager', 'kid', 'adult', 'woman', 'man'
  ]
  
  const descriptions = []
  for (const keyword of characterKeywords) {
    if (script.includes(keyword)) {
      // Try to get context around the keyword
      const index = script.indexOf(keyword)
      const context = script.substring(Math.max(0, index - 50), Math.min(script.length, index + 100))
      descriptions.push(context.trim())
    }
  }
  
  // Build character list
  if (foundNames.size > 0) {
    Array.from(foundNames).slice(0, 3).forEach(name => {
      characters.push({
        name: name,
        description: descriptions[0] || `A character named ${name}`,
        appearance: 'Consistent appearance throughout the story'
      })
    })
  } else if (descriptions.length > 0) {
    // Use descriptions if no names found
    characters.push({
      name: 'Main Character',
      description: descriptions[0],
      appearance: 'Consistent appearance throughout the story'
    })
  }
  
  return characters
}

/**
 * Extract setting/environment from script
 */
function extractSetting(script) {
  const settingKeywords = {
    'village': ['village', 'town', 'community', 'neighborhood'],
    'school': ['school', 'classroom', 'education', 'student'],
    'ocean': ['ocean', 'sea', 'beach', 'coast', 'water'],
    'city': ['city', 'urban', 'street', 'building'],
    'nature': ['forest', 'tree', 'park', 'garden', 'nature'],
    'home': ['home', 'house', 'family', 'kitchen'],
    'desert': ['desert', 'dry', 'arid', 'sand']
  }
  
  for (const [setting, keywords] of Object.entries(settingKeywords)) {
    if (keywords.some(keyword => script.includes(keyword))) {
      return setting
    }
  }
  
  return 'community setting'
}

/**
 * Extract visual style from script
 */
function extractVisualStyle(script) {
  if (script.includes('2d') || script.includes('animation') || script.includes('cartoon')) {
    return '2D animation with bright colors, clean lines, educational style'
  }
  if (script.includes('realistic') || script.includes('live')) {
    return 'Realistic cinematic style'
  }
  if (script.includes('watercolor') || script.includes('paint')) {
    return 'Watercolor painting style'
  }
  
  // Default for SDG stories
  return '2D animation with bright colors, clean animation style, educational and inspiring'
}

/**
 * Extract main theme
 */
function extractTheme(script) {
  const themes = {
    'water': ['water', 'clean', 'drink', 'tap', 'conserve'],
    'climate': ['climate', 'weather', 'temperature', 'global warming'],
    'ocean': ['ocean', 'plastic', 'waste', 'pollution', 'sea'],
    'education': ['school', 'learn', 'teach', 'education', 'student'],
    'poverty': ['poor', 'poverty', 'hunger', 'food', 'money'],
    'health': ['health', 'doctor', 'hospital', 'medicine', 'sick']
  }
  
  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(keyword => script.includes(keyword))) {
      return theme
    }
  }
  
  return 'Sustainable Development Goals'
}

/**
 * Get default context if extraction fails
 */
function getDefaultContext() {
  return {
    characters: [
      {
        name: 'Main Character',
        description: 'A young student or community member',
        appearance: 'Consistent appearance throughout the story'
      }
    ],
    setting: 'community setting',
    visualStyle: '2D animation with bright colors, clean animation style, educational and inspiring',
    theme: 'Sustainable Development Goals',
    summary: 'A story about making positive change'
  }
}

/**
 * Build prompt with story context injection
 * @param {Object} storyContext - Story context object
 * @param {string} sceneDescription - Current scene description
 * @param {number} sceneIndex - Current scene index (1-based)
 * @param {boolean} isContinuation - Whether this is a continuation of previous scene
 * @returns {string} Enhanced prompt with context
 */
export function buildContextualPrompt(storyContext, sceneDescription, sceneIndex, isContinuation = false) {
  // Build character string
  const characterStr = storyContext.characters
    .map(char => `${char.name}${char.description ? ` (${char.description})` : ''}`)
    .join(', ')
  
  // Base prompt
  let prompt = `A 2D animation about ${storyContext.theme}. `
  
  // Add continuation instruction
  if (isContinuation) {
    prompt += `Continue the previous scene seamlessly. Same characters: ${characterStr}. Same environment: ${storyContext.setting}. Same visual style: ${storyContext.visualStyle}. No new characters. No style changes. `
  } else {
    prompt += `Characters: ${characterStr}. Environment: ${storyContext.setting}. Visual style: ${storyContext.visualStyle}. `
  }
  
  // Add scene description
  prompt += `${sceneDescription}. Bright colors, clean animation style, educational and inspiring.`
  
  return prompt
}
