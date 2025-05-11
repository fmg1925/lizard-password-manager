<?php

require_once '../config/basedatos.php';

class User
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = getConnection();
    }

    public function login($username, $password)
    {
        try {
            $query = "CALL checkExistingUsername(?)";
            $stmt  = $this->pdo->prepare($query);

            $stmt->execute([$username]);
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            $stmt->closeCursor();

            if (!$resultado || !password_verify($password, $resultado['password'])) {
                http_response_code(401);
                echo json_encode(["success" => false, "message" => "Invalid username or password"]);
                exit;
            }

            echo json_encode(["success" => true, "message" => "Login successful"]);
            exit;

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Internal server error"]);
            exit;
        }
    }

    public function register($username, $password)
    {
        if (! $username || ! $password) {
            http_response_code(400);
            echo json_encode(["message" => "Missing required fields"]);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        try {
            $query = "CALL register(?, ?)";
            $stmt  = $this->pdo->prepare($query);
            $stmt->execute([$username, $hashedPassword]);
            $stmt->closeCursor();

            http_response_code(200);
            echo json_encode(["message" => "User inserted successfully"]);
            exit;
        } catch (PDOException $e) {
            $errorCode = $e->errorInfo[1] ?? null;

            if ($errorCode == 1062) {
                http_response_code(409);
                echo json_encode(["message" => "Username already exists"]);
                exit;
            } elseif ($errorCode == 1048) {
                http_response_code(400);
                echo json_encode(["message" => "Missing required fields"]);
                exit;
            } elseif ($errorCode == 1064) {
                http_response_code(500);
                echo json_encode(["message" => "Database syntax error"]);
                exit;
            } else {
                http_response_code(500);
                echo json_encode([
                    "message" => "Internal server error",
                    "error"   => $e->getMessage(),
                ]);
            }
            return false;
        }
    }
}
?>