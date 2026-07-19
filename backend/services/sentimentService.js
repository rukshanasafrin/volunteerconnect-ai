const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const analyzeSentiment = async (text) => {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Analyze the sentiment of this volunteer event feedback. 
Respond ONLY with a JSON object, no extra text, no markdown.

Format:
{"sentiment":"Positive","score":95,"keywords":["organized","helpful"],"summary":"Volunteer found the event well organized"}

Feedback: "${text}"

Rules:
- sentiment must be exactly: Positive, Negative, or Neutral
- score is 0-100 (confidence percentage)
- keywords: 2-4 key words from the text
- summary: one short sentence`
        }
      ]
    })

    const raw = message.content[0].text.trim()
    const parsed = JSON.parse(raw)
    return {
      sentiment: parsed.sentiment || 'Neutral',
      score: parsed.score || 50,
      keywords: parsed.keywords || [],
      summary: parsed.summary || text.slice(0, 100),
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error.message)
    // Fallback: simple keyword-based analysis
    const lower = text.toLowerCase()
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'helpful', 'organized', 'loved', 'best', 'fantastic']
    const negativeWords = ['bad', 'poor', 'terrible', 'horrible', 'worst', 'boring', 'disorganized', 'waste', 'disappointing']
    const posCount = positiveWords.filter(w => lower.includes(w)).length
    const negCount = negativeWords.filter(w => lower.includes(w)).length
    
    if (posCount > negCount) return { sentiment: 'Positive', score: 70, keywords: [], summary: text.slice(0, 100) }
    if (negCount > posCount) return { sentiment: 'Negative', score: 70, keywords: [], summary: text.slice(0, 100) }
    return { sentiment: 'Neutral', score: 60, keywords: [], summary: text.slice(0, 100) }
  }
}

module.exports = { analyzeSentiment }