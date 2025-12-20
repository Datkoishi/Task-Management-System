const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Vui lòng nhập tên'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
  ],
  login
);

router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers); // Lấy danh sách users cho tất cả user đã đăng nhập

module.exports = router;





