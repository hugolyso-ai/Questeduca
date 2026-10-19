export const emptyQuestion = () => ({
  type: 'single',
  text: '',
  options: ['', '', '', ''],
  correct: 0,
  correctMultiple: [0],
  answerText: '',
  points: 10,
})

export function autoGrade(test, answers) {
  // devolve [{ index, percent, auto }] — percent 0..100; open questions ficam null (correção manual)
  return test.questions.map((q, i) => {
    const a = answers?.[i]
    if (q.type === 'single') {
      return { index: i, percent: a === q.correct ? 100 : 0, auto: true }
    }
    if (q.type === 'multiple') {
      const correctSet = new Set(q.correctMultiple || [])
      const chosenSet = new Set(Array.isArray(a) ? a : [])
      let right = 0
      correctSet.forEach(idx => { if (chosenSet.has(idx)) right++ })
      let wrong = 0
      chosenSet.forEach(idx => { if (!correctSet.has(idx)) wrong++ })
      const percent = Math.max(0, Math.round(100 * (right - wrong) / correctSet.size))
      return { index: i, percent, auto: true }
    }
    return { index: i, percent: null, auto: false }
  })
}

export function computedTotal(test, corrections) {
  // soma = soma(q.points * percent/100); devolve percentagem global (base 100)
  const maxSum = test.questions.reduce((s, q) => s + Number(q.points || 0), 0)
  if (!maxSum) return 0
  const sum = corrections.reduce((s, c) => {
    const q = test.questions[c.index]
    if (!q || c.percent === null || c.percent === undefined) return s
    return s + Number(q.points || 0) * (Number(c.percent) / 100)
  }, 0)
  return Math.round(100 * sum / maxSum)
}

export function canFinishCorrection(test, corrections) {
  return corrections.every(c => c.percent !== null && c.percent !== undefined) &&
    test.questions.reduce((s, q) => s + Number(q.points || 0), 0) === 100
}
