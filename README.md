# CareConnect – Home Services Booking & Operations Platform

CareConnect is a full-stack MERN and AI-powered platform designed to simplify the discovery, booking, management, and support of home services such as appliance repair, cleaning, plumbing, electrical work, and general maintenance.

The platform connects customers with service providers while enabling operations teams and support staff to manage service requests, bookings, verification, disputes, invoices, notifications, and analytics.

## Key Features

### Customer
- Create and submit service requests
- AI-assisted service classification
- View matched and ranked service providers
- Compare provider profiles
- Request and accept quotes
- Book home services
- Track booking and service progress
- View invoices and payment status
- Submit reviews and ratings
- Raise disputes
- Receive notifications

### Service Provider
- Create and manage professional profiles
- Submit verification documents
- Manage service availability
- View matched service requests
- Submit service quotes
- Accept and manage bookings
- Update job progress
- Upload service evidence
- Generate invoices
- Respond to customer reviews

### Platform Admin
- Manage service categories
- Manage service pricing
- Verify service providers
- Monitor service requests and bookings
- Manage disputes and refunds
- View analytics
- Monitor platform activity
- Maintain audit logs

### Operations Manager
- Monitor service operations
- Manage requests and bookings
- Track providers
- Handle operational issues
- Monitor service progress

### Support Agent
- Handle customer and provider disputes
- Monitor booking-related issues
- Assist with issue resolution
- Track support activities

## AI Features

CareConnect includes AI-assisted capabilities for:

- Service request classification
- Provider matching
- Provider ranking
- Intelligent service recommendations

The AI layer works together with rule-based business logic, provider skills, availability, service requirements, and platform data.

## Booking Workflow

Customer
↓
Create Service Request
↓
AI Classification
↓
Provider Matching & Ranking
↓
Quote / Provider Selection
↓
Booking
↓
Provider Confirmation
↓
Provider In Transit
↓
Checked In
↓
Work In Progress
↓
Work Completed
↓
Customer Sign-Off
↓
Closed

The system also supports cancellation and dispute workflows.

## Technology Stack

### Frontend
- React.js
- Vite
- React Router
- Axios
- Responsive UI
- CSS animations and interactive components

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Role-Based Access Control
- REST APIs

### AI
- AI-assisted service classification
- Rule-based matching
- Provider ranking engine

### Cloud Services
- MongoDB Atlas
- Vercel
- Render
- Cloudinary

## User Roles

- Customer
- Service Provider
- Operations Manager
- Platform Admin
- Support Agent

Each role has dedicated permissions and access based on role-based access control and ownership validation.

## Project Structure

care-connect/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
│
└── README.md

## Environment Variables

### Backend

```env
PORT=5000
NODE_ENV=development

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

MONGODB_URI=your_mongodb_connection_string

OPS_MANAGER_PASSWORD=your_password
PLATFORM_ADMIN_PASSWORD=your_password
SUPPORT_AGENT_PASSWORD=your_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
