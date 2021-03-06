CREATE DATABASE qemu;

CREATE USER 'qemu'@'localhost' IDENTIFIED BY 'qemu';
GRANT ALL PRIVILEGES on qemu.* to 'qemu'@'localhost';

CREATE TABLE sessions(
	session_id varchar(64) NOT NULL PRIMARY KEY,
	data varchar(512),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	username varchar(32) NOT NULL,
	name varchar(64) NOT NULL,
	email varchar(64),
	password_hash varchar(64),
	created_at timestamp DEFAULT CURRENT_TIMESTAMP,
	deleted_at timestamp NULL DEFAULT NULL,
	detail varchar(256),
	KEY idx_users_created_at(created_at) USING BTREE
);

CREATE TABLE oss(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(32) NOT NULL,
	type varchar(32),
	icon varchar(64),
	detail varchar(256),
	enabled TINYINT(1),
	created_at timestamp DEFAULT CURRENT_TIMESTAMP,
	deleted_at timestamp NULL DEFAULT NULL
);

ALTER TABLE oss ADD COLUMN icon varchar(64);

CREATE TABLE oss_vm_option_templates(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    os_id INT NOT NULL REFERENCES oss(id),
    vm_option_template_id INT NOT NULL REFERENCES vm_option_templates(id),
    KEY idx_oss_vm_option_templates_os_id(os_id) USING BTREE,
    KEY idx_oss_vm_option_templates_vm_option_template_id(vm_option_template_id) USING BTREE
);

CREATE TABLE vms(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(64) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP,
	deleted_at timestamp NULL DEFAULT NULL,
	updated_at timestamp ON UPDATE CURRENT_TIMESTAMP,
	last_boot_at timestamp NULL DEFAULT NULL,
	auto_boot TINYINT(1),
	is_template TINYINT(1),
	os_id integer REFERENCES oss(id),
	status TINYINT(3), -- 0: stopped, 1: running, 2: pending, 3: down
	owner_id int REFERENCES users(id),
	KEY idx_oss_created_at(created_at) USING BTREE
);

CREATE TABLE vm_configs(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	vm_id int NOT NULL REFERENCES vms(id),
	name varchar(32),
	value varchar(256),
	vm_option_template_id int REFERENCES vm_option_templates(id),
	editable TINYINT(1),
	KEY idx_vm_configs_vm_id(vm_id) USING BTREE
);

CREATE TABLE discs(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(64),
	path varchar(128),
	size int,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP,
	os varchar(32)
);


CREATE TABLE disks(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(64),
	path varchar(128),
	size int,
	used_size int
);


CREATE TABLE vm_option_templates(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name varchar(64),
    arg varchar(64),
    type varchar(64),
    is_primary TINYINT(1),
    config text
);

CREATE TABLE settings(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name varchar(64),
    value varchar(256),
    type varchar(64),
    enabled TINYINT(1),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    KEY idx_oss_settings_type(type) USING BTREE,
    KEY idx_oss_settings_name(name) USING BTREE
);