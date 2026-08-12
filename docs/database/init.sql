-- FlowMail Database Initialization
-- Creates all per-service databases and grants permissions

CREATE DATABASE IF NOT EXISTS flowmail_auth;
CREATE DATABASE IF NOT EXISTS flowmail_email;
CREATE DATABASE IF NOT EXISTS flowmail_calendar;
CREATE DATABASE IF NOT EXISTS flowmail_ai;
CREATE DATABASE IF NOT EXISTS flowmail_integration;

GRANT ALL PRIVILEGES ON flowmail_auth.*        TO 'flowmail'@'%';
GRANT ALL PRIVILEGES ON flowmail_email.*       TO 'flowmail'@'%';
GRANT ALL PRIVILEGES ON flowmail_calendar.*    TO 'flowmail'@'%';
GRANT ALL PRIVILEGES ON flowmail_ai.*          TO 'flowmail'@'%';
GRANT ALL PRIVILEGES ON flowmail_integration.* TO 'flowmail'@'%';
FLUSH PRIVILEGES;

-- ─── AUTH DB ─────────────────────────────────────────────────────────────────
USE flowmail_auth;

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url    VARCHAR(512),
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    token      VARCHAR(512) NOT NULL UNIQUE,
    expires_at DATETIME     NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_token  (token(64))
);

CREATE TABLE IF NOT EXISTS oauth_states (
    id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
    state      VARCHAR(255) NOT NULL UNIQUE,
    user_id    BIGINT,
    provider   VARCHAR(50)  NOT NULL,
    expires_at DATETIME     NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── EMAIL DB ────────────────────────────────────────────────────────────────
USE flowmail_email;

CREATE TABLE IF NOT EXISTS email_threads (
    id                   BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id              BIGINT       NOT NULL,
    external_thread_id   VARCHAR(255) NOT NULL,
    subject              VARCHAR(1000),
    snippet              TEXT,
    last_message_at      DATETIME,
    unread_count         INT          NOT NULL DEFAULT 0,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_thread (user_id, external_thread_id),
    INDEX idx_user_id (user_id),
    INDEX idx_last_message (last_message_at)
);

CREATE TABLE IF NOT EXISTS emails (
    id                   BIGINT        AUTO_INCREMENT PRIMARY KEY,
    thread_id            BIGINT        NOT NULL,
    user_id              BIGINT        NOT NULL,
    external_message_id  VARCHAR(255)  NOT NULL UNIQUE,
    sender_email         VARCHAR(255)  NOT NULL,
    sender_name          VARCHAR(255),
    recipients           JSON,
    cc                   JSON,
    subject              VARCHAR(1000),
    body_plain           LONGTEXT,
    body_html            LONGTEXT,
    received_at          DATETIME      NOT NULL,
    is_read              BOOLEAN       NOT NULL DEFAULT FALSE,
    is_starred           BOOLEAN       NOT NULL DEFAULT FALSE,
    is_archived          BOOLEAN       NOT NULL DEFAULT FALSE,
    is_trashed           BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id    (user_id),
    INDEX idx_thread_id  (thread_id),
    INDEX idx_received   (received_at),
    FULLTEXT INDEX ft_subject_body (subject, body_plain)
);

CREATE TABLE IF NOT EXISTS email_labels (
    id       BIGINT       AUTO_INCREMENT PRIMARY KEY,
    email_id BIGINT       NOT NULL,
    label    VARCHAR(100) NOT NULL,
    INDEX idx_email_id (email_id),
    INDEX idx_label    (label)
);

CREATE TABLE IF NOT EXISTS drafts (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    to_address  JSON,
    cc          JSON,
    subject     VARCHAR(1000),
    body        LONGTEXT,
    in_reply_to VARCHAR(255),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── CALENDAR DB ─────────────────────────────────────────────────────────────
USE flowmail_calendar;

CREATE TABLE IF NOT EXISTS calendar_events (
    id                BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT       NOT NULL,
    external_event_id VARCHAR(255),
    title             VARCHAR(500) NOT NULL,
    description       TEXT,
    location          VARCHAR(500),
    start_time        DATETIME     NOT NULL,
    end_time          DATETIME     NOT NULL,
    timezone          VARCHAR(100) NOT NULL DEFAULT 'UTC',
    all_day           BOOLEAN      NOT NULL DEFAULT FALSE,
    status            ENUM('CONFIRMED','TENTATIVE','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    source_email_id   BIGINT,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id   (user_id),
    INDEX idx_start     (start_time),
    INDEX idx_ext_event (external_event_id)
);

CREATE TABLE IF NOT EXISTS event_attendees (
    id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
    event_id       BIGINT       NOT NULL,
    email          VARCHAR(255) NOT NULL,
    name           VARCHAR(255),
    response_status ENUM('ACCEPTED','DECLINED','TENTATIVE','PENDING') DEFAULT 'PENDING',
    INDEX idx_event_id (event_id)
);

-- ─── AI DB ───────────────────────────────────────────────────────────────────
USE flowmail_ai;

CREATE TABLE IF NOT EXISTS email_analyses (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
    email_id        BIGINT        NOT NULL UNIQUE,
    user_id         BIGINT        NOT NULL,
    priority        ENUM('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'LOW',
    intent          VARCHAR(100),
    category        VARCHAR(100),
    sentiment       VARCHAR(50),
    requires_action BOOLEAN       NOT NULL DEFAULT FALSE,
    summary         TEXT,
    entities        JSON,
    confidence      DECIMAL(4,3)  NOT NULL DEFAULT 0.0,
    analyzed_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_id (email_id),
    INDEX idx_user_id  (user_id),
    INDEX idx_priority (priority)
);

CREATE TABLE IF NOT EXISTS follow_up_radar (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    email_id        BIGINT        NOT NULL,
    sent_at         DATETIME      NOT NULL,
    days_elapsed    INT           NOT NULL,
    status          ENUM('PENDING','SENT','DISMISSED') NOT NULL DEFAULT 'PENDING',
    suggested_reply TEXT,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id  (user_id),
    INDEX idx_status   (status)
);

CREATE TABLE IF NOT EXISTS agent_tasks (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    session_id      VARCHAR(255)  NOT NULL,
    user_input      TEXT          NOT NULL,
    plan            JSON,
    status          ENUM('PLANNING','AWAITING_CONFIRMATION','EXECUTING','COMPLETED','FAILED') NOT NULL DEFAULT 'PLANNING',
    result          JSON,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id   (user_id),
    INDEX idx_session   (session_id),
    INDEX idx_status    (status)
);

-- ─── INTEGRATION DB ───────────────────────────────────────────────────────────
USE flowmail_integration;

CREATE TABLE IF NOT EXISTS integrations (
    id                   BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id              BIGINT       NOT NULL,
    provider             VARCHAR(50)  NOT NULL,
    provider_account_id  VARCHAR(255),
    provider_email       VARCHAR(255),
    connection_ref       VARCHAR(512),
    status               ENUM('CONNECTED','DISCONNECTED','ERROR') NOT NULL DEFAULT 'CONNECTED',
    scopes               JSON,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_provider (user_id, provider),
    INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id           BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT,
    provider     VARCHAR(50)  NOT NULL,
    event_type   VARCHAR(100) NOT NULL,
    payload      JSON,
    processed    BOOLEAN      NOT NULL DEFAULT FALSE,
    received_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    INDEX idx_processed  (processed),
    INDEX idx_user_id    (user_id),
    INDEX idx_received   (received_at)
);
