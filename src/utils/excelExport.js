import * as XLSX from 'xlsx';

const getNested = (obj, ...keys) => {
  for (const key of keys) {
    const val = obj[key];
    if (val != null) return val;
  }
  const results = obj.results;
  if (results) {
    for (const key of keys) {
      const val = results[key];
      if (val != null) return val;
    }
  }
  return 0;
};

export const downloadReportAsExcel = (data, config) => {
  const first = data[0] || {};
  const isProject = first.type === 'project';

  const worksheetData = [
    ['Student Report'],
    [`Assessment: ${config?.examTitle || 'N/A'}`],
    [`Class: ${config?.classNum || 'N/A'}`],
    [`Subject: ${config?.subject || 'N/A'}`],
    [`Teacher: ${config?.teacher || 'N/A'}`],
    [`Generated: ${new Date().toLocaleDateString()}`],
    []
  ];

  if (isProject) {
    worksheetData.push(['Name', 'Roll No', 'Topic', 'Description', 'File URL', 'Submitted Date']);
    data.forEach(row => {
      worksheetData.push([
        row.name,
        row.rollNumber,
        row.topic || '-',
        row.description || '-',
        row.fileUrl || '-',
        row.submittedTime || '-'
      ]);
    });
    worksheetData.push([]);
    worksheetData.push(['Total Submissions', data.length]);

    const colWidths = [
      { wch: 25 }, { wch: 10 }, { wch: 30 }, { wch: 40 },
      { wch: 60 }, { wch: 20 }
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Project Submissions');
    const fileName = `${(config?.examTitle || 'Project_Report').replace(/[^a-zA-Z0-9]/g, '_')}_${config?.classNum || ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    return;
  }

  worksheetData.push(['Name', 'Roll No', 'Correct', 'Wrong', 'Skipped', 'Marks', 'Percentage', 'Grade']);
  data.forEach(row => {
    worksheetData.push([
      row.name,
      row.rollNumber,
      getNested(row, 'correctCount', 'correct'),
      getNested(row, 'wrongCount', 'wrong'),
      getNested(row, 'skippedCount', 'skipped'),
      getNested(row, 'totalEarned', 'marks'),
      `${getNested(row, 'percentage')}%`,
      row.results?.grade || row.grade || '-'
    ]);
  });

  worksheetData.push([]);
  worksheetData.push(['Summary']);
  worksheetData.push(['Total Students', data.length]);

  const totalCorrect = data.reduce((sum, d) => sum + getNested(d, 'correctCount', 'correct'), 0);
  const totalWrong = data.reduce((sum, d) => sum + getNested(d, 'wrongCount', 'wrong'), 0);
  const totalSkipped = data.reduce((sum, d) => sum + getNested(d, 'skippedCount', 'skipped'), 0);
  const totalMarks = data.reduce((sum, d) => sum + getNested(d, 'totalEarned', 'marks'), 0);
  const avgPercentage = data.length > 0
    ? (data.reduce((sum, d) => sum + getNested(d, 'percentage'), 0) / data.length).toFixed(2)
    : 0;

  worksheetData.push(['Total Correct', totalCorrect]);
  worksheetData.push(['Total Wrong', totalWrong]);
  worksheetData.push(['Total Skipped', totalSkipped]);
  worksheetData.push(['Total Marks', totalMarks]);
  worksheetData.push(['Average Percentage', `${avgPercentage}%`]);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const colWidths = [
    { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'MCQ Results');

  const fileName = `${(config?.examTitle || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}_${config?.classNum || ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
