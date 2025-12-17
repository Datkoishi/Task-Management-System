const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware để debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Task Management System API' });
});

// Database connection và khởi tạo
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Kết nối database thành công');
    // Không dùng alter: true vì database đã được tạo sẵn từ schema.sql
    // Chỉ sync để kiểm tra models, không thay đổi schema
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    console.log('Đồng bộ database thành công');
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Lỗi kết nối database:', err);
  });

module.exports = app;

