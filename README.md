# Stockman

Stockman is a full-stack stock-management application built with **Laravel** (backend API) and **React + Vite + Tailwind CSS** (frontend).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS v4 |
| Backend | Laravel 13 + Sanctum |
| Database | SQLite |
| Containerisation | Docker & Docker Compose |

## Quick Start (Docker)

```bash
# Build and run all services
docker-compose up --build -d

# Backend API  -> http://localhost:8000
# Frontend App -> http://localhost
```

## Project Structure

```
stockman/
├── stockman_backend/   # Laravel API
├── stockman_frontend/  # React SPA
├── docker-compose.yml
└── stock.svg           # App logo
```

## Git & GitHub

This repository is ready to be pushed to GitHub.

```bash
# Create a new repository on GitHub named "stockman"
# Then run:
git remote add origin https://github.com/<your-username>/stockman.git
git branch -M main
git push -u origin main
```
