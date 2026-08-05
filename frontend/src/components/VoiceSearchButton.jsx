import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { parseVoiceQuery } from '../utils/voiceQueryParser'

/**
 * Tap-to-speak search button, built on the browser's native SpeechRecognition
 * API (Chrome/Edge/Safari). No external API call — the transcript is parsed
 * locally by voiceQueryParser, so it works instantly and offline.
 *
 * Renders nothing if the browser doesn't support speech recognition, so it
 * degrades gracefully instead of showing a dead button.
 */
export default function VoiceSearchButton({ onParsedQuery, className = '' }) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [heard, setHeard] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setHeard(transcript)
      onParsedQuery(parseVoiceQuery(transcript), transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      recognition.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!supported) return null

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      setHeard('')
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch {
        // start() throws if called while already active; ignore.
      }
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        aria-label={listening ? 'Stop voice search' : 'Search by voice'}
        title={listening ? 'Listening... click to stop' : 'Search by voice'}
        className={`grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border transition
          ${listening
            ? 'border-red-400 bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse'
            : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'}
          ${className}`}
      >
        {listening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
      {listening && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-[11px] font-medium text-gray-400 dark:text-slate-500 z-10">
          🎙️ Listening...
        </span>
      )}
      {!listening && heard && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-[11px] font-medium text-gray-400 dark:text-slate-500 z-10">
          Heard: "{heard}"
        </span>
      )}
    </div>
  )
}