-- Bảng users: Dùng cho admin, thu ngân, bếp.
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'host',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng dining_tables: Quản lý bàn trong quán.
CREATE TABLE IF NOT EXISTS dining_tables (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_code VARCHAR(50) UNIQUE NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('available', 'occupied', 'inactive') DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng categories: Danh mục món.
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng products: Danh sách món.
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Bảng orders: Lưu đơn hàng chính.
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    table_id BIGINT NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(12,2) DEFAULT 0,
    customer_note TEXT,
    payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
    payment_method ENUM('cash', 'bank_transfer', 'card', 'other') DEFAULT 'cash',
    created_by BIGINT NULL,
    completed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (table_id) REFERENCES dining_tables(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bảng table_sessions: Phiên gọi món ngắn hạn sau khi quét QR hợp lệ.
CREATE TABLE IF NOT EXISTS table_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_id BIGINT NOT NULL,
    order_id BIGINT NULL,
    session_token VARCHAR(128) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (table_id) REFERENCES dining_tables(id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_table_sessions_token (session_token),
    INDEX idx_table_sessions_order_id (order_id),
    INDEX idx_table_sessions_table_active (table_id, expires_at, revoked_at)
);

-- Bảng order_items: Chi tiết món trong đơn.
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    note TEXT,
    subtotal DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'preparing', 'served', 'cancelled') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Bảng order_status_logs: Lưu lịch sử đổi trạng thái.
CREATE TABLE IF NOT EXISTS order_status_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by BIGINT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Bảng toppings: Danh sách toppings/món thêm cho danh mục hoặc món ăn.
CREATE TABLE IF NOT EXISTS toppings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NULL,
    category_id BIGINT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    type ENUM('them', 'cung') NOT NULL DEFAULT 'them',
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Bảng order_item_toppings: Toppings được chọn cho mỗi chi tiết món ăn trong đơn hàng.
CREATE TABLE IF NOT EXISTS order_item_toppings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,
    topping_id BIGINT NOT NULL,
    topping_name VARCHAR(100) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (topping_id) REFERENCES toppings(id)
);
