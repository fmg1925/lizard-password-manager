<?php
function getConnection() {

    $env = parse_ini_file(__DIR__ . '/../.env');
    $host = stripos(PHP_OS, 'Linux') === 0 ? '127.0.0.1' : 'localhost';
    $dbname = $env['DB_NAME'];
    $username = $env['DB_USER'];
    $password = $env['DB_PASS'];

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=UTF8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch(PDOException $e) {
        die("Error en la conexión " . $e->getMessage());
    }
}
?>