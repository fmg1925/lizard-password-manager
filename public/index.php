<?php

$controller = isset($_GET['controller']) ? $_GET['controller'] : '';
$action = isset($_GET['action']) ? $_GET['action'] : '';

if(!$controller && !$action) return header('Location: ../view/register.html');

$controllerFile = '../Controller/' . $controller . 'Controller.php';

if(file_exists($controllerFile)) {
    require $controllerFile;
    $controllerClass = $controller . 'Controller';
    $controllerInstance = new $controllerClass();
    
    if(method_exists($controllerInstance, $action)) {
        $controllerInstance->$action();
    } else {
        echo 'No existe la acción ' . $action;
    }
} else {
    echo 'No existe el controlador ' . $controller;
}

?>