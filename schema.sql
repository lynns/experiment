-- This script has been tested on MySQL 5.

DROP TABLE IF EXISTS experiments;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS visibility;

CREATE TABLE experiments (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL UNIQUE,
    started_at DATETIME,
    conversion_type ENUM('binary', 'counting') NOT NULL,
    conversion_name VARCHAR(255) NOT NULL,
    live TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE variants (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    experiment_id INT NOT NULL,
    participants INT NOT NULL DEFAULT 0,
    conversions INT NOT NULL DEFAULT 0,
    weight INT NOT NULL DEFAULT 1,
    live TINYINT(1) NOT NULL DEFAULT 1
);

CREATE INDEX variants_experiment_id ON variants (experiment_id);

CREATE TABLE visibility (
    experiment_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (experiment_id, user_id)
);
