export const parseQuestions = (md) => {
  if (!md || !md.trim()) return [];

  const rawBlocks = md.split(/(?=^##)/m);
  const blocks = rawBlocks.map(b => b.trim()).filter(Boolean);

  return blocks.map((block, i) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

    const titleLine = lines.find(l => /^##/.test(l));
    const text = titleLine ? titleLine.replace(/^##\s*/, '').trim() : lines[0] || '';

    const optionLines = lines.filter(l => l.startsWith('-'));
    const options = optionLines.map(l => {
      const raw = l.replace(/^-\s*/, '');
      const clean = raw.replace(/\*+/g, '').trim();
      const isCorrect = raw.includes('*');
      return { text: clean, isCorrect };
    });

    const marksLine = lines.find(l => /^marks:\s*/i.test(l));
    const marks = marksLine ? parseInt(marksLine.replace(/^marks:\s*/i, ''), 10) : 1;

    const explanationLine = lines.find(l => /^explanation:\s*/i.test(l));
    const explanation = explanationLine ? explanationLine.replace(/^explanation:\s*/i, '').trim() : '';

    const correctIndices = [];
    options.forEach((opt, idx) => { if (opt.isCorrect) correctIndices.push(idx); });

    let type = 'single';
    if (correctIndices.length > 1) type = 'multiple';
    if (correctIndices.length === 0 && options.length > 0) correctIndices.push(0);

    const result = {
      id: i + 1,
      text,
      type,
      marks: isNaN(marks) ? 1 : marks,
      options: options.map(o => ({ text: o.text })),
      isCorrect: type === 'multiple' ? correctIndices : correctIndices[0],
    };
    if (explanation) result.explanation = explanation;
    return result;
  });
};

export const questionsToMarkdown = (questions) => {
  if (!questions || !questions.length) return '';

  return questions.map(q => {
    const lines = [`## ${q.text}`];

    (q.options || []).forEach((opt, i) => {
      const isCorrect = Array.isArray(q.isCorrect)
        ? q.isCorrect.includes(i)
        : q.isCorrect === i;
      lines.push(`- ${opt.text}${isCorrect ? ' *' : ''}`);
    });

    if (q.marks && q.marks !== 1) lines.push(`marks: ${q.marks}`);
    if (q.explanation) lines.push(`explanation: ${q.explanation}`);

    return lines.join('\n');
  }).join('\n\n');
};

export const parseSections = (md) => {
  if (!md || !md.trim()) return [];

  return md.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const match = line.match(/Q?\s*(\d+)\s*[-–]\s*Q?\s*(\d+)[,\s]+pick\s+(\d+)[,\s]+(\d+)\s*mark/i);
    if (!match) return null;
    const [, from, to, count, marks] = match;
    return { range: [Number(from), Number(to)], count: Number(count), marks: Number(marks) };
  }).filter(Boolean);
};

export const sectionsToMarkdown = (sections) => {
  if (!sections || !sections.length) return '';

  return sections.map(s => {
    const label = s.marks === 1 ? 'mark' : 'marks';
    return `Q${s.range[0]}-Q${s.range[1]}, pick ${s.count}, ${s.marks} ${label} each`;
  }).join('\n');
};
