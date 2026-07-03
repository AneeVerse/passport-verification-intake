-- Database Schema for Passport Application Portal
-- Compatible with MySQL and MariaDB

CREATE DATABASE IF NOT EXISTS `rocke7ee_passportapp` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `rocke7ee_passportapp`;

-- Table structure for table `roles`
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(255) NOT NULL,
  `role_added_on` VARCHAR(255) DEFAULT NULL,
  `role_added_by` INT DEFAULT NULL,
  `role_updated_on` VARCHAR(255) DEFAULT NULL,
  `role_updated_by` INT DEFAULT NULL,
  `role_status` TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `locations`
CREATE TABLE IF NOT EXISTS `locations` (
  `location_id` INT AUTO_INCREMENT PRIMARY KEY,
  `location_name` VARCHAR(255) NOT NULL,
  `location_added_on` VARCHAR(255) DEFAULT NULL,
  `location_added_by` INT DEFAULT NULL,
  `location_updated_on` VARCHAR(255) DEFAULT NULL,
  `location_updated_by` INT DEFAULT NULL,
  `location_status` TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `documents`
CREATE TABLE IF NOT EXISTS `documents` (
  `document_id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_category` INT NOT NULL, -- 1: Address proof, 2: DOB proof, 3: Additional docs
  `document_name` VARCHAR(255) NOT NULL,
  `document_added_on` VARCHAR(255) DEFAULT NULL,
  `document_added_by` INT DEFAULT NULL,
  `document_updated_on` VARCHAR(255) DEFAULT NULL,
  `document_updated_by` INT DEFAULT NULL,
  `document_status` TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `settings`
CREATE TABLE IF NOT EXISTS `settings` (
  `settings_id` INT AUTO_INCREMENT PRIMARY KEY,
  `settings_title` VARCHAR(255) DEFAULT NULL,
  `settings_company` VARCHAR(255) DEFAULT NULL,
  `settings_email` VARCHAR(255) DEFAULT NULL,
  `settings_phone` VARCHAR(255) DEFAULT NULL,
  `settings_address` TEXT DEFAULT NULL,
  `settings_logo` VARCHAR(255) DEFAULT NULL,
  `settings_favicon` VARCHAR(255) DEFAULT NULL,
  `settings_cname` VARCHAR(255) DEFAULT NULL,
  `settings_csymbol` VARCHAR(255) DEFAULT NULL,
  `settings_mailer` VARCHAR(255) DEFAULT NULL,
  `settings_host` VARCHAR(255) DEFAULT NULL,
  `settings_port` INT DEFAULT NULL,
  `settings_uname` VARCHAR(255) DEFAULT NULL,
  `settings_pwd` VARCHAR(255) DEFAULT NULL,
  `settings_encryption` VARCHAR(50) DEFAULT NULL,
  `settings_faddress` VARCHAR(255) DEFAULT NULL,
  `settings_fname` VARCHAR(255) DEFAULT NULL,
  `settings_winstance_id` VARCHAR(255) DEFAULT NULL,
  `settings_waccess_token` VARCHAR(255) DEFAULT NULL,
  `settings_added_on` VARCHAR(255) DEFAULT NULL,
  `settings_added_by` INT DEFAULT NULL,
  `settings_updated_on` VARCHAR(255) DEFAULT NULL,
  `settings_updated_by` INT DEFAULT NULL,
  `settings_status` TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `users`
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_role` INT NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_email` VARCHAR(255) NOT NULL UNIQUE,
  `user_phone` VARCHAR(255) DEFAULT NULL,
  `user_password` VARCHAR(255) NOT NULL,
  `user_vpassword` VARCHAR(255) DEFAULT NULL,
  `user_image` VARCHAR(255) DEFAULT NULL,
  `user_added_on` VARCHAR(255) DEFAULT NULL,
  `user_added_by` INT DEFAULT NULL,
  `user_updated_on` VARCHAR(255) DEFAULT NULL,
  `user_updated_by` INT DEFAULT NULL,
  `user_status` TINYINT DEFAULT 1,
  FOREIGN KEY (`user_role`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `applications`
CREATE TABLE IF NOT EXISTS `applications` (
  `application_id` INT AUTO_INCREMENT PRIMARY KEY,
  `application_date` DATE NOT NULL,
  `application_type` INT NOT NULL, -- 1: Fresh, 2: Reissue
  `application_mode` INT NOT NULL, -- 1: Normal, 2: Tatkaal, 3: Urgent Normal, 4: Urgent Tatkaal
  `application_srno` VARCHAR(255) DEFAULT NULL,
  `application_name` VARCHAR(255) NOT NULL,
  `application_surname` VARCHAR(255) NOT NULL,
  `application_email` VARCHAR(255) NOT NULL,
  `application_gender` INT NOT NULL, -- 1: Male, 2: Female, 3: Transgender
  `application_mobile` VARCHAR(50) NOT NULL,
  `application_office` INT NOT NULL, -- PSK Location ID
  `application_dob` DATE NOT NULL,
  `application_age` INT NOT NULL,
  `application_nstatus` INT DEFAULT NULL, -- Nationality status (1: Single parent, 2: Both parents)
  `application_nproof` VARCHAR(255) DEFAULT '0',
  `application_nother` VARCHAR(255) DEFAULT '',
  `application_mnproof` VARCHAR(255) DEFAULT '0',
  `application_mnother` VARCHAR(255) DEFAULT '',
  `application_fnproof` VARCHAR(255) DEFAULT '0',
  `application_fnother` VARCHAR(255) DEFAULT '',
  `application_aproof` VARCHAR(255) NOT NULL, -- Comma-separated document IDs
  `application_aother` VARCHAR(255) DEFAULT '',
  `application_dproof` VARCHAR(255) NOT NULL, -- Comma-separated document IDs
  `application_dother` VARCHAR(255) DEFAULT '',
  `application_mstatus` VARCHAR(50) NOT NULL,
  `application_mproof` VARCHAR(255) DEFAULT '0',
  `application_nmismatch` INT NOT NULL,
  `application_nfound` VARCHAR(255) DEFAULT '0',
  `application_nfother` VARCHAR(255) DEFAULT '',
  `application_nnotes` TEXT DEFAULT NULL,
  `application_ncorrect` INT DEFAULT 0,
  `application_addocuments` VARCHAR(255) NOT NULL, -- Comma-separated document IDs
  `application_adother` VARCHAR(255) DEFAULT '',
  `application_ecnr` INT NOT NULL,
  `application_ecother` VARCHAR(255) DEFAULT '',
  `application_bdate` DATE NOT NULL,
  `application_notes` TEXT DEFAULT NULL,
  `application_added_on` VARCHAR(255) DEFAULT NULL,
  `application_added_by` INT DEFAULT NULL,
  `application_updated_on` VARCHAR(255) DEFAULT NULL,
  `application_updated_by` INT DEFAULT NULL,
  `application_status` TINYINT DEFAULT 1,
  `application_trash` TINYINT DEFAULT 1,
  FOREIGN KEY (`application_office`) REFERENCES `locations` (`location_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default role
INSERT INTO `roles` (`role_id`, `role_name`, `role_status`) VALUES (1, 'Super Admin', 1), (2, 'Agent', 1)
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- Seed default settings
INSERT INTO `settings` (`settings_id`, `settings_title`, `settings_company`, `settings_status`) VALUES (1, 'Passport Agency Portal', 'Passport Agent Agency Ltd.', 1)
ON DUPLICATE KEY UPDATE `settings_title` = VALUES(`settings_title`);

-- Seed default Super Admin (password is bcrypt hash for 'admin123')
INSERT INTO `users` (`user_id`, `user_role`, `user_name`, `user_email`, `user_password`, `user_status`) VALUES 
(1, 1, 'Super Admin', 'admin@passportapp.com', '$2a$12$6C7GvPGaDrwTkrerkkEzu59dAvzogVlPYKSr2tkHBUe93ZJ40v.xW', 1)
ON DUPLICATE KEY UPDATE `user_email` = VALUES(`user_email`);
