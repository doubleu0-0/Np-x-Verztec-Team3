USE verztec;

-- USERS
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  role ENUM('ADMIN', 'MANAGER', 'USER') NOT NULL,
  country VARCHAR(50),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CHATBOT LOGS
CREATE TABLE chatbot_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  username VARCHAR(100) NOT NULL,
  conversation_id VARCHAR(50),
  title VARCHAR(128) DEFAULT NULL,
  query TEXT,
  response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LOGIN LOGS
CREATE TABLE login_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(100) NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20)  -- e.g., "SUCCESS" or "FAILURE"
);

-- UPLOAD USER LOGS
CREATE TABLE upload_user_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_user_id INT NOT NULL,
    created_username VARCHAR(100) NOT NULL UNIQUE,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- UPLOAD FILE LOGS
CREATE TABLE upload_file_logs ( 
    file_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_by_username VARCHAR(100) NOT NULL,
    department TEXT NOT NULL,
    access_level VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    countries TEXT NOT NULL,
    departments TEXT NOT NULL,
    batch_id VARCHAR(50),
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FILES
CREATE TABLE files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_by_username VARCHAR(100) NOT NULL,
    department TEXT NOT NULL,
    access_level VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    countries TEXT NOT NULL,
    departments TEXT NOT NULL,
    batch_id VARCHAR(50),
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- FILE DELETION LOGS
CREATE TABLE file_deletion_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  deleted_file_name VARCHAR(255) NOT NULL,
  deleted_file_type VARCHAR(50),
  department TEXT,
  access_level VARCHAR(50),
  file_path TEXT,
  countries TEXT,
  batch_id VARCHAR(50),
  uploaded_by_username VARCHAR(50),
  deleted_by_username VARCHAR(50) NOT NULL,
  deleted_at DATETIME NOT NULL
);

-- USER UPDATE LOGS
CREATE TABLE user_update_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  target_username VARCHAR(50) NOT NULL,
  changed_by_username VARCHAR(50) NOT NULL,
  field_name VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  changed_at DATETIME NOT NULL
);

-- USER DELETION LOGS
CREATE TABLE user_deletion_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  deleted_username VARCHAR(50) NOT NULL,
  deleted_email VARCHAR(100),
  department VARCHAR(100),
  role VARCHAR(50),
  country VARCHAR(100),
  deleted_by_username VARCHAR(50) NOT NULL,
  deleted_at DATETIME NOT NULL
);

-- FILE UPDATE LOGS
CREATE TABLE file_update_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NULL,
  file_name VARCHAR(255),
  changed_by_username VARCHAR(50) NOT NULL,
  field_name VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  changed_at DATETIME NOT NULL
);

-- PASSWORD RESET AUDIT
CREATE TABLE IF NOT EXISTS password_reset_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    reset_type ENUM('REQUESTED', 'COMPLETED') NOT NULL,
    target_email VARCHAR(255) NOT NULL,
    target_username VARCHAR(100),
    user_ip VARCHAR(45),
    user_agent TEXT,
    reset_token_used VARCHAR(64),
    reset_at DATETIME NOT NULL,
    INDEX idx_reset_at (reset_at),
    INDEX idx_target_email (target_email),
    INDEX idx_reset_type (reset_type)
);

-- PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    user_id INT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FEEDBACK TABLE
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    category ENUM('general', 'bug', 'feature') NOT NULL,
    message TEXT NOT NULL,
    rating INT DEFAULT NULL, -- nullable since bug/feature requests don't have ratings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending');
    