import io

p = 'scripts/quiz-csv/subjects/business.js'
s = io.open(p, encoding='utf-8').read()

old1 = "rows.push({ q: `What does the economic term ${term} mean?`, correct: def, ds: distractors(defPool, def, 3), level: 'medium', chapter: 'Economics Terms' });"
new1 = old1 + "\n    rows.push({ q: 'Which economic term matches: ' + def + '?', correct: term, ds: ECON_TERMS.filter(t => t[0] !== term).slice(0, 3).map(t => t[0]), level: 'hard', chapter: 'Economics Terms' });"
assert old1 in s
s = s.replace(old1, new1)

old2 = "rows.push({ q: `In finance, what is ${term}?`, correct: def, ds: distractors(finPool, def, 3), level: 'medium', chapter: 'Finance & Markets' });"
new2 = old2 + "\n    rows.push({ q: 'Which finance term matches: ' + def + '?', correct: term, ds: FINANCE.filter(t => t[0] !== term).slice(0, 3).map(t => t[0]), level: 'hard', chapter: 'Finance & Markets' });"
assert old2 in s
s = s.replace(old2, new2)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
