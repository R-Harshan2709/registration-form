# ✨ Premium Full-Stack Registration System ✨

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
</p>

Welcome to the ultimate Full-Stack Registration System! This isn't just another sign-up form; it's a complete, production-ready application featuring a stunning, animated React frontend and a powerful Express.js backend with a unique dual-storage database system.

This project is designed to be both visually impressive and functionally robust, providing a seamless user experience and a developer-friendly codebase.

---

### 🎨 Live Preview & Showcase

*(Imagine a stunning GIF here showcasing the animated UI, glass morphism effects, and smooth form submission process)*

The user interface is built to impress, featuring:
- **Glass Morphism:** A modern, blurred glass effect on the form container.
- **Animated Gradient Background:** A beautiful, subtly moving gradient that brings the page to life.
- **Floating Particle Effects:** Interactive particles that float across the screen.
- **Smooth Animations & Transitions:** Every interaction, from input focus to button clicks, is animated.

---

## 🚀 Key Features

### **Frontend (React)**
- **✨ Modern UI/UX:** A beautiful and engaging interface built with React.
- **📸 Profile Photo Upload:** With instant client-side preview and validation.
- **📝 Comprehensive Form:** Over 18 fields for detailed user profiles.
- **🔒 Real-time Validation:** Instant feedback on form inputs to guide the user.
- **📱 Fully Responsive:** Flawless experience on desktop, tablet, and mobile devices.
- **🎉 Success & Error Toasts:** Clear, non-intrusive notifications for user actions.
- **🔄 Fresh Form State:** The form intelligently resets after submission and prevents browser auto-fill of old data.

### **Backend (Node.js & Express)**
- **🔐 Secure Authentication:** Passwords hashed using `bcrypt`.
- **🔄 Dual Storage System:** A unique architecture that writes to both a local JSON file and a MongoDB database simultaneously.
- **📁 Robust File Handling:** Securely manages profile photo uploads using `multer`.
- **🛡️ Advanced Validation:** Server-side validation using `Joi` to ensure data integrity.
- **🌐 CORS & Security:** Pre-configured with CORS, Helmet for security headers, and rate-limiting.
- **📊 Data Migration:** Includes scripts to easily migrate data from the JSON file to MongoDB.
- **📈 Health & Stats Endpoints:** Built-in endpoints to monitor application health and user statistics.

---

## 🛠️ Tech Stack

| Category      | Technology                                                                                                                                                           |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Frontend**  | `React.js`, `Axios`, `CSS3` (with animations)                                                                                                                        |
| **Backend**   | `Node.js`, `Express.js`                                                                                                                                              |
| **Database**  | **Dual Storage:** `MongoDB` (with Mongoose) & `JSON File`                                                                                                            |
| **Security**  | `bcrypt` (Password Hashing), `Joi` (Validation), `Helmet` (Security Headers)                                                                                         |
| **File Upload**| `Multer`                                                                                                                                                             |
| **Dev Tools** | `Nodemon` (Live Reload), `dotenv` (Environment Variables)                                                                                                            |

---

## 📂 Project Structure

```
registration-form/
├── backend-node/
│   ├── data/
│   │   └── users.json         # File-based database
│   ├── models/
│   │   ├── DualStorage.js     # Logic for dual writing
│   │   └── User.js            # Mongoose User Schema
│   ├── routes/
│   │   └── userRoutesDual.js  # API routes
│   ├── uploads/               # Stores profile pictures
│   ├── .env                   # Environment variables
│   ├── migrate.js             # Migration script
│   ├── package.json
│   └── server-dual.js         # Main Express server file
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── AttractiveRegistrationForm.js
    │   ├── App.css
    │   └── App.js
    └── package.json
```

---

## ⚙️ Installation & Setup

Follow these steps to get the application running on your local machine.

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/try/download/community) (Optional, but recommended for full functionality)

### **1. Backend Setup**

```bash
# 1. Navigate to the backend directory
cd backend-node

# 2. Install dependencies
npm install

# 3. Create an environment file
# Create a file named .env in the backend-node directory and add the following:
# (The app will fall back to the JSON file if MONGO_URI is missing)
PORT=5000
MONGO_URI=mongodb://localhost:27017/registration_system
ENCRYPTION_KEY=a_super_secret_32_character_key_!

# 4. Start the backend server
npm start
```
The backend will be running at `http://localhost:5000`.

### **2. Frontend Setup**

```bash
# 1. Open a new terminal and navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the React development server
npm start
```
The frontend will open automatically at `http://localhost:3000`.

---

## 🚀 Running the Application

- **Backend Server**: `npm start` in the `backend-node` directory.
- **Frontend Dev Server**: `npm start` in the `frontend` directory.

### **Available Scripts (Backend)**
- `npm run dev`: Starts the server with `nodemon` for live-reloading during development.
- `npm run migrate-to-mongo`: Migrates all users from `users.json` to your MongoDB database.
- `npm run migrate-to-file`: Syncs users from MongoDB back to the `users.json` file.

---

## API Endpoints

Here are the main API endpoints provided by the Express backend:

| Method | Endpoint                  | Description                               |
|--------|---------------------------|-------------------------------------------|
| `POST` | `/api/users/register`     | Registers a new user (saves to both DBs). |
| `GET`  | `/api/health`             | Checks the health of the server and DBs.  |
| `GET`  | `/api/users/admin/stats`  | Gets user statistics.                     |
| `GET`  | `/api/users`              | Retrieves all users (from MongoDB).       |

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or find a bug, feel free to fork the repository and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

<p align="center">
  Made with ❤️ and a lot of code.
</p>
