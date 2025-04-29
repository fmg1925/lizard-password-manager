Sitio web: https://lizard-password-manager.onrender.com

Gestor de contraseñas hecho en NodeJS y MySQL + PHP (branch PHP).

Se usan las siguientes librerías de NodeJS:

dotenv\
express\
mysql2\
cors\
bcryptjs\
crypto\
path

Se usan las siguientes librerías de PHP:

php-mysqli

**Funcionalidades:**\
Registro e inicio de sesión.\
Encripción de contraseña maestra.\
Encripción de contraseñas de cada cuenta del usuario a través de la contraseña maestra.\
Adaptado para dispositivos móviles.\
Modo claro y modo oscuro.\
Generador de contraseñas desde 16 a 32 carácteres, capacidad de elegir si usará letras, números y/o símbolos.\
Sin límite de cuentas por usuario.\
Información privada almacenada en .env\
Configuración adaptable desde el .env

**Cómo instalar:**

Prerequisitos:\
NodeJS\
Servidor PHP

Descargar el repositorio:\
git clone https://github.com/fmg1925/lizard-password-manager.git

Instalar:\
cd lizard-password-manager\
npm i\
Ejecutar las consultas en MySQL

Uso:\
node backend.js

Uso (php):\
node backend.js\
php -S 127.0.0.1:8000

En caso de fallos (testing local):\
Asignar los puertos manualmente a las URLs en los archivos js.