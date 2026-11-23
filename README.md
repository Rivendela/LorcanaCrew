# 🌟 CCREW - Caldereta Crew: Liga de Disney Lorcana

Aplicación web moderna y completa para gestionar la liga semanal de **Disney Lorcana** del grupo **CCREW (Caldereta Crew)**.

Diseñada para comunidades de entre 15 y 20 iluminadores, con soporte para partidas competitivas al mejor de tres (**Bo3**), asignación de puntos, privacidad de colores de baraja, panel de comisionado con control absoluto y sistema de copias de seguridad automáticas.

---

## 🚀 Tecnologías Utilizadas

* **Framework Principal:** [Next.js 16 (App Router)](https://nextjs.org/) con compilador de alto rendimiento **Turbopack**.
* **Librería de UI:** [React 19](https://react.dev/).
* **Lenguaje:** [TypeScript 5](https://www.typescriptlang.org/) para un tipado estricto y seguro de datos.
* **Estilos & Diseño:** [Tailwind CSS 4](https://tailwindcss.com/) con tema oscuro inmersivo inspirado en el Lore de Disney Lorcana.
* **Iconografía:** [Lucide React](https://lucide.dev/).
* **Seguridad & Autenticación:**
  * **JWT (JSON Web Tokens)** mediante [`jose`](https://github.com/panva/jose) con cookies `HttpOnly` y `SameSite`.
  * **Cifrado de contraseñas** con [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js).
  * **Control de Acceso por PIN** con teclado táctil interactivo en middleware.
* **Base de Datos & Almacenamiento:**
  * Sistema de persistencia basado en JSON estructurado (`data/database.json`).
  * Caché en memoria sincronizada con validación por fecha de modificación (`mtime`) de alta velocidad.
  * Compatibilidad nativa con el entorno serverless de **Vercel** (`/tmp/data` con autorrecuperación de seed).

---

## ✨ Características Principales

### 1. 🛡️ Barrera de Seguridad por PIN (`8585`)
* Acceso exclusivo para el grupo de amigos. Nadie ajeno a la crew puede ver la web sin ingresar el PIN de bienvenida.
* Teclado numérico táctil interactivo con desbloqueo instantáneo y cookie protegida `lorcana_gate_pin`.

### 2. 🏆 Puntuación Competitiva Bo3 (Al mejor de 3)
* **Victoria:** 3 puntos.
* **Empate:** 1 punto.
* **Derrota:** 0 puntos.
* **Criterios de Desempate:** Puntos totales > Diferencial de partidas Bo3 (+/-) > Resultado directo (Cara a cara) > Partidas ganadas.

### 3. ⚔️ Formatos de Juego Oficiales y de la Crew
Permite alternar el formato de cada jornada o temporada:
* **Porcana:** Formato especial de la Caldereta Crew.
* **Core Constructed:** Formato oficial (60 cartas, hasta 2 tintas).
* **Infiniti:** Formato libre y partidas casuales.

### 4. 🎨 Gestión Simplificada de Tintas & Privacidad
* No es necesario registrar listas completas de mazo, únicamente los dos colores de tinta del jugador (**Ámbar, Amatista, Esmeralda, Rubí, Zafiro, Acero**).
* **Modo Público / Privado:** Cada jugador puede decidir en su perfil si sus colores son públicos o mantenerlos en secreto. Para los rivales aparecerán con la insignia **`🔒 Oculto`**, mientras que el jugador y el administrador siempre podrán verlos.

### 5. 👤 Perfil de Jugador y Estadísticas Detalladas
* Selector de avatar con personajes icónicos de Lorcana (Mickey Hechicero, Elsa, Maléfica Dragón, Stitch, Úrsula, Robin Hood, etc.).
* Campo para **Carta Favorita** (ej. *Elsa - Espíritu del Invierno*, *Be Prepared*) y biografía o lema del jugador.
* Estadísticas personales en tiempo real: Partidos Bo3 (PJ, PG, PE, PP), Games individuales a favor y en contra, Diferencial (+/-), Porcentaje de efectividad (Win Rate) e historial de enfrentamientos.

### 6. 👑 Panel de Comisionado (Administrador)
* **Gestión de Jornadas:** Generación automática de emparejamientos mediante algoritmo **Round Robin** (todos contra todos), con soporte para jornadas impares y descansos (BYE).
* **Control de Lanzamiento:** El admin revisa y valida los resultados antes de abrir oficialmente la siguiente jornada.
* **Editor de Partidos:** Corrección de marcadores en caso de error o reclamación.
* **CRUD de Iluminadores:** Crear jugadores manualmente, editar datos, resetear contraseñas o eliminarlos.
* **Gestión de Temporadas & Reseteo:** Avanzar a nuevas temporadas o reiniciar la liga manteniendo a los jugadores.
* **Copias de Seguridad (Backups JSON):**
  * Descarga directa en JSON del estado completo de la liga con un solo clic.
  * Restauración rápida cargando un archivo `.json`.
  * Copias automáticas archivadas en `data/backups/` tras cada jornada finalizada.

---

## 🛠️ Instalación y Puesta en Marcha

### Prerrequisitos
* [Node.js](https://nodejs.org/) versión **20.x** o superior.
* Gestor de paquetes `npm` (incluido con Node.js).

### 1. Clonar el repositorio
```bash
git clone <URL_DE_TU_REPOSITORIO>
cd LIGA_LORCANA
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de Entorno (Opcional)
Puedes crear un archivo `.env.local` en la raíz para configurar tu propia clave de firma de tokens:
```env
JWT_SECRET=tu-clave-secreta-personalizada-para-produccion
```
*(Si no se define, se utilizará una clave segura por defecto).*

### 4. Ejecutar en Modo Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### 5. Compilar y Ejecutar en Modo Producción
Para validar y correr la versión optimizada:
```bash
npm run build
npm start
```

---

## 🔑 Credenciales por Defecto

* **PIN de Acceso Inicial:** `8585`
* **Usuario Administrador (Comisionado):**
  * **Usuario:** `admin`
  * **Contraseña:** `lechuga12345`

*(Nota: Los jugadores regulares se registran desde la opción "Unirme" / "Crear Perfil" o pueden ser dados de alta por el Comisionado desde `/admin`).*

---

## 📦 Estructura del Proyecto

```text
├── data/
│   └── database.json          # Base de datos JSON inicial (usuarios, ligas, partidos)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/             # Panel de administración y comisionado
│   │   ├── api/               # Endpoints REST (auth, profile, rounds, matches, admin, pin)
│   │   ├── jornadas/          # Visualizador de rondas semanales y partidos Bo3
│   │   ├── jugadores/         # Directorio de la comunidad de iluminadores
│   │   ├── login/             # Inicio de sesión
│   │   ├── meta/              # Gráficas y metajuego de colores de tinta
│   │   ├── perfil/            # Ficha del jugador, estadísticas y privacidad
│   │   ├── pin/               # Pantalla de desbloqueo con teclado numérico
│   │   ├── register/          # Registro de nuevos jugadores
│   │   ├── layout.tsx         # Layout principal con Navbar y fondo temático de Lorcana
│   │   └── page.tsx           # Portada con podio y Tabla de Clasificación General
│   ├── components/            # Componentes reutilizables (AvatarBadge, InkBadge, MatchCard, StandingsTable...)
│   ├── lib/                   # Lógica de negocio (auth, db, league-engine, constants)
│   ├── types/                 # Definiciones de tipos TypeScript
│   └── middleware.ts          # Middleware de protección por PIN de grupo
├── .gitignore                 # Archivos excluidos del control de versiones
├── next.config.ts             # Configuración de Next.js
└── package.json               # Dependencias y scripts del proyecto
```

---

## 📤 Cómo Subir el Proyecto a GitHub / GitLab

Si es la primera vez que subes el proyecto a tu cuenta de Git:

1. **Inicializar Git en la carpeta del proyecto:**
   ```bash
   git init
   ```

2. **Añadir los archivos al commit:**
   ```bash
   git add .
   ```

3. **Crear el primer commit:**
   ```bash
   git commit -m "feat: Lanzamiento oficial CCREW Liga de Lorcana"
   ```

4. **Vincular con tu repositorio remoto:**
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   ```

5. **Subir los cambios:**
   ```bash
   git push -u origin main
   ```

---

## ☁️ Despliegue en Vercel

El proyecto está preparado para desplegarse en [Vercel](https://vercel.com/) con **cero configuración adicional**:

1. Entra en tu panel de Vercel e importa el repositorio de GitHub.
2. Vercel detectará automáticamente **Next.js**.
3. (Opcional) En la sección **Environment Variables**, añade `JWT_SECRET` con un valor seguro.
4. Pulsa en **Deploy**.
5. ¡Listo! Tu liga estará en línea con HTTPS y accesible para todo el grupo de amigos.

---

## 🧙‍♂️ Licencia y Créditos
Desarrollado para el grupo **CCREW (Caldereta Crew)**.
*Disney Lorcana* es una marca registrada de **Disney** y **Ravensburger**. Este proyecto es una aplicación comunitaria sin ánimo de lucro diseñada para el disfrute entre amigos.
