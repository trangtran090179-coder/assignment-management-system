-- Anti-cheat schema
CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME DEFAULT NULL,
  duration_minutes INT DEFAULT NULL,
  risk_score DECIMAL(5,2) DEFAULT 0,
  risk_level ENUM('normal','suspicious','high') DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  event_time DATETIME NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  event_detail JSON DEFAULT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  question_index INT NOT NULL,
  started_at DATETIME NOT NULL,
  answered_at DATETIME DEFAULT NULL,
  time_spent_seconds INT DEFAULT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS anticheat_flags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  flag_type VARCHAR(64) NOT NULL,
  score_delta DECIMAL(5,2) DEFAULT 0,
  detail JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);
