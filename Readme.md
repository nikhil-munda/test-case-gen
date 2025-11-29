# Test Case Generator

A full-stack application for generating test cases, featuring a Node.js/TypeScript backend using gemini api
and docker to run code with subscription feature using
razorpay with Prisma ORM and a Next.js frontend.

## Project Structure

- **Server/**: Backend API built with Node.js, TypeScript, Express, and Prisma
- **web/**: Frontend built with Next.js
- **docker/**: Docker configurations for containerization
- **.github/workflows/**: CI/CD pipeline for deployment

## Features

- User authentication (including Google OAuth)
- Test case generation
- Subscription management with Razorpay integration
- Cron jobs for automated tasks
- Cloudinary integration for file uploads

## Prerequisites

- Node.js 20+
- Docker (optional, for containerized deployment)
- PostgreSQL database (for Prisma)

## Setup

### Backend (Server)

1. Navigate to the Server directory:

   ```bash
   cd Server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the Server directory with necessary variables (e.g., database URL, JWT secrets, OAuth keys).

4. Run Prisma migrations:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. Build and run:
   ```bash
   npm run build
   npm start
   ```

### Frontend (Web)

1. Navigate to the web directory:

   ```bash
   cd web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Docker

To run the entire application using Docker:

1. Build the server image:

   ```bash
   docker build -t test-case-server .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 test-case-server
   ```

Note: Ensure database and other services are properly configured for production use.

## Deployment

The project includes a GitHub Actions workflow for deployment. Push to the main branch to trigger automatic deployment.

### AWS EC2 with Nginx

1. **Launch EC2 Instance**:

   - Choose Amazon Linux 2 or Ubuntu AMI
   - Select t2.micro or t3.small for development
   - Configure security group: Allow SSH (22), HTTP (80), HTTPS (443)

2. **Install Dependencies**:

   ```bash
   sudo yum update -y  # For Amazon Linux
   sudo yum install -y nodejs npm nginx git
   # Or for Ubuntu:
   # sudo apt update && sudo apt install -y nodejs npm nginx git
   ```

3. **Clone Repository**:

   ```bash
   git clone https://github.com/your-username/test-case-generator.git
   cd test-case-generator
   ```

4. **Setup Backend**:

   ```bash
   cd Server
   npm install
   cp .env.example .env  # Configure your environment variables
   npx prisma migrate deploy
   npx prisma generate
   npm run build
   npm start &
   ```

5. **Setup Frontend**:

   ```bash
   cd ../web
   npm install
   npm run build
   sudo cp -r out/* /var/www/html/  # For static hosting
   ```

6. **Configure Nginx**:
   Create `/etc/nginx/sites-available/test-case-generator`:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;  # Frontend if running Next.js in production
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /api {
           proxy_pass http://localhost:3000;  # Backend
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   Enable site and restart Nginx:

   ```bash
   sudo ln -s /etc/nginx/sites-available/test-case-generator /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **SSL Certificate (Optional)**:

   ```bash
   sudo yum install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

8. **Monitor and Logs**:
   - Use `sudo systemctl status nginx` to check status
   - Logs: `/var/log/nginx/`
   - Backend logs: Check PM2 or your process manager

## API Documentation

The backend provides RESTful APIs for:

- Authentication
- User management
- Test case generation
- Subscription handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC
