import { parseCSVRow, parseCsvContent } from '@/features/riddle-mcq/modals/csv-parser';

describe('parseCSVRow', () => {
  it('splits on commas', () => {
    expect(parseCSVRow('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('ignores commas inside double quotes', () => {
    expect(parseCSVRow('"has, comma",b')).toEqual(['has, comma', 'b']);
  });

  it('trims surrounding whitespace of each cell', () => {
    expect(parseCSVRow(' a , b ')).toEqual(['a', 'b']);
  });

  it('keeps empty cells', () => {
    expect(parseCSVRow('a,,c')).toEqual(['a', '', 'c']);
  });
});

describe('parseCsvContent', () => {
  const header =
    'question,optiona,optionb,optionc,optiond,answer,level,subject,hint,explanation,status';

  it('returns empty result for content without enough lines', () => {
    expect(parseCsvContent('')).toEqual({ riddles: [], categoryName: '' });
    expect(parseCsvContent(header)).toEqual({ riddles: [], categoryName: '' });
  });

  it('reads the category from the "# Category:" banner', () => {
    const csv = `# Category: Logic\n${header}\nWhat has keys but no locks?,keyboard,piano,map,door,B. A piano,easy,Logic,,,published\n`;
    const { categoryName, riddles } = parseCsvContent(csv);
    expect(categoryName).toBe('Logic');
    expect(riddles).toHaveLength(1);
    expect(riddles[0]!.categoryName).toBe('Logic');
  });

  it('parses "B. answer text" into correctLetter + answer and patches the option', () => {
    const csv = `${header}\nQ1,aopt,bopt,copt,dopt,"B. A piano",easy,Logic,,,published\n`;
    const { riddles } = parseCsvContent(csv);
    expect(riddles[0]).toMatchObject({
      question: 'Q1',
      options: ['aopt', 'A piano', 'copt', 'dopt'],
      correctLetter: 'B',
      answer: 'A piano',
    });
  });

  it('defaults level to easy and status to draft when absent', () => {
    const shortHeader = 'question,optiona,optionb,answer';
    const csv = `${shortHeader}\nQ1,a,b,A. first\n`;
    const { riddles } = parseCsvContent(csv);
    expect(riddles[0]).toMatchObject({ level: 'easy', status: 'draft', correctLetter: 'A' });
  });

  it('skips comment lines and rows missing a question', () => {
    const csv = `# Category: X\n${header}\n# some comment\n,optiona,optionb\nQ1,a,b,B. b\n`;
    const { riddles } = parseCsvContent(csv);
    expect(riddles).toHaveLength(1);
    expect(riddles[0]!.question).toBe('Q1');
  });

  it('handles CRLF line endings', () => {
    const csv = `# Category: Wordplay\r\n${header}\r\nQ1,a,b,B. b,easy,Wordplay,,,\r\n`;
    const { riddles } = parseCsvContent(csv);
    expect(riddles).toHaveLength(1);
    expect(riddles[0]!.categoryName).toBe('Wordplay');
  });

  it('does not patch options when the letter is out of range of provided options', () => {
    const csv = `${header}\nQ1,a,b,,,D. missing,easy,X,,\n`;
    const { riddles } = parseCsvContent(csv);
    // D (index 3) exceeds the two provided options — options stay as parsed
    expect(riddles[0]!.options).toEqual(['a', 'b']);
    expect(riddles[0]!.correctLetter).toBe('D');
  });
});
