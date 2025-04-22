CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
);

CREATE TABLE `accounts` (
  `account_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `account_name` varchar(255) NOT NULL,
  `account_username` varchar(255) NOT NULL,
  `account_password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

DELIMITER $$
CREATE PROCEDURE `addAccount`(IN user_id INT, IN account_name VARCHAR(255), IN account_username VARCHAR(255), IN account_password VARCHAR(255))
BEGIN
	INSERT INTO accounts (user_id, account_name, account_username, account_password) VALUES (user_id, account_name, account_username, account_password);
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `checkExistingAccountNames`(IN in_user_id INT, IN in_account_name VARCHAR(255), IN in_account_username VARCHAR(255))
BEGIN
	SELECT account_name, account_username FROM accounts WHERE user_id = in_user_id AND (account_name = in_account_name AND account_username = in_account_username);
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `checkExistingUsername`(IN in_username VARCHAR(255))
BEGIN
	SELECT * FROM users WHERE username = in_username;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `deleteAccount`(
    IN p_account_name VARCHAR(255),
    IN p_account_password VARCHAR(255),
    IN p_account_username VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DELETE FROM accounts
    WHERE account_name = p_account_name
      AND account_password = p_account_password
      AND account_username = p_account_username
      AND user_id = p_user_id;

    SELECT ROW_COUNT() AS deleted_rows;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `editAccount`(
    IN p_old_account_name VARCHAR(255),
    IN p_old_account_password VARCHAR(255),
    IN p_old_account_username VARCHAR(255),
    IN p_user_id INT,
    IN p_new_account_name VARCHAR(255),
    IN p_new_account_password VARCHAR(255),
    IN p_new_account_username VARCHAR(255)
)
BEGIN
    UPDATE accounts
    SET account_name = p_new_account_name,
        account_password = p_new_account_password,
        account_username = p_new_account_username
    WHERE account_name = p_old_account_name
      AND account_password = p_old_account_password
      AND account_username = p_old_account_username
      AND user_id = p_user_id;

    SELECT ROW_COUNT() AS modified_rows;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `getUserAccounts`(
    IN input_username VARCHAR(255)
)
BEGIN
    SELECT 
        a.user_id, 
        a.account_name, 
        a.account_username, 
        a.account_password, 
        u.username
    FROM accounts a
    JOIN users u ON a.user_id = u.user_id
    WHERE u.username = input_username;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `getUserById`(
    IN p_user_id INT
)
BEGIN
    SELECT * FROM users WHERE user_id = p_user_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `getUserCredentials`(IN input_username VARCHAR(255))
BEGIN
	SELECT user_id, password FROM users WHERE username = input_username;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `getUsers`()
BEGIN
	SELECT * FROM users;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `register`(IN username VARCHAR(255), IN password VARCHAR(255))
BEGIN
	INSERT INTO users (username, password) VALUES (username, password);
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `changeUserPassword`(IN in_user_id INT, IN in_password VARCHAR(255))
BEGIN
	UPDATE users 
    SET password = in_password WHERE user_id = in_user_id;
END$$
DELIMITER ;
