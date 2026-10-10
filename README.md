# Healthy Life — User Management 

## Project Overview

**Healthy Life** is an integrated health and wellness platform developed collaboratively by students at Rey Juan Carlos University (URJC). The project is shared across six teams, each responsible for a specific component or subsystem of the platform.

This repository contains **E1 — User Management**, responsible for managing user accounts, identities, authentication, access control, and personal information. The subsystem is designed to integrate with the other components through interfaces agreed upon by the teams.

## Functionalities

The User Management subsystem covers the following functionalities:

- **User registration:** creating an account using an email address and password.
- **User authentication:** logging in with valid credentials.
- **Personal profile management:** managing personal user information.
- **Preference management:** configuring user preferences.
- **Privacy management:** managing how personal data is used.
- **Access control:** managing permissions and access to platform resources.

## Current Sprint

The initial sprint focuses on implementing a basic mock of the following user stories:

- **User registration:** users can register using their email address and password.
- **User login:** users can authenticate using their credentials.

## Technology Stack

- **React 19:** building the user interface.
- **TypeScript:** adding static typing to the application.
- **Vite:** providing the development server and production build tools.
- **ESLint:** analysing code and identifying potential issues.
- **JSON:** providing mock user data for the initial implementation.
- **SQLite:** planned for a future development stage as part of the agreed data storage approach.

The interface follows the visual identity of Rey Juan Carlos University (URJC), including its colours and styling.

## Project Structure

```text
Procesos-Software/
├── public/
│   └── users.json
├── src/
│   ├── context/
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── LICENSE
└── README.md
```

## File Description

- `index.html` — HTML entry point for the application.

### `src/`

- `App.tsx` — Main React application component. Implements the login and registration forms, displays error messages, shows the authenticated user's information, and provides the logout functionality.
- `main.tsx` — Application entry point. Renders the React application and wraps it with AuthProvider to make authentication state available throughout the application.
- `context/AuthContext.tsx` — Contains the authentication context, which manages user sessions and provides login, registration and logout functionality.
- `App.css` — Styles for the main application component.
- `index.css` — Global styles.

### `public/`

- `users.json` — Provides mock user data for the initial authentication implementation.

## Data Management

The application uses `public/users.json` as a mock data source for user authentication. 
SQLite is planned for a future development stage, following the agreements established by the project teams.


## Installation and Execution

## Prerequisites

To install and run the project, you need:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js

### 1. Clone the repository

```bash
git clone https://github.com/mmddll8/Procesos-Software.git
cd Procesos-Software
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development mode

```bash
npm run dev
```

Vite will show a local URL in the terminal where you can open the application.

### 4. Build and preview the application

To generate and preview the production build, run:

```bash
npm run build
npm run preview
```

Open the local URL displayed in the terminal to access the preview.

## Project Status

The subsystem is under active development, with the first sprint focused on basic user registration and login. Profile management, preferences, privacy, and access control are planned for future sprints.

