# ShopCart — Web-Based Grocery Delivery System

A full-stack grocery delivery web application built for the Kenyan market, featuring Pesapal payment integration, real-time GPS delivery tracking, and automated order management.

## Live Demo

- Frontend: https://your-client-url.vercel.app
- Backend API: https://grocery-delivery-server-inky.vercel.app

## Tech Stack

**Frontend**
- React.js 18 + Vite + TypeScript
- Tailwind CSS
- React Router DOM
- Leaflet.js (GPS delivery tracking)
- Axios, React Hot Toast, Lucide React

**Backend**
- Node.js + Express.js 5
- TypeScript
- Prisma ORM v7 + Neon PostgreSQL
- Inngest (background jobs)
- Cloudinary (image storage)
- Nodemailer + Brevo SMTP (emails)
- JSON Web Tokens + Bcrypt

**Payment**
- Pesapal API 3.0 — M-Pesa, Airtel Money, Visa/Mastercard, Cash on Delivery

**Deployment**
- Vercel (frontend + backend)
- Neon PostgreSQL (database)

## Features

- User authentication with role-based access (Customer, Admin, Delivery Partner)
- Product catalogue with category filtering, search, price range, and organic filter
- Shopping cart with localStorage persistence
- Three-step checkout: address, payment method, order review
- Pesapal payment integration supporting M-Pesa, Airtel Money, and card payments
- Real-time GPS delivery tracking on an interactive map
- 6-digit OTP delivery confirmation system
- Automated delivery rider assignment via Inngest background jobs
- Low stock email alerts and monthly promotional campaigns
- Admin dashboard for product and order management
- Delivery partner portal with status updates and OTP entry

## Getting Started

**Prerequisites**
- Node.js v18 or higher
- A Neon PostgreSQL database
- A Pesapal sandbox account
- A Cloudinary account

**Clone the repository**

    git clone https://github.com/FREDRICKMUMU/Grocery-Delivery.git
    cd Grocery-Delivery

**Setup the server**

    cd server
    npm install
    cp .env.example .env
    npx prisma generate
    npx prisma db push
    npm run seed
    npm run server

**Setup the client**

    cd client
    npm install
    cp .env.example .env
    npm run dev

## Environment Variables

Create a `.env` file in the server directory:

    DATABASE_URL=
    JWT_SECRET=
    ADMIN_EMAILS=
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
    INNGEST_EVENT_KEY=
    INNGEST_SIGNING_KEY=
    SMTP_USER=
    SMTP_PASS=
    SENDER_EMAIL=
    PESAPAL_CONSUMER_KEY=
    PESAPAL_CONSUMER_SECRET=
    PESAPAL_ENV=sandbox
    PESAPAL_IPN_ID=
    CLIENT_URL=
    SERVER_URL=

## Project Structure

    Grocery-Delivery/
      client/         React.js frontend
      server/         Express.js REST API
        controllers/  Route handlers
        routes/       API routes
        middleware/   Auth and admin guards
        config/       Prisma, Pesapal, Cloudinary setup
        inngest/      Background job functions
        prisma/       Database schema

## Author

Fredrick Mumu Munyao
GitHub: https://github.com/FREDRICKMUMU

## License

MIT
