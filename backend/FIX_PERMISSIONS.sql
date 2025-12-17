-- Chạy script này trong Query Tool của database task_management
-- Cấp quyền đầy đủ cho user root

-- Cấp quyền trên schema public
GRANT ALL ON SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO root;

-- Cấp quyền cho từng bảng cụ thể
GRANT ALL PRIVILEGES ON TABLE users TO root;
GRANT ALL PRIVILEGES ON TABLE tasks TO root;
GRANT ALL PRIVILEGES ON TABLE checklists TO root;
GRANT ALL PRIVILEGES ON TABLE task_assignments TO root;
GRANT ALL PRIVILEGES ON TABLE attachments TO root;

-- Cấp quyền cho các sequences (cho SERIAL columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO root;

-- Cấp quyền mặc định cho các bảng và sequences tương lai
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO root;

-- Cho root làm owner của schema public (nếu cần)
-- ALTER SCHEMA public OWNER TO root;

