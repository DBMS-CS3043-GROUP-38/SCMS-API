# Supply Chain Management API

The **Supply Chain Management API** serves as the backbone of the platform, handling data processing, order management, and inventory operations. It is built using **Node.js** and provides robust functionality for all system components.

---

## 🛠 Setup Instructions

### Prerequisites

- Ensure **Node.js** and **npm** are installed on your machine.
- Have a **MySQL database** ready for the application.

### Steps

1. **Create the ************************`.env`************************ File**:

   - Configure environment variables in a `.env` file at the root of the project:
     ```
     MYSQL_HOST=
     MYSQL_USER=
     MYSQL_PASSWORD=
     MYSQL_DATABASE=scms
     PORT=3000
     HASH_COUNT=10
     JWT_SECRET=
     ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up the Database**:

   - Run all `.ddl` files located in:
     ```
     utilities\database\definition_files
     ```
     This will set up the necessary database schema.

4. **Initialize the Database** (Optional):

   - Populate the database with dummy data:
     ```bash
     npm run initialise-database
     ```

5. **Start the API Server**:

   ```bash
   npm start
   ```
6. **Run the Truck Scheduler Daemon**:

   - To run the truck scheduler daemon process, execute:
     ```bash
     npm run truck-scheduler
     ```

---

## 🚀 Scripts

### Available npm Scripts

| Script                        | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `npm start`                   | Starts the API server using `nodemon`.      |
| `npm run initialise-database` | Populates the database with dummy data.     |
| `npm run simulate-orders`     | Simulates fake orders for testing purposes. |
| `npm run truck-scheduler`     | Runs the truck scheduler daemon process.    |

### Truck Scheduler Daemon

- **Purpose**: Periodically assigns drivers and assistants to shipments.
- **Cron Schedule**: Modify the scheduling frequency in the code. For real usage, a **2-hour interval** is ideal; for testing, a **1-minute interval** can be used.
  ```javascript
  cron.schedule('* * * * *', async () => {
      // Modify the interval as needed.
  });
  ```

---

## 💡 Features

- **Database Initialization**:
  - Sets up the schema and populates initial data.
- **Order Simulation**:
  - Simulates orders for testing system features.
- **Truck Scheduler**:
  - Manages driver and assistant assignments for shipments.
- **API Endpoints**:
  - Provides endpoints for all system components.
- **JWT Authentication**:
  - Secures API endpoints using JWT tokens.

---

## 🧩 Contribution Guidelines

We welcome contributions to this API. Please ensure you:

- Follow the coding conventions.
- Test your changes thoroughly.
- Document any new functionality