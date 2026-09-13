import io

p = 'scripts/quiz-csv/subjects/business.js'
s = io.open(p, encoding='utf-8').read()

old3 = "rows.push({ q: `Which brand used the slogan ${tag}?`, correct: brand, ds: distractors(tagPool, brand, 3), level: 'medium', chapter: 'Slogans & Brands' });"
new3 = old3 + "\n    rows.push({ q: 'What is the famous slogan of ' + brand + '?', correct: tag, ds: distractors(tagPool, tag, 3), level: 'medium', chapter: 'Slogans & Brands' });"
assert old3 in s
s = s.replace(old3, new3)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
