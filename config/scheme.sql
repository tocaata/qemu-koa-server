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
	deleted_at timestamp,
	detail varchar(256)
);

CREATE TABLE oss(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(32) NOT NULL,
	detail varchar(256),
	version varchar(32)
);

CREATE TABLE vms(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(64) NOT NULL,
	created_at timestamp,
	deleted_at timestamp,
	updated_at timestamp ON UPDATE CURRENT_TIMESTAMP,
	last_boot_at timestamp,
	auto_boot TINYINT(1),
	is_template TINYINT(1),
	os_id integer REFERENCES oss(id),
	status TINYINT(3),
	owner_id int REFERENCES users(id)
);

CREATE TABLE vm_configs(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	vm_id int NOT NULL REFERENCES vms(id),
	name varchar(32) NOT NULL,
	value varchar(256),
	editable TINYINT(1)
);

CREATE TABLE discs(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(64),
	path varchar(128),
	size int,
	created_at timestamp,
	os varchar(32)
);


CREATE TABLE disks(
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(64),
	path varchar(128),
	size int,
	used_size int
);
