// Export report to CSV
export const exportToCSV = (tasks, filename = 'tasks_report') => {
  const headers = ['Title', 'Description', 'Status', 'Priority', 'Start Date', 'Due Date', 'Creator', 'Assigned To', 'Created Date'];
  
  const rows = tasks.map(task => [
    task.title || '',
    task.description || '',
    task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Not Started',
    task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low',
    task.startDate ? new Date(task.startDate).toLocaleDateString('en-US') : '',
    task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : '',
    task.creator ? task.creator.name : '',
    task.assignedUsers ? task.assignedUsers.map(u => u.name).join(', ') : '',
    task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US') : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Add BOM for UTF-8 support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export report to Excel (uses CSV format, can be opened with Excel)
export const exportToExcel = (tasks, filename = 'tasks_report') => {
  exportToCSV(tasks, filename); // Excel có thể mở CSV
};

// Generate PDF content (need to add jsPDF library for real PDF)
export const exportToPDF = async (tasks, filename = 'tasks_report') => {
  // Simple approach: create HTML table and print
  const tableContent = `
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Creator</th>
          <th>Created Date</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map(task => `
          <tr>
            <td>${task.title || ''}</td>
            <td>${task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Not Started'}</td>
            <td>${task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}</td>
            <td>${task.creator ? task.creator.name : ''}</td>
            <td>${task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US') : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Task Report</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Task Report</h1>
        ${tableContent}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

