/**
 * Storyboard Generator
 * Creates storyboard from script with fallback to ensure scenes count > 0
 */

/**
 * Generate storyboard from script
 * @param {string} script - The user's script
 * @returns {Object} Storyboard with title, summary, and scenes array
 */
export function generateStoryboard(script) {
  if (!script || script.trim().length < 10) {
    // Fallback: create default storyboard
    return createFallbackStoryboard(script || '')
  }

  const trimmedScript = script.trim()
  
  // Try to extract title (first line or first sentence)
  const lines = trimmedScript.split('\n').filter(line => line.trim().length > 0)
  const title = lines[0]?.trim() || trimmedScript.split('.')[0]?.trim() || 'SDG Animation'
  
  // Create summary (first 200 characters)
  const summary = trimmedScript.substring(0, 200).trim()
  
  // Try to split script into scenes
  let scenes = []
  
  // Method 1: Split by paragraphs (double newlines)
  const paragraphs = trimmedScript.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  
  if (paragraphs.length >= 3) {
    // Use paragraphs as scenes
    scenes = paragraphs.slice(0, 7).map((para, index) => ({
      sceneNumber: index + 1,
      description: para.trim().substring(0, 300),
      duration: 9,
      visualStyle: '2D animation with bright colors'
    }))
  } else {
    // Method 2: Split by sentences
    const sentences = trimmedScript.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    if (sentences.length >= 3) {
      // Group sentences into scenes (2-3 sentences per scene)
      const sentencesPerScene = Math.ceil(sentences.length / 5) // Target 5 scenes
      for (let i = 0; i < Math.min(7, sentences.length); i += sentencesPerScene) {
        const sceneSentences = sentences.slice(i, i + sentencesPerScene)
        scenes.push({
          sceneNumber: scenes.length + 1,
          description: sceneSentences.join('. ').trim().substring(0, 300),
          duration: 9,
          visualStyle: '2D animation with bright colors'
        })
      }
    } else {
      // Method 3: Split by character count
      const chunkSize = Math.max(200, Math.floor(trimmedScript.length / 5))
      for (let i = 0; i < trimmedScript.length && scenes.length < 7; i += chunkSize) {
        scenes.push({
          sceneNumber: scenes.length + 1,
          description: trimmedScript.substring(i, i + chunkSize).trim().substring(0, 300),
          duration: 9,
          visualStyle: '2D animation with bright colors'
        })
      }
    }
  }
  
  // Ensure we have at least 1 scene (fallback if all methods fail)
  if (scenes.length === 0) {
    return createFallbackStoryboard(script)
  }
  
  // Limit to 7 scenes max
  scenes = scenes.slice(0, 7)
  
  return {
    title: title.substring(0, 100),
    summary: summary,
    scenes: scenes
  }
}

/**
 * Create fallback storyboard when script parsing fails
 * @param {string} script - The user's script (may be empty)
 * @returns {Object} Default storyboard with 5 scenes
 */
function createFallbackStoryboard(script) {
  const hasContent = script && script.trim().length > 0
  const scriptPreview = hasContent ? script.substring(0, 200) : 'A story about Sustainable Development Goals'
  
  return {
    title: 'SDG Animation',
    summary: scriptPreview,
    scenes: [
      {
        sceneNumber: 1,
        description: hasContent 
          ? `Opening scene: ${scriptPreview.substring(0, 250)}`
          : 'Scene 1: Introduction to the story and setting',
        duration: 9,
        visualStyle: '2D animation with bright colors'
      },
      {
        sceneNumber: 2,
        description: hasContent
          ? `Development: ${scriptPreview.substring(0, 250)}`
          : 'Scene 2: The problem or challenge is introduced',
        duration: 9,
        visualStyle: '2D animation with bright colors'
      },
      {
        sceneNumber: 3,
        description: hasContent
          ? `Action: ${scriptPreview.substring(0, 250)}`
          : 'Scene 3: Characters take action to solve the problem',
        duration: 9,
        visualStyle: '2D animation with bright colors'
      },
      {
        sceneNumber: 4,
        description: hasContent
          ? `Progress: ${scriptPreview.substring(0, 250)}`
          : 'Scene 4: Progress is made and positive changes occur',
        duration: 9,
        visualStyle: '2D animation with bright colors'
      },
      {
        sceneNumber: 5,
        description: hasContent
          ? `Conclusion: ${scriptPreview.substring(0, 250)}`
          : 'Scene 5: The story concludes with a hopeful message',
        duration: 9,
        visualStyle: '2D animation with bright colors'
      }
    ]
  }
}
