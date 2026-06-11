# Internship & Placement Portal

A full-stack Internship and Placement Portal built using Node.js, Express, SQLite, HTML, CSS, JavaScript, Docker, and Docker Compose.

## Features

- Student Registration
- Student Login
- Resume Upload
- Add Internship / Job
- View Jobs
- Apply for Jobs
- View Applications
- SQLite Database Integration
- Dockerized Backend & Frontend

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js
- SQLite3
- Multer

### DevOps
- Docker
- Docker Compose

## Deployment Notes

- The backend requires `backend/.env` on the host because Docker Compose loads `env_file: ./backend/.env`.
- Copy `backend/.env.example` to `backend/.env` and fill in your AWS and app values before starting on EC2.

## Project Structure

```txt
Intership-portal/
│── backend/
│── frontend/
│── docker-compose.yml
│── README.md
│── .gitignore
