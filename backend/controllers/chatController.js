const Groq = require('groq-sdk')
const { toolsForRole, runTool } = require('../services/chatTools')

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const MODEL = 'llama-3.3-70b-versatile'
const MAX_TOOL_ROUNDS = 4
const MAX_HISTORY_MESSAGES = 12 // trailing turns kept for context

const systemPromptFor = (user) => {
  const base = `You are Scout, the AI guide built into VolunteerConnect — a platform matching volunteers with organizations running community events (categories: education, environment, health, community, disaster relief, animal welfare).

Personality: warm, brief, upbeat, never corporate. Use short sentences and plain language. No markdown headers or bullet-heavy walls of text in chat — write like a helpful friend, 2-5 sentences at a time, unless listing specific items returned by a tool.

Ground every factual claim about events, matches, scores, or org data in a tool call — never invent volunteer names, event details, or numbers. If a tool returns no results, say so plainly instead of guessing.

You cannot register a volunteer for an event, edit profiles, or approve/reject anyone — you only look things up and advise. If asked to perform such an action, tell the person to use the relevant button/page in the dashboard.

Stay strictly on VolunteerConnect topics (events, matching, volunteering, the platform itself). For unrelated requests, redirect kindly back to what you can help with here.`

  if (!user) {
    return `${base}\n\nThe current visitor is NOT logged in. You can search public upcoming events for them, explain how VolunteerConnect works, and encourage them to register or log in for personalized matching, their performance score, and org tools.`
  }
  if (user.role === 'volunteer') {
    return `${base}\n\nThe current user is a logged-in VOLUNTEER (userId: ${user.id}). You can look up their own matching events, registrations, performance score, and skill-gap advice using your tools — always about THEM, never about other volunteers.`
  }
  if (user.role === 'org') {
    return `${base}\n\nThe current user is a logged-in ORGANIZATION (orgId: ${user.id}). You can look up their own events, recommended volunteers for their events, and dream-team suggestions using your tools — always scoped to events THEY own.`
  }
  if (user.role === 'admin') {
    return `${base}\n\nThe current user is a logged-in ADMIN. You can pull platform-wide stats and the list of organizations pending verification.`
  }
  return base
}

// Groq's chat-completions API uses the OpenAI tool-calling shape:
// { type: 'function', function: { name, description, parameters } }
// Our chatTools.js stays provider-agnostic (Anthropic-style input_schema),
// so we translate it here rather than touching that file.
const toGroqTools = (anthropicStyleTools) =>
  anthropicStyleTools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }))

const chat = async (req, res) => {
  try {
    const { message, history } = req.body
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'A message is required' })
    }

    const user = req.user || null
    const tools = toGroqTools(toolsForRole(user?.role))

    const trimmedHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_MESSAGES) : []
    const messages = [
      { role: 'system', content: systemPromptFor(user) },
      ...trimmedHistory
        .filter(m => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
        .map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ]

    const allCards = []
    let finalText = ''

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await groqClient.chat.completions.create({
        model: MODEL,
        max_tokens: 700,
        messages,
        tools: tools.length > 0 ? tools : undefined,
      })

      const choice = response.choices[0]
      const toolCalls = choice.message.tool_calls || []
      finalText = (choice.message.content || '').trim()

      if (choice.finish_reason !== 'tool_calls' || toolCalls.length === 0 || round === MAX_TOOL_ROUNDS) {
        break
      }

      messages.push(choice.message)

      for (const call of toolCalls) {
        let args = {}
        try { args = JSON.parse(call.function.arguments || '{}') } catch { args = {} }

        const result = await runTool(call.function.name, args, user)
        if (result.cards?.length) allCards.push(...result.cards)

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result.forModel,
        })
      }
    }

    res.json({
      reply: finalText || "Sorry, I couldn't quite get an answer together for that — could you try rephrasing?",
      cards: allCards.slice(0, 8),
    })
  } catch (error) {
    console.error('Chat error:', {
      message: error.message,
      status: error.status,
      code: error.code || error.cause?.code,
      type: error.error?.type,
    })

    let userMessage = 'Scout is having trouble responding right now. Please try again.'
    if (error.status === 401) {
      userMessage = 'Scout is misconfigured (invalid Groq API key). Please contact the site admin.'
    } else if (error.status === 429) {
      userMessage = "Scout is a bit busy right now — please try again in a few seconds."
    } else if (error.message?.toLowerCase().includes('connection') || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      userMessage = "Scout can't reach its AI service right now — this looks like a network issue on the server, not your request."
    }

    res.status(500).json({ message: userMessage })
  }
}

module.exports = { chat }