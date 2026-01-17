// AI Prompts organized by age groups
// This file can be easily updated with prompts later

export const aiPromptsByAge = {
  // Ages 10-12
  '10-12': [
    // Prompts will be added here later
    // Example structure:
    // {
    //   title: "Prompt Title",
    //   description: "What this prompt helps with",
    //   prompt: "The actual AI prompt text"
    // }
  ],
  
  // Ages 13-14
  '13-14': [
    // Prompts will be added here later
  ],
  
  // Ages 15-17
  '15-17': [
    // Prompts will be added here later
  ],
}

// Helper function to get age group from age
export function getAgeGroup(age) {
  if (!age) return 'default'
  
  const ageNum = parseInt(age)
  if (isNaN(ageNum)) return 'default'
  
  if (ageNum >= 10 && ageNum <= 12) return '10-12'
  if (ageNum >= 13 && ageNum <= 14) return '13-14'
  if (ageNum >= 15 && ageNum <= 17) return '15-17'
  
  return 'default'
}

// Default prompts if age doesn't match any group
export const defaultPrompts = [
  // Default prompts will be added here later
]

