function asCsv(results) {
  const headers = [
    'Grade', 'Min Score', 'Avg Score', 'Max Score', 'Percent Diff',
    'Final Percent', 'Min Salary', 'Avg Salary', 'Max Salary',
  ];
  const rows = results.grades.map((row) => [
    row.grade,
    row.min_score,
    row.avg_score,
    row.max_score,
    row.percent_diff,
    row.final_percent,
    row.min_salary,
    row.avg_salary,
    row.max_salary,
  ]);
  return [headers, ...rows].map((line) => line.join(',')).join('\n');
}

function asExcel(results) {
  const xmlRows = results.grades.map((row) => `
    <Row>
      <Cell><Data ss:Type="Number">${row.grade}</Data></Cell>
      <Cell><Data ss:Type="Number">${row.min_score}</Data></Cell>
      <Cell><Data ss:Type="Number">${row.avg_score}</Data></Cell>
      <Cell><Data ss:Type="Number">${row.max_score}</Data></Cell>
      <Cell><Data ss:Type="Number">${row.percent_diff}</Data></Cell>
      <Cell><Data ss:Type="Number">${row.final_percent}</Data></Cell>
      <Cell><Data ss:Type="Number">${row.min_salary}</Data></Cell>
      <Cell><Data ss:Type="Number">${row.avg_salary}</Data></Cell>
      <Cell><Data ss:Type="Number">${row.max_salary}</Data></Cell>
    </Row>`).join('');

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Grade Results">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Grade</Data></Cell>
    <Cell><Data ss:Type="String">Min Score</Data></Cell>
    <Cell><Data ss:Type="String">Avg Score</Data></Cell>
    <Cell><Data ss:Type="String">Max Score</Data></Cell>
    <Cell><Data ss:Type="String">Percent Diff</Data></Cell>
    <Cell><Data ss:Type="String">Final Percent</Data></Cell>
    <Cell><Data ss:Type="String">Min Salary</Data></Cell>
    <Cell><Data ss:Type="String">Avg Salary</Data></Cell>
    <Cell><Data ss:Type="String">Max Salary</Data></Cell>
   </Row>${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

function asPdf(results) {
  const lines = [
    `Run #${results.run.id}`,
    `Global Max Score: ${results.run.global_max_score.toFixed(2)}`,
    ...results.grades.map((row) => `G${row.grade}: ${row.min_salary.toFixed(2)} - ${row.max_salary.toFixed(2)}`),
  ];

  const stream = lines.join('\n').replace(/[()]/g, '');
  const content = `BT /F1 10 Tf 50 760 Td (${stream}) Tj ET`;
  const len = content.length;

  return `%PDF-1.1
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj
3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>> endobj
4 0 obj <</Length ${len}>> stream
${content}
endstream endobj
5 0 obj <</Type/Font/Subtype/Type1/BaseFont/Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000243 00000 n 
0000000335 00000 n 
trailer <</Size 6/Root 1 0 R>>
startxref
410
%%EOF`;
}

module.exports = {
  asCsv,
  asExcel,
  asPdf,
};
