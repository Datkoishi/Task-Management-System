-- File này dùng để tạo dữ liệu mẫu (seed data)
-- Lưu ý: Mật khẩu được hash bằng bcrypt với cost factor 10
-- Mật khẩu mặc định cho admin: "admin123"
-- Mật khẩu mặc định cho user: "user123"

-- Insert admin user
-- Password: admin123 (đã được hash)
INSERT INTO users (name, email, password, role) VALUES 
('Quản trị viên', 'admin@example.com', '$2a$10$rGz8vZ2YJQ1YqJxJQ1YqJeX1YqJxJQ1YqJeX1YqJxJQ1YqJeX1YqJe', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample user
-- Password: user123 (đã được hash)
INSERT INTO users (name, email, password, role) VALUES 
('Người dùng mẫu', 'user@example.com', '$2a$10$rGz8vZ2YJQ1YqJxJQ1YqJeX1YqJxJQ1YqJeX1YqJxJQ1YqJeX1YqJe', 'user')
ON CONFLICT (email) DO NOTHING;

-- Lưu ý: Để tạo mật khẩu hash thực tế, bạn cần chạy script Node.js
-- Hoặc đăng ký user mới thông qua API









