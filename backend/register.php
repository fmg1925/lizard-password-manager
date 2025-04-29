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
    echo json_encode(['message' => 'Could not connect to database ' . $e->getMessage()]);
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

if (!$conn) {
    http_response_code(500);
    echo json_encode(['message' => 'Connection failed: ' . mysqli_connect_error()]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? null;
$password = $data['password'] ?? null;

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required fields"]);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

try {
    $stmt = mysqli_prepare($conn, "CALL register(?, ?)");
    mysqli_stmt_bind_param($stmt, "ss", $username, $hashedPassword);

    mysqli_stmt_execute($stmt);

    http_response_code(200);
    echo json_encode(["message" => "User inserted successfully"]);

    mysqli_stmt_close($stmt);
    mysqli_close($conn);

} catch (mysqli_sql_exception $e) {
    $errorCode = $e->getCode();

    if ($errorCode == 1062) {
        http_response_code(409);
        echo json_encode(["message" => "Username already exists"]);
    } elseif ($errorCode == 1048) {
        http_response_code(400);
        echo json_encode(["message" => "Missing required fields"]);
    } elseif ($errorCode == 1064) {
        http_response_code(500);
        echo json_encode(["message" => "Database syntax error"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Internal server error", "error" => $e->getMessage()]);
    }
    exit;
}


mysqli_stmt_close($stmt);
mysqli_close($conn);
?>