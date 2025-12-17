# 🔐 PHÂN TÍCH CHI TIẾT VỀ ROLE VÀ LUỒNG HOẠT ĐỘNG

## Hệ Thống Quản Lý Nhiệm Vụ (Task Management System)

---

# 📋 1. TỔNG QUAN VỀ CÁC ROLE

Hệ thống có **2 vai trò chính**:

| Role | Tên đầy đủ | Mô tả |
|------|-----------|-------|
| **Admin** | Quản trị viên | Quản lý toàn bộ hệ thống, người dùng và nhiệm vụ |
| **User** | Người dùng | Quản lý và thực hiện nhiệm vụ được giao |

---

# 👑 2. ROLE: ADMIN (QUẢN TRỊ VIÊN)

## 2.1 Mục tiêu

- Kiểm soát và quản lý toàn bộ người dùng trong hệ thống
- Giám sát tất cả nhiệm vụ của mọi người dùng
- Đảm bảo hệ thống vận hành đúng quy tắc và bảo mật
- Phân công nhiệm vụ cho các thành viên

---

## 2.2 Chức năng chi tiết của Admin

### 🔑 2.2.1 Quản lý người dùng (User Management)

**Admin có quyền:**

1. **Xem danh sách tất cả người dùng**
   - Endpoint: `GET /api/admin/users`
   - Xem thông tin: id, name, email, role, created_at
   - Không hiển thị password (bảo mật)

2. **Xem chi tiết người dùng**
   - Endpoint: `GET /api/admin/users/:id`
   - Bao gồm danh sách tasks đã tạo và tasks được giao

3. **Chỉnh sửa thông tin người dùng**
   - Endpoint: `PUT /api/admin/users/:id`
   - Có thể cập nhật: name, email, role (chuyển user ↔ admin)
   - **Không thể sửa password trực tiếp** (cần user tự đổi)

4. **Xóa người dùng**
   - Endpoint: `DELETE /api/admin/users/:id`
   - **Không thể xóa chính mình** (bảo vệ an toàn)
   - Khi xóa user, tất cả tasks của user đó cũng bị xóa (CASCADE)

**👉 User KHÔNG có quyền này**

---

### 📋 2.2.2 Quản lý nhiệm vụ toàn hệ thống

1. **Xem tất cả nhiệm vụ**
   - Endpoint: `GET /api/admin/tasks`
   - Xem được tasks của mọi người dùng
   - Bao gồm: creator, assigned users, checklists, attachments

2. **Tạo nhiệm vụ**
   - Endpoint: `POST /api/tasks`
   - Có thể gán nhiệm vụ cho nhiều người dùng (assignedUserIds)
   - Có thể tạo nhiệm vụ cá nhân hoặc nhóm

3. **Chỉnh sửa bất kỳ nhiệm vụ nào**
   - Endpoint: `PUT /api/tasks/:id`
   - **Không bị giới hạn** bởi createdBy
   - Có thể cập nhật: assigned users, checklists, attachments

4. **Xóa bất kỳ nhiệm vụ nào**
   - Endpoint: `DELETE /api/tasks/:id`
   - **Không bị giới hạn** bởi createdBy

---

### 👥 2.2.3 Gán nhiệm vụ cho người dùng

- Khi tạo/sửa task, Admin có thể:
  - Chọn nhiều users từ dropdown
  - Gán task cho một hoặc nhiều người
  - Task sẽ hiển thị trong danh sách của từng user được gán

**Cơ chế:**
- Sử dụng bảng `task_assignments` (many-to-many)
- Một task có thể được gán cho nhiều users
- Một user có thể nhận nhiều tasks

---

### 📊 2.2.4 Theo dõi & thống kê

**Admin Dashboard:**
- Xem tổng số users trong hệ thống
- Xem tổng số tasks của tất cả users
- Theo dõi tiến độ từng user
- Phân tích theo mức độ ưu tiên, trạng thái

---

### 📥 2.2.5 Xuất báo cáo

- Xuất báo cáo toàn hệ thống (CSV, Excel, PDF)
- Báo cáo theo user, theo thời gian, theo trạng thái
- Hỗ trợ phân tích và báo cáo quản lý

---

### 🔐 2.2.6 Truy cập Admin Dashboard

- Route: `/admin`
- Chỉ Admin mới truy cập được (middleware kiểm tra role)
- User thường sẽ bị chuyển về `/dashboard`

---

## 2.3 Giới hạn của Admin

- ❌ Không thể sửa password của user trực tiếp (chỉ user tự đổi)
- ❌ Không thể xóa chính mình
- ❌ Không truy cập được thông tin nhạy cảm ngoài hệ thống (password hash)

---

# 👤 3. ROLE: USER (NGƯỜI DÙNG)

## 3.1 Mục tiêu

- Quản lý nhiệm vụ cá nhân
- Thực hiện công việc được giao
- Cộng tác trong nhóm hiệu quả
- Theo dõi tiến độ công việc

---

## 3.2 Chức năng chi tiết của User

### 🔑 3.2.1 Xác thực (Authentication)

1. **Đăng ký tài khoản**
   - Endpoint: `POST /api/auth/register`
   - Yêu cầu: name, email, password (tối thiểu 6 ký tự)
   - Tự động role = 'user'
   - Trả về JWT token

2. **Đăng nhập**
   - Endpoint: `POST /api/auth/login`
   - Xác thực email và password
   - Trả về JWT token

3. **Xem thông tin cá nhân**
   - Endpoint: `GET /api/auth/me`
   - Cần token để truy cập

**Lưu ý:** User không thể đổi password qua API hiện tại (cần thêm tính năng)

---

### 📋 3.2.2 Quản lý nhiệm vụ cá nhân

1. **Tạo nhiệm vụ**
   - Endpoint: `POST /api/tasks`
   - User là người tạo (createdBy = user.id)
   - Có thể thêm: title, description, priority, dates, checklists, attachments
   - **User không thể gán task cho người khác** (frontend ẩn dropdown)

2. **Xem danh sách nhiệm vụ**
   - Endpoint: `GET /api/tasks`
   - **Chỉ thấy:**
     - Tasks do mình tạo (createdBy = user.id)
     - Tasks được gán cho mình (có trong task_assignments)
   - Có thể filter theo: status, priority

3. **Xem chi tiết nhiệm vụ**
   - Endpoint: `GET /api/tasks/:id`
   - Chỉ xem được nếu là owner hoặc được assign
   - Hiển thị đầy đủ: checklists, attachments, assigned users

4. **Chỉnh sửa nhiệm vụ**
   - Endpoint: `PUT /api/tasks/:id`
   - **Chỉ được sửa tasks do mình tạo** (createdBy = user.id)
   - Có thể cập nhật: title, description, priority, dates, checklists, attachments
   - **Không thể gán/reassign cho người khác**

5. **Xóa nhiệm vụ**
   - Endpoint: `DELETE /api/tasks/:id`
   - **Chỉ được xóa tasks do mình tạo**
   - Tasks được gán từ Admin không thể xóa

---

### ☑️ 3.2.3 Quản lý Checklist & Trạng thái tự động

1. **Thêm checklist vào nhiệm vụ**
   - Khi tạo/sửa task, có thể thêm nhiều checklist items
   - Mỗi item có: title, isCompleted

2. **Tick checklist khi hoàn thành**
   - Endpoint: `PUT /api/tasks/:taskId/checklists/:checklistId`
   - User có thể tick/untick bất kỳ checklist nào (kể cả task được gán)

3. **Trạng thái tự động cập nhật:**
   ```
   - Tất cả checklist được tick (100%) → Status = "completed"
   - Có ít nhất 1 checklist được tick → Status = "in_progress"
   - Chưa có checklist nào được tick → Status = "todo"
   ```
   - **User không thể sửa status thủ công** (trừ khi tạo task mới)

---

### 👥 3.2.4 Cộng tác nhóm

1. **Nhận nhiệm vụ được Admin gán**
   - Task xuất hiện trong danh sách của user
   - User có thể xem, cập nhật checklist, nhưng không thể xóa

2. **Xem người cùng tham gia nhiệm vụ**
   - Hiển thị danh sách assigned users trong task detail
   - Biết được ai đang làm cùng task

3. **Theo dõi tiến độ nhóm**
   - Xem % hoàn thành của task (dựa trên checklist)
   - Progress bar hiển thị trực quan

---

### 🔗 3.2.5 Đính kèm tài liệu (Attachments)

- Khi tạo/sửa task, có thể thêm link đính kèm
- Hỗ trợ: Google Drive, Figma, PDF, GitHub, v.v.
- Lưu trữ trong bảng `attachments`
- User có thể xem và mở link

---

### 📊 3.2.6 Theo dõi tiến độ cá nhân (Dashboard)

**User Dashboard hiển thị:**
- Tổng số nhiệm vụ (total)
- Nhiệm vụ chưa bắt đầu (todo)
- Nhiệm vụ đang làm (in_progress)
- Nhiệm vụ hoàn thành (completed)
- Nhiệm vụ quá hạn (overdue)

**Biểu đồ trực quan:**
- Pie chart: Phân bố theo trạng thái
- Bar chart: So sánh số lượng
- Progress bars: % hoàn thành từng task

---

### 📥 3.2.7 Xuất báo cáo cá nhân

- Export danh sách nhiệm vụ của mình
- Định dạng: CSV, Excel, PDF
- Phục vụ báo cáo cá nhân / học tập

---

## 3.3 Giới hạn của User

- ❌ **Không xem được nhiệm vụ của user khác** (trừ nhiệm vụ được gán chung)
- ❌ **Không thể gán task cho người khác** (chỉ Admin mới có quyền)
- ❌ **Không quản lý được users** (không có access đến `/api/admin/users`)
- ❌ **Không truy cập được Admin Dashboard** (`/admin`)
- ❌ **Không sửa/xóa được tasks do Admin/người khác tạo** (chỉ được cập nhật checklist)

---

# 🔄 4. PHÂN TÍCH LUỒNG HOẠT ĐỘNG (WORKFLOW)

---

## 4.1 Luồng đăng ký & đăng nhập

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─→ POST /api/auth/register
     │   { name, email, password }
     │
     ↓
┌─────────────┐
│   Backend   │
│  (Express)  │
└────┬────────┘
     │
     ├─→ Validate input (express-validator)
     ├─→ Check email đã tồn tại?
     ├─→ Hash password (bcrypt)
     ├─→ Create User (role = 'user')
     ├─→ Generate JWT token
     │
     ↓
┌─────────────┐
│  Response   │
│ { token,    │
│   user }    │
└────┬────────┘
     │
     ↓
┌─────────────┐
│  Frontend   │
│  (React)    │
└────┬────────┘
     │
     ├─→ Save token to localStorage
     ├─→ Save user info to localStorage
     ├─→ Redirect to /dashboard
```

**Đăng nhập tương tự, nhưng:**
- Không tạo user mới
- Verify password với hash trong database
- Kiểm tra email có tồn tại

---

## 4.2 Luồng phân quyền (Authorization Flow)

```
┌──────────┐
│ Request  │
│(Frontend)│
└────┬─────┘
     │
     ├─→ Attach JWT token
     │   Authorization: Bearer <token>
     │
     ↓
┌─────────────────┐
│  Auth Middleware│
│  (protect)      │
└────┬────────────┘
     │
     ├─→ Extract token từ header
     ├─→ Verify token (jwt.verify)
     ├─→ Get user từ database
     ├─→ Attach user to req.user
     │
     ↓
┌─────────────────┐
│ Admin Middleware│
│  (admin) - nếu  │
│  route cần      │
└────┬────────────┘
     │
     ├─→ Check req.user.role === 'admin'
     │
     ↓
┌──────────┐      ┌──────────┐
│  Allow   │      │  Deny    │
│  200 OK  │      │   403    │
└──────────┘      └──────────┘
```

**Ví dụ:**
- `/api/admin/users` → cần cả `protect` và `admin`
- `/api/tasks` → chỉ cần `protect`
- `/api/auth/register` → không cần middleware

---

## 4.3 Luồng tạo nhiệm vụ

### Trường hợp User tạo nhiệm vụ

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─→ POST /api/tasks
     │   {
     │     title, description, priority,
     │     startDate, dueDate,
     │     checklists: [...],
     │     attachments: [...]
     │   }
     │
     ↓
┌─────────────┐
│   Backend   │
└────┬────────┘
     │
     ├─→ Create Task (createdBy = req.user.id)
     ├─→ Create Checklists (nếu có)
     ├─→ Create Attachments (nếu có)
     │   ❌ KHÔNG gán assignedUserIds (User không có quyền)
     │
     ↓
┌─────────────┐
│  Response   │
│  Task object│
└────┬────────┘
     │
     ↓
┌─────────────┐
│  Frontend   │
│  Hiển thị   │
│  trong list │
└─────────────┘
```

### Trường hợp Admin tạo nhiệm vụ

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     ├─→ POST /api/tasks
     │   {
     │     title, description, priority,
     │     assignedUserIds: [1, 2, 3],  ← Có thể gán
     │     checklists: [...],
     │     attachments: [...]
     │   }
     │
     ↓
┌─────────────┐
│   Backend   │
└────┬────────┘
     │
     ├─→ Create Task (createdBy = req.user.id)
     ├─→ Create TaskAssignments (nếu có assignedUserIds)
     ├─→ Create Checklists
     ├─→ Create Attachments
     │
     ↓
┌─────────────┐
│  Response   │
│  Task với   │
│  assigned   │
│  users      │
└────┬────────┘
     │
     ↓
┌─────────────┐
│  Task hiển  │
│  thị cho    │
│  từng user  │
│  được gán   │
└─────────────┘
```

---

## 4.4 Luồng cập nhật Checklist & Trạng thái tự động

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─→ PUT /api/tasks/:taskId/checklists/:checklistId
     │   { isCompleted: true }
     │
     ↓
┌─────────────┐
│   Backend   │
└────┬────────┘
     │
     ├─→ Update Checklist (isCompleted = true)
     │
     ├─→ Call updateTaskStatus(taskId)
     │   ├─→ Get all checklists của task
     │   ├─→ Check: Tất cả completed? → status = 'completed'
     │   ├─→ Check: Có ít nhất 1 completed? → status = 'in_progress'
     │   └─→ Ngược lại → status = 'todo'
     │
     ├─→ Update Task status tự động
     │
     ↓
┌─────────────┐
│  Response   │
│  Task với   │
│  status mới │
└────┬────────┘
     │
     ↓
┌─────────────┐
│  Frontend   │
│  Hiển thị   │
│  status mới │
│  + progress │
└─────────────┘
```

**Lưu ý:** Status được cập nhật tự động, User không thể set thủ công.

---

## 4.5 Luồng cộng tác nhóm (Task Assignment)

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     ├─→ Tạo task và gán cho User A, B, C
     │   assignedUserIds: [userId_A, userId_B, userId_C]
     │
     ↓
┌─────────────┐
│   Backend   │
└────┬────────┘
     │
     ├─→ Create Task
     ├─→ Create TaskAssignments:
     │   ├─→ { taskId: 1, userId: A }
     │   ├─→ { taskId: 1, userId: B }
     │   └─→ { taskId: 1, userId: C }
     │
     ↓
┌─────────────┐
│  Database   │
│  task_      │
│  assignments│
└────┬────────┘
     │
     ↓
┌─────────────┐
│  Mỗi User   │
│  GET /tasks │
└────┬────────┘
     │
     ├─→ Backend filter:
     │   WHERE createdBy = userId
     │      OR id IN (assigned taskIds)
     │
     ↓
┌─────────────┐
│  User A, B, │
│  C đều thấy │
│  task này   │
└─────────────┘
```

**Kết quả:**
- User A, B, C đều thấy task trong danh sách của mình
- Tất cả đều có thể cập nhật checklist
- Tất cả đều thấy tiến độ chung
- Chỉ Admin (hoặc creator) mới có thể sửa/xóa task

---

## 4.6 Luồng User xem danh sách nhiệm vụ

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─→ GET /api/tasks
     │
     ↓
┌─────────────┐
│   Backend   │
└────┬────────┘
     │
     ├─→ Check req.user.role
     │
     ├─→ Nếu là 'user':
     │   ├─→ Find TaskAssignments (userId = req.user.id)
     │   ├─→ Get assignedTaskIds
     │   └─→ Query: WHERE createdBy = userId
     │              OR id IN (assignedTaskIds)
     │
     ├─→ Nếu là 'admin':
     │   └─→ Query: (không filter, lấy tất cả)
     │
     ↓
┌─────────────┐
│  Response   │
│  [tasks]    │
└────┬────────┘
     │
     ↓
┌─────────────┐
│  Frontend   │
│  Hiển thị   │
│  danh sách  │
└─────────────┘
```

---

## 4.7 Luồng User chỉnh sửa nhiệm vụ

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─→ PUT /api/tasks/:id
     │   { title, description, ... }
     │
     ↓
┌─────────────┐
│   Backend   │
└────┬────────┘
     │
     ├─→ Get Task by id
     │
     ├─→ Check quyền:
     │   if (user.role === 'user' && task.createdBy !== user.id)
     │       → Return 403 Forbidden
     │
     ├─→ Nếu là admin → Cho phép
     │   Nếu là creator → Cho phép
     │
     ├─→ Update Task
     ├─→ Update Checklists (nếu có)
     ├─→ Update Attachments (nếu có)
     ├─→ Call updateTaskStatus() (nếu checklist thay đổi)
     │
     ↓
┌─────────────┐
│  Response   │
│  Updated    │
│  Task       │
└─────────────┘
```

---

## 4.8 Luồng xuất báo cáo

```
┌─────────┐
│ User/   │
│ Admin   │
└────┬────┘
     │
     ├─→ Click "Xuất CSV/Excel/PDF"
     │
     ↓
┌─────────────┐
│  Frontend   │
│  (Export)   │
└────┬────────┘
     │
     ├─→ Get tasks từ state/API
     │
     ├─→ Format data:
     │   - Title, Status, Priority
     │   - Creator, Assigned Users
     │   - Dates, Progress
     │
     ├─→ Generate file:
     │   - CSV: Convert to CSV format
     │   - Excel: CSV (Excel có thể mở)
     │   - PDF: HTML → Print dialog
     │
     ↓
┌─────────────┐
│  Download   │
│  File       │
└─────────────┘
```

**Lưu ý:** Export được thực hiện ở client-side, không cần API riêng.

---

## 4.9 Luồng Admin quản lý người dùng

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     ├─→ GET /api/admin/users
     │
     ↓
┌─────────────┐
│   Backend   │
│  (Admin     │
│  Middleware)│
└────┬────────┘
     │
     ├─→ Check: req.user.role === 'admin'
     │   → Nếu không → Return 403
     │
     ├─→ FindAll Users (exclude password)
     │
     ↓
┌─────────────┐
│  Response   │
│  [users]    │
└────┬────────┘
     │
     ↓
┌─────────────┐
│  Admin      │
│  Dashboard  │
│  Hiển thị   │
│  table users│
└────┬────────┘
     │
     ├─→ Edit User:
     │   PUT /api/admin/users/:id
     │   { name, email, role }
     │
     ├─→ Delete User:
     │   DELETE /api/admin/users/:id
     │   (Không thể xóa chính mình)
     │
     ↓
┌─────────────┐
│  Backend    │
│  Update/    │
│  Delete     │
│  User       │
└─────────────┘
```

---

# 🧩 5. BẢNG SO SÁNH QUYỀN HẠN (USE CASE MATRIX)

| Chức năng | User | Admin | Ghi chú |
|-----------|------|-------|---------|
| **Authentication** |
| Đăng ký | ✅ | ✅ | Cả 2 đều có thể |
| Đăng nhập | ✅ | ✅ | Cả 2 đều có thể |
| Xem thông tin cá nhân | ✅ | ✅ | GET /api/auth/me |
| **Task Management** |
| Tạo nhiệm vụ | ✅ | ✅ | Cả 2 đều có thể |
| Xem nhiệm vụ của mình | ✅ | ✅ | User: chỉ của mình, Admin: tất cả |
| Xem tất cả nhiệm vụ | ❌ | ✅ | Admin qua /api/admin/tasks |
| Sửa nhiệm vụ của mình | ✅ | ✅ | User: chỉ tasks mình tạo |
| Sửa nhiệm vụ của người khác | ❌ | ✅ | Admin có quyền sửa tất cả |
| Xóa nhiệm vụ của mình | ✅ | ✅ | User: chỉ tasks mình tạo |
| Xóa nhiệm vụ của người khác | ❌ | ✅ | Admin có quyền xóa tất cả |
| Gán nhiệm vụ cho người khác | ❌ | ✅ | Chỉ Admin (qua assignedUserIds) |
| Cập nhật checklist | ✅ | ✅ | Cả 2 đều có thể (kể cả task được gán) |
| **User Management** |
| Xem danh sách users | ❌ | ✅ | GET /api/admin/users |
| Xem chi tiết user | ❌ | ✅ | GET /api/admin/users/:id |
| Sửa thông tin user | ❌ | ✅ | PUT /api/admin/users/:id |
| Xóa user | ❌ | ✅ | DELETE /api/admin/users/:id |
| Phân quyền (user ↔ admin) | ❌ | ✅ | Admin có thể đổi role |
| **Dashboard & Reports** |
| User Dashboard | ✅ | ✅ | Cả 2 đều có |
| Admin Dashboard | ❌ | ✅ | Chỉ Admin |
| Xem thống kê cá nhân | ✅ | ✅ | GET /api/tasks/stats |
| Xem thống kê toàn hệ thống | ❌ | ✅ | Admin Dashboard |
| Xuất báo cáo cá nhân | ✅ | ✅ | Export tasks của mình |
| Xuất báo cáo toàn hệ thống | ❌ | ✅ | Export tất cả tasks |

---

# 🎯 6. KẾT LUẬN

## 6.1 Tóm tắt vai trò

- **Admin:** Người quản lý hệ thống, có quyền kiểm soát toàn bộ users và tasks, phân công công việc, giám sát tiến độ.
  
- **User:** Người thực hiện công việc, quản lý tasks cá nhân và tasks được gán, cộng tác trong nhóm, theo dõi tiến độ.

## 6.2 Đặc điểm nổi bật

1. **Bảo mật tốt:** Phân quyền rõ ràng, middleware kiểm tra ở mọi endpoint nhạy cảm

2. **Cộng tác hiệu quả:** Task assignment cho phép nhiều người cùng làm một task

3. **Tự động hóa:** Status tự động cập nhật dựa trên checklist, giảm thao tác thủ công

4. **Linh hoạt:** Admin có thể quản lý toàn diện, User có đủ quyền để làm việc hiệu quả

5. **Mở rộng dễ dàng:** Có thể thêm roles mới (ví dụ: Manager, Leader) hoặc tính năng mới (notifications, comments)

## 6.3 Phù hợp với

- Nhóm làm việc nhỏ và vừa
- Quản lý dự án học tập
- Hệ thống quản lý công việc trong công ty
- Nền tảng cộng tác nhóm

---

**Tài liệu này phù hợp để đưa vào:**
- Chương Phân tích yêu cầu hệ thống
- Use Case Diagram
- System Analysis
- Báo cáo đồ án / Luận văn

