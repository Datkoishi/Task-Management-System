// Hàm xuất báo cáo ra CSV
export const exportToCSV = (tasks, filename = 'tasks_report') => {
  const headers = ['Tiêu đề', 'Mô tả', 'Trạng thái', 'Ưu tiên', 'Ngày bắt đầu', 'Ngày đến hạn', 'Người tạo', 'Người được giao', 'Ngày tạo'];
  
  const rows = tasks.map(task => [
    task.title || '',
    task.description || '',
    task.status === 'completed' ? 'Hoàn thành' : task.status === 'in_progress' ? 'Đang làm' : 'Chưa bắt đầu',
    task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp',
    task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : '',
    task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '',
    task.creator ? task.creator.name : '',
    task.assignedUsers ? task.assignedUsers.map(u => u.name).join(', ') : '',
    task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Thêm BOM để hỗ trợ tiếng Việt
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

// Hàm xuất báo cáo ra Excel (sử dụng CSV format, có thể mở bằng Excel)
export const exportToExcel = (tasks, filename = 'tasks_report') => {
  exportToCSV(tasks, filename); // Excel có thể mở CSV
};

// Hàm tạo PDF content (cần thêm thư viện jsPDF nếu muốn PDF thực sự)
export const exportToPDF = async (tasks, filename = 'tasks_report') => {
  // Simple approach: tạo HTML table và in
  const tableContent = `
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>
          <th>Tiêu đề</th>
          <th>Trạng thái</th>
          <th>Ưu tiên</th>
          <th>Người tạo</th>
          <th>Ngày tạo</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map(task => `
          <tr>
            <td>${task.title || ''}</td>
            <td>${task.status === 'completed' ? 'Hoàn thành' : task.status === 'in_progress' ? 'Đang làm' : 'Chưa bắt đầu'}</td>
            <td>${task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}</td>
            <td>${task.creator ? task.creator.name : ''}</td>
            <td>${task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Báo cáo nhiệm vụ</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Báo cáo nhiệm vụ</h1>
        ${tableContent}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

