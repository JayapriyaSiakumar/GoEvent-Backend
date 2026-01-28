# Go-Event Backend

This is a RESTful API for managing events. It includes endpoints for creating, reading, updating and deleting events, as well as endpoints for managing bookings, payments and schedules.

## Features

- User authentication and authorization
- Event creation, reading, updating and deletion
- Booking creation, reading, updating and deletion
- Payment creation, reading, updating and deletion
- Schedule creation, reading, updating and deletion

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- Cloudinary
- Stripe
- Brevo
- Nodemon
- Cors

## API Endpoints

### Events

- `GET /events` - Get all events
- `POST /events` - Create a new event
- `GET /events/:id` - Get a specific event
- `PUT /events/:id` - Update a specific event
- `DELETE /events/:id` - Delete a specific event

### Bookings

- `GET /bookings` - Get all bookings
- `POST /bookings` - Create a new booking
- `GET /bookings/:id` - Get a specific booking
- `PUT /bookings/:id` - Update a specific booking
- `DELETE /bookings/:id` - Delete a specific booking

### Payments

- `GET /payments` - Get all payments
- `POST /payments` - Create a new payment
- `GET /payments/:id` - Get a specific payment
- `PUT /payments/:id` - Update a specific payment
- `DELETE /payments/:id` - Delete a specific payment

### Schedules

- `GET /schedules` - Get all schedules
- `POST /schedules` - Create a new schedule
- `GET /schedules/:id` - Get a specific schedule
- `PUT /schedules/:id` - Update a specific schedule
- `DELETE /schedules/:id` - Delete a specific schedule

## Installation and Setup

1. Clone the repository
2. Install the dependencies using `npm install`
3. Set up the environment variables in the `.env` file
4. Start the server using `npm start`
5. Use a tool like Postman to test the API endpoints
