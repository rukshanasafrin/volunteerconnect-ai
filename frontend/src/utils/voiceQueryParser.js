// Lightweight, offline natural-language parser for the voice search feature.
// No external AI/API call needed — keeps voice search instant and free to run
// live in a demo. It pulls out a category and an open/closed intent from the
// spoken sentence, strips filler words, and leaves the rest as free-text
// search (matched against event title / org / location).
//
// Example: "find open environment events near me this weekend"
//   -> { searchText: '', category: 'environment', status: 'open' }
// Example: "beach cleanup this saturday"
//   -> { searchText: 'beach cleanup', category: 'all', status: 'all' }

export const CATEGORY_SYNONYMS = {
  environment: ['environment', 'environmental', 'green', 'climate', 'nature', 'cleanup', 'clean up', 'plantation', 'tree planting'],
  education: ['education', 'educational', 'teaching', 'teach', 'school', 'tutoring', 'tutor', 'literacy'],
  health: ['health', 'healthcare', 'medical', 'hospital', 'blood donation', 'blood drive', 'blood'],
  community: ['community', 'social', 'neighborhood', 'neighbourhood'],
  'disaster relief': ['disaster', 'relief', 'emergency', 'flood', 'rescue', 'crisis'],
  // NOTE: every key here doubles as both the detection word list AND the
  // strip list, so it must include every word that appears in the category
  // name itself (e.g. "welfare"), or that word gets left behind in the
  // cleaned search text after the category is detected.
  'animal welfare': ['animal', 'animals', 'welfare', 'pet', 'pets', 'wildlife', 'shelter'],
  other: [],
}

const STATUS_SYNONYMS = {
  open: ['open', 'available', 'active', 'still open', 'accepting volunteers'],
  closed: ['closed', 'full', 'unavailable', 'not available'],
}

// Words/phrases that carry intent (used above) or are pure filler for search —
// stripped out so what's left is a clean free-text query.
const FILLER_PHRASES = [
  'show me', 'find me', 'find', 'search for', 'search', 'look for', 'looking for',
  "i want to see", "i am looking for", "i'm looking for", 'can you find',
  'please', 'events', 'event', 'near me', 'nearby', 'around me',
  'this weekend', 'this week', 'next week', 'today', 'tomorrow', 'upcoming',
  'this saturday', 'this sunday', 'this monday', 'this tuesday', 'this wednesday',
  'this thursday', 'this friday', 'saturday', 'sunday', 'monday', 'tuesday',
  'wednesday', 'thursday', 'friday', 'drive', 'program', 'programs', 'activity',
  'activities', 'session', 'sessions', 'opportunity', 'opportunities',
]

function stripPhrases(text, phrases) {
  let result = text
  // Longer phrases first so "this weekend" is removed before a stray "this".
  ;[...phrases].sort((a, b) => b.length - a.length).forEach((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'g'), ' ')
  })
  return result
}

export function parseVoiceQuery(rawTranscript) {
  const transcript = (rawTranscript || '').toLowerCase().trim()

  let category = 'all'
  for (const [key, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some((w) => transcript.includes(w))) {
      category = key
      break
    }
  }

  let status = 'all'
  for (const [key, words] of Object.entries(STATUS_SYNONYMS)) {
    if (words.some((w) => transcript.includes(w))) {
      status = key
      break
    }
  }

  let cleaned = stripPhrases(transcript, FILLER_PHRASES)
  if (category !== 'all') cleaned = stripPhrases(cleaned, CATEGORY_SYNONYMS[category])
  if (status !== 'all') cleaned = stripPhrases(cleaned, STATUS_SYNONYMS[status])
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return { searchText: cleaned, category, status }
}
