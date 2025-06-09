# HabitTrax

**HabitTrax** is a daily habit tracker designed to help users build and maintain positive routines. The application provides statistics and visualizations to monitor progress over time.

## ✨ Features

- 📅 Track daily habits with ease
- 📊 Visualize habit completion statistics
- 🔔 Set reminders to stay on track
- 🌙 Dark mode support for comfortable nighttime use
- 📱 Responsive design for mobile and desktop

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Backend**: Node.js with Express
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/)
- **Containerization**: Docker
- **Deployment**: Fly.io

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Docker](https://www.docker.com/) (for containerization)
- [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) (for deployment)

### 📦 Install Dependencies

```bash
npm install
````

### 🧪 Set Up Environment Variables

Create a `.env` file in the root directory and add necessary environment variables.
Refer to `.env.example` for guidance.

### 💻 Running Locally

Start the development server:

```bash
npm run dev
```

Then visit `http://localhost:3000` in your browser.

---

# 🐳 Docker Usage

To build and run the application using Docker:

```bash
docker build -t habittrax .
docker run -p 3000:3000 habittrax
```

---

# ☁️ Deployment with Fly.io

## Step 1: Log in to Fly.io

```bash
flyctl auth login
```

## Step 2: Initialize Configuration

```bash
flyctl launch
```

## Step 3: Deploy the App

```bash
flyctl deploy
```

---

# 🤝 Contributing

We welcome contributions! Here's how to get started:

* Fork the repository

* Create a new branch:

  ```bash
  git checkout -b feature/your-feature-name
  ```

* Commit your changes:

  ```bash
  git commit -m "Add your message"
  ```

* Push to your fork:

  ```bash
  git push origin feature/your-feature-name
  ```

* Open a pull request on GitHub

