const pct = (n) => Math.round(n) + '%'

export function PrintTestSheet({ teacher, test, studentName = '', className = '', answers = [], corrections = null, finalGrade = null, observations = '' }) {
  const corrected = !!corrections
  return (
    <div className="print-sheet">
      <div className="ps-header">
        <div className="ps-header-left">
          <div className="ps-line"><strong>Professor(a):</strong> <span className="ps-fill">{teacher || ''}</span></div>
          <div className="ps-line"><strong>Disciplina:</strong> <span className="ps-fill">{test.discipline || ''}</span></div>
        </div>
        <div className="ps-header-right">
          <div className="ps-line"><strong>Aluno(a):</strong> <span className="ps-fill">{studentName}</span></div>
          <div className="ps-line"><strong>Turma:</strong> <span className="ps-fill">{className}</span></div>
        </div>
      </div>
      {corrected && finalGrade !== null && (
        <div className="ps-grade-box">
          <strong>Nota final:</strong> {pct(finalGrade)}
        </div>
      )}
      <h1 className="ps-title">{test.title}</h1>
      {test.intro_text && <p className="ps-intro">{test.intro_text}</p>}
      <div className="ps-meta">
        <span>{test.questions.length} perguntas · {test.total_points} pontos</span>
        <span>{test.time_limit_minutes ? `Tempo: ${test.time_limit_minutes} min` : 'Sem cronómetro'}</span>
      </div>
      <ol className="ps-questions">
        {test.questions.map((q, i) => {
          const c = corrected ? corrections.find(x => x.index === i) : null
          return (
            <li key={i} className="ps-question">
              <div className="ps-q-header">
                <span className="ps-q-text">{q.text}</span>
                <span className="ps-q-points">({q.points} pts{corrected && c ? ` — ${pct(c.percent)} = ${Math.round(q.points * c.percent / 100 * 10) / 10} pts` : ''})</span>
              </div>
              {q.type !== 'open' && q.options && (
                <ul className="ps-options">
                  {q.options.map((opt, j) => {
                    const a = answers[i]
                    const chosen = q.type === 'single' ? a === j : Array.isArray(a) && a.includes(j)
                    const right = corrected && (q.type === 'single' ? q.correct === j : (q.correct || []).includes(j))
                    return (
                      <li key={j} className={`${chosen ? 'ps-chosen' : ''} ${right ? 'ps-right' : ''}`}>
                        {String.fromCharCode(65 + j)}) {opt}
                        {chosen ? ' ✗' : ''}{right ? ' ✓' : ''}
                      </li>
                    )
                  })}
                </ul>
              )}
              {q.type === 'open' && (
                <div className="ps-open-lines">{answers[i] ? <span className="ps-open-answer">{answers[i]}</span> : <>&nbsp;</>}</div>
              )}
              {corrected && c && c.comment && (
                <div className="ps-comment"><strong>Observação:</strong> {c.comment}</div>
              )}
            </li>
          )
        })}
      </ol>
      {corrected && observations && (
        <div className="ps-observations"><strong>Observações do professor:</strong> {observations}</div>
      )}
      <div className="ps-footer">QuestEduca — {new Date().toLocaleDateString('pt-PT')}</div>
    </div>
  )
}

export function printNow() {
  window.print()
}
