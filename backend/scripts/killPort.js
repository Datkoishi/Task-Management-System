const { execSync } = require('child_process');

const port = process.argv[2] || '5000';

try {
  // Tìm process đang dùng port
  const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
  
  if (result) {
    const pids = result.split('\n').filter(Boolean);
    console.log(`Tìm thấy ${pids.length} process(es) đang dùng port ${port}: ${pids.join(', ')}`);
    
    // Kill từng process
    pids.forEach(pid => {
      try {
        execSync(`kill -9 ${pid}`);
        console.log(`✅ Đã dừng process ${pid}`);
      } catch (error) {
        console.log(`⚠️  Không thể dừng process ${pid}`);
      }
    });
    
    console.log(`\n✅ Đã dọn sạch port ${port}`);
  } else {
    console.log(`✅ Port ${port} đã trống`);
  }
} catch (error) {
  console.log(`✅ Port ${port} đã trống (không có process nào)`);
}

