# Event Manager

Event Manager is a fullstack web application designed to help users create, manage, and participate in events. This project is built with Flask on the backend and React (with Vite) on the frontend, utilizing SQLAlchemy for database management. It features a user-friendly interface for managing events, groups, and participants with support for CRUD operations and many-to-many relationships.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features
- **User Authentication**: Secure login and registration functionality.
- **Create, Update, Delete Events**: Full CRUD support for event management.
- **Group Management**: Users can create and join groups for collaborative event management.
- **Many-to-Many Relationships**: Groups and events have a many-to-many relationship, managed with SQLAlchemy.
- **Responsive Design**: The frontend is responsive and works on various devices.
- **Event Search and Filters**: Search for events by various criteria.

## Tech Stack
- **Frontend**: 
  - [React](https://reactjs.org/)
  - [Vite](https://vitejs.dev/)
- **Backend**: 
  - [Flask](https://flask.palletsprojects.com/)
  - [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database**: 
  - SQLite (development)
  - PostgreSQL (production)
- **Styling**: 
  - Tailwind CSS / Material UI (optional)
- **State Management**: 
  - [Redux](https://redux.js.org/)
- **Authentication**: 
  - Flask-Login or JWT (depending on your implementation)
- **Version Control**: 
  - [Git](https://git-scm.com/) & [GitHub](https://github.com/)

## Installation

### Prerequisites
- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 14+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/)

### Backend (Flask)
1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/event-manager.git
    cd event-manager
    ```

2. Create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate   # On Windows use `venv\Scripts\activate`
    ```

3. Install the Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Set up environment variables:
    Create a `.env` file in the root of your backend directory with the following:
    ```bash
    FLASK_APP=app.py
    FLASK_ENV=development
    SECRET_KEY=your_secret_key
    SQLALCHEMY_DATABASE_URI=sqlite:///events.db
    ```

5. Initialize the database:
    ```bash
    flask db init
    flask db migrate
    flask db upgrade
    ```

6. Run the Flask server:
    ```bash
    flask run
    ```

### Frontend (React + Vite)
1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2. Install the JavaScript dependencies:
    ```bash
    npm install
    ```

3. Start the Vite development server:
    ```bash
    npm run dev
    ```

## Usage
1. Navigate to the frontend on your browser by visiting `http://localhost:3000`.
2. Access the backend API via `http://localhost:5000/api/`.
3. Register and log in to create and manage events and groups.
4. You can view, edit, or delete events that you have created.

## API Endpoints
Here are some of the key API endpoints for the project:

- **User Authentication**
  - `POST /api/auth/register`: Register a new user
  - `POST /api/auth/login`: Log in a user

- **Events**
  - `GET /api/events`: Get all events
  - `POST /api/events`: Create a new event
  - `GET /api/events/:id`: Get a specific event
  - `PUT /api/events/:id`: Update an event
  - `DELETE /api/events/:id`: Delete an event

- **Groups**
  - `GET /api/groups`: Get all groups
  - `POST /api/groups`: Create a new group
  - `GET /api/groups/:id`: Get a specific group
  - `PUT /api/groups/:id`: Update a group
  - `DELETE /api/groups/:id`: Delete a group

## Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request. Please ensure your pull request adheres to the following guidelines:
- Follow the style guide.
- Write clear, concise commit messages.
- Ensure all new features are documented.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

