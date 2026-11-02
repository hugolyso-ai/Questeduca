const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

export const speakText = (text) => {
  if (!canSpeak() || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-PT'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export const stopSpeaking = () => {
  if (canSpeak()) window.speechSynthesis.cancel()
}

export const buildQuestionSpeech = (question, options) =>
  [question, ...options.map((opt, i) => `Opção ${i + 1}: ${opt}`)].join('. ')
