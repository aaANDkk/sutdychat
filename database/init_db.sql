-- 创建数据库
CREATE DATABASE IF NOT EXISTS studychat;
USE studychat;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    coins INT DEFAULT 0
);

-- 好友关系表
CREATE TABLE IF NOT EXISTS friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (user_id, friend_id)
);

-- 聊天记录表
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 硬币记录表
CREATE TABLE IF NOT EXISTS coin_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 奖品表
CREATE TABLE IF NOT EXISTS prizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cost INT NOT NULL,
    image_url VARCHAR(255),
    available BOOLEAN DEFAULT TRUE
);

-- 插入初始奖品数据
INSERT INTO prizes (name, description, cost, image_url) VALUES
('精美笔记本', '高质量的学习笔记本，适合记录学习笔记', 10, 'images/notebook.jpg'),
('学习咖啡券', '一杯香浓咖啡，助你保持学习状态', 20, 'images/coffee.jpg'),
('书籍优惠券', '可用于购买任何学习书籍的优惠券', 50, 'images/book_coupon.jpg');