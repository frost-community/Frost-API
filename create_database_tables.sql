use frost_core;

CREATE TABLE IF NOT EXISTS `frost_application` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `created_at` INT NOT NULL,
  `creator_id` INT NOT NULL,
  `name` VARCHAR(256) NOT NULL,
  `description` VARCHAR(256) NOT NULL,
  `permissions` VARCHAR(256) NOT NULL,
  `key_code` INT(5) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name`))
ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `frost_application_access` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `created_at` INT NOT NULL,
  `user_id` INT NOT NULL,
  `application_id` INT NOT NULL,
  `key_code` INT(5) NULL,
  PRIMARY KEY (`id`))
ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `frost_request` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `created_at` INT NOT NULL,
  `application_id` INT NOT NULL,
  `key_code` INT(5) NULL,
  PRIMARY KEY (`id`))
ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `frost_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `created_at` INT NOT NULL,
  `screen_name` VARCHAR(256) NOT NULL,
  `name` VARCHAR(256) NULL,
  `password_hash` VARCHAR(256) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `screen_name_UNIQUE` (`screen_name`))
ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `frost_user_follow` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `created_at` INT NOT NULL,
  `source_user_id` INT NOT NULL,
  `target_user_id` INT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=MyISAM DEFAULT CHARSET=utf8;
