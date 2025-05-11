<?php

require '../model/User.php';

class UserController
{

    public function login()
    {
        $input    = json_decode(file_get_contents('php://input'), true);
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;

        // Validar campos
        if (! $username || ! $password) {
            http_response_code(400); // Bad Request
            echo json_encode(['message' => 'Username and password are required']);
            return;
        }

        // Procesar login
        $user  = new User();
        $login = $user->login($username, $password);

        // Retornar resultado como JSON
        header('Content-Type: application/json');

        if ($login) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(401); // Unauthorized
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        }
    }

    public function register()
    {
        $input    = json_decode(file_get_contents('php://input'), true);
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;

        // Validar campos
        if (! $username || ! $password) {
            http_response_code(400); // Bad Request
            echo json_encode(['error' => 'Username and password are required']);
            return;
        }

        // Procesar login
        $user     = new User();
        $register = $user->register($username, $password);

        // Retornar resultado como JSON
        header('Content-Type: application/json');

        if ($register === true) {
            http_response_code(201);
            echo json_encode(['success' => true]);
        } elseif ($register === 'duplicate') {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Username already exists']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Register failed']);
        }
    }
}
?>