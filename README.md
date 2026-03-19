<html>
<div align="center"\>

# ⚡ SPIRELAY (Project Delta)
  
**High-Performance Algorithmic Spaced Repetition Engine for Engineering Students**
</div>
</html>

------------------------------------------------------------------------------------------

## table of contents
- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Current System Status](#current-system-status)
- [Getting Started (Local Development)](#getting-started-local-development)
  - [Prerequisites](#prerequisites)
  - [1. Environment Configuration](#1-environment-configuration)
  - [2. Start the Backend (API)](#2-start-the-backend-api)
  - [3. Start the Frontend (Client)](#3-start-the-frontend-client)
- [DevOps & Contribution Guidelines](#devops--contribution-guidelines)

## Overview

Spirelay (Project Delta) is a multi-tenant, full-stack educational platform engineered to automate the retention of complex Electrical and Computer Engineering (ECE) curriculum. By synthesizing modern vertical-feed engagement with a highly customized **SuperMemo-2 (SM-2) Spaced Repetition Algorithm**, Spirelay provides a personalized, mathematically optimized learning path to combat the "forgetting curve."

## Core Features

  * **🧠 Algorithmic "Smart Feed":** Dynamically interleaves subjects and prioritizes review content based on exponential memory decay calculations.
  * **🔐 Enterprise-Grade Security:** Full Role-Based Access Control (RBAC) via Supabase JWTs. Implements strict Lazy Syncing to maintain relational database integrity.
  * **👑 Admin Content Studio:** A protected backend and frontend environment allowing super-users to execute CRUD operations on the curriculum and manage tenant roles.
  * **⚙️ Global Settings Hub:** A centralized command center for users to manage preferences and administrators to access platform-wide diagnostic tools.

## Architecture & Tech Stack

The platform utilizes a strictly decoupled Three-Tier architecture:

  * **Presentation Layer (Frontend):** Next.js 14 (App Router), React, Tailwind CSS v4.
  * **Application Layer (Backend):** FastAPI (Python 3.12), Pydantic V2, Pytest.
  * **Data Layer:** PostgreSQL (hosted on Supabase Cloud) managed via SQLAlchemy 2.0 ORM.

-----

## Current System Status

  - **Authentication:** Supabase + JWT (Operational)
  - **Database:** PostgreSQL Cloud (Operational)
  - **CI/CD:** GitHub Actions (Operational)

-----

## Getting Started (Local Development)

To run this project locally, you will need two terminal windows open to run the frontend and backend simultaneously.

### Prerequisites

  * **Node.js** (v18+)
  * **Python** (v3.12+)
  * **Supabase** account and project (for Auth and PostgreSQL)

### 1\. Environment Configuration

Duplicate the `.env.example` files in both the frontend and backend directories and rename them to `.env`. Fill in your specific Supabase credentials.

**`backend/.env`**

```ini
SUPABASE_URL="your_supabase_project_url"
SUPABASE_KEY="your_supabase_service_role_key"
DATABASE_URL="your_supabase_postgresql_connection_string"
```

**`frontend/.env.local`**

```ini
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 2\. Start the Backend (API)

Open a terminal and navigate to the `backend` folder. Create a virtual environment, install dependencies, and launch the ASGI server:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

*The API will be available at `http://127.0.0.1:8000`*

### 3\. Start the Frontend (Client)

Open a second terminal and navigate to the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

*The client will be available at `http://localhost:3000`*

-----

## DevOps & Contribution Guidelines

This repository enforces strict industrial-grade CI/CD pipelines to ensure high availability and code integrity.

  * **Branch Protection:** The `main` branch is locked. Direct pushes are disabled.
  * **Pull Requests:** All changes must be submitted via a Pull Request (PR) and require at least 1 approval.
  * **Automated Status Checks:** GitHub Actions automatically provisions an Ubuntu runner on every PR to execute:
    1.  `frontend-build`: Verifies the Next.js production build (`npm run build`).
    2.  `backend-check`: Validates Python dependencies and executes SM-2 algorithmic unit tests via `pytest`.
  * Merges are **blocked** until all automated status checks pass.

-----

**Lead Architect:** Aiman Abed  
**Institution:** Spirelay Labs
