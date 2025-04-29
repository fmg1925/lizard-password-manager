<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$inputData = json_decode(file_get_contents("php://input"), true);

$username = $inputData['username'];
$password = $inputData['password'];

$env = parse_ini_file(__DIR__ . '/../.env');

$db_host = $env['DB_HOST'];
$db_user = $env['DB_USER'];
$db_pass = $env['DB_PASS'];
$db_name = $env['DB_NAME'];

try {
    $conn = mysqli_connect($db_host, $db_user, $db_pass, $db_name);
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    json_encode(['message' => 'Could not connect to database ' . $e->getMessage()]);
    exit;
}

if (!$conn) {
    http_response_code(500);
    json_encode(['message' => 'Could not connect to database ' . $e->getMessage()]);
    exit;
}

$stmt = $conn->prepare('CALL checkExistingUsername(?)');
$stmt->bind_param('s', $username);

$stmt->execute();

$stmt->store_result();
$stmt->bind_result($userId, $storedUsername, $storedPassword, $createdAt);

if ($stmt->num_rows <= 0) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

$stmt->fetch();

if (password_verify($password, $storedPassword)) {
    echo json_encode(["success" => true, "message" => "Login successful"]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid password"]);
    http_response_code(401);
    exit;
}

$stmt->close();
$conn->close();
?>