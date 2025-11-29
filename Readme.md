# 🧪 Test Case Generator

> AI-powered test case generator for competitive programming that analyzes your C++ solutions and generates comprehensive edge cases using Google Gemini AI.

![Test Case Generator](https://img.shields.io/badge/AI-Powered-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## 📖 What is This?

Test Case Generator helps competitive programmers validate their solutions by automatically generating comprehensive test cases. Simply paste your problem statement and C++ code, and let Google's Gemini AI identify edge cases, boundary conditions, and potential bugs in your solution.

### ✨ Key Features

- 🤖 **AI-Powered** - Uses Google Gemini to understand problems and generate intelligent test cases
- 🎯 **Smart Analysis** - Identifies edge cases, boundary conditions, and potential bugs
- 📊 **Comprehensive Coverage** - Generates 5-10 diverse test cases per problem
- 🔐 **Secure Authentication** - JWT-based auth with support for Google/GitHub OAuth
- 💎 **Premium Features** - Advanced thinking levels for more sophisticated analysis
- 📱 **Beautiful UI** - Modern, responsive design built with Next.js and shadcn/ui
- ⚡ **Fast Response** - Get test cases in seconds

## 🎯 Perfect For

- Competitive programmers preparing for contests (Codeforces, LeetCode, CodeChef)
- Students learning algorithms and data structures
- Developers wanting to validate their solutions
- Anyone who needs quick, reliable test cases

## 🛠️ Tech Stack

### Backend
- **Node.js 20** + TypeScript + Express.js
- **PostgreSQL** with Prisma ORM
- **Google Gemini API** for AI test case generation
- **JWT** authentication with httpOnly cookies
- **Razorpay** for premium subscriptions (optional)
- **Cloudinary** for profile pictures (optional)

### Frontend
- **Next.js 15** (App Router) + React 19
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for beautiful components
- **Axios** for API calls

## 📁 Project Structure

```
Test-case-generator/
├── Server/              # Backend Express API
│   ├── src/
│   │   ├── controller/  # API request handlers
│   │   ├── routes/      # API routes
│   │   ├── utilities/   # Helper functions (AI, email, etc.)
│   │   └── index.ts     # Server entry point
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env
│
└── web/                 # Frontend Next.js app
    ├── src/
    │   ├── app/         # Pages and routes
    │   └── components/  # Reusable UI components
    └── .env.local
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher  
- Google Gemini API key ([Get it free here](https://aistudio.google.com/app/apikey))

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/Test-case-generator.git
cd Test-case-generator
```

### 2. Setup Backend

```bash
cd Server

# Install dependencies
npm install --legacy-peer-deps

# Create .env file
cp .env.example .env
```

Edit `Server/.env` with your credentials:

```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/testcase

# Required
JWT_SECRET_KEY=your-secret-key-min-32-chars
GEMINI_API_KEY=your-gemini-api-key

# Optional (for additional features)
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
RAZORPAY_KEY_ID=your-razorpay-key
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

**Get Gemini API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in and create API key
3. Copy and paste into `.env`

**Setup Database:**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Start server
npm run dev
```

Backend will run on `http://localhost:4000`

### 3. Setup Frontend

```bash
cd ../web

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

Edit `web/.env.local`:
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:4000
```

Start frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🎮 How to Use

1. **Sign Up / Login**
   - Create account with email/password
   - Or use Google/GitHub OAuth (if configured)

2. **Generate Test Cases**
   - Navigate to Test Case Center
   - Paste your problem statement
   - Paste your C++ solution code
   - Select thinking level (Basic/Advanced)
   - Click "Generate Test Cases"

3. **Review Results**
   - View generated test cases with inputs and expected outputs
   - Read AI analysis of your solution
   - Copy test cases to clipboard
   - Use them to validate your code

## 📚 API Endpoints

### Authentication
```http
POST /api/auth/signup          # Create account
POST /api/auth/login           # Login
POST /api/auth/logout          # Logout
GET  /api/auth/google/url      # Get Google OAuth URL
```

### Test Case Generation
```http
POST /test/getTestCase
Content-Type: application/json

{
  "code": "your C++ code",
  "problemStatement": "problem description",
  "thinkingLevel": "Basic"
}

# Response
{
  "success": true,
  "testCases": [
    {
      "input": "5\n1 2 3 4 5",
      "expectedOutput": "15",
      "description": "basic array sum"
    }
  ],
  "analysis": "Analysis of your solution...",
  "totalTests": 10
}
```

### User Management
```http
GET  /api/user/getCurrentUser   # Get user profile
PUT  /api/user/updateUser       # Update profile
POST /api/user/uploadImage      # Upload profile picture
```

## ⚙️ Configuration Options

### Required Environment Variables

**Backend (`Server/.env`):**
```env
DATABASE_URL=postgresql://...     # PostgreSQL connection
JWT_SECRET_KEY=...                # JWT signing key (32+ chars)
GEMINI_API_KEY=...                # Google Gemini API key
```

**Frontend (`web/.env.local`):**
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:4000
```

### Optional Features

**OAuth Login (Google/GitHub):**
- Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

**Premium Subscriptions (Razorpay):**
- Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

**Profile Pictures (Cloudinary):**
- Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Email OTP (Gmail SMTP):**
- Set `SMTP_EMAIL`, `SMTP_PASSWORD`

## 🎨 Screenshots

### Test Case Generator
![Test Case Generator Interface](docs/screenshots/test-case-center.png)

### AI Analysis
![AI Analysis Results](docs/screenshots/analysis.png)

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if PostgreSQL is running
psql --version

# Verify environment variables
cat Server/.env

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Frontend shows "Failed to connect"
```bash
# Ensure backend is running on port 4000
curl http://localhost:4000/api/user/getCurrentUser

# Check frontend .env.local
cat web/.env.local
```

### Database errors
```bash
# Reset database
cd Server
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

### "Invalid API key" error
- Verify your Gemini API key is correct
- Check you have API quota remaining
- Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to verify

## 📦 Production Deployment

### Backend (Railway/Render)

1. Push code to GitHub
2. Connect Railway/Render to your repo
3. Add environment variables in dashboard
4. Deploy from `main` branch

### Frontend (Vercel)

1. Import project to Vercel
2. Set root directory to `web/`
3. Add `NEXT_PUBLIC_SERVER_URL` environment variable
4. Deploy

## 🤝 Contributing

Contributions welcome! Here's how:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🐛 Known Issues

- OAuth redirects require HTTPS (use ngrok for local testing)
- Razorpay webhooks need public URL (use ngrok locally)
- Large code files may hit API rate limits

## 🗺️ Roadmap

- [ ] Support for Python, Java, JavaScript
- [ ] Test case history and favorites
- [ ] Code playground with execution
- [ ] Sharing test cases via links
- [ ] VS Code extension
- [ ] Mobile app
- [ ] Integration with LeetCode/Codeforces

## 💡 Tips for Best Results

1. **Write Clear Problem Statements** - Include constraints, input/output format
2. **Provide Complete Code** - Include all necessary headers and functions
3. **Use Basic Level First** - Start with free tier to understand outputs
4. **Review AI Analysis** - Check the suggestions for potential bugs
5. **Test Edge Cases** - Pay special attention to boundary conditions

## ❓ FAQ

**Q: Is this free?**  
A: Basic tier is free with 5-10 test cases per generation. Premium offers advanced analysis.

**Q: What languages are supported?**  
A: Currently C++. Python, Java, JavaScript coming soon.

**Q: How accurate are the test cases?**  
A: Gemini AI analyzes your problem statement carefully, but always verify critical test cases.

**Q: Can I use this for contests?**  
A: Yes! Generate test cases before submitting to catch edge cases.

**Q: Is my code stored?**  
A: Code is processed by AI but not permanently stored unless you opt-in to history feature.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nikhil**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Google Gemini AI for intelligent test generation
- shadcn/ui for beautiful React components
- Prisma for excellent TypeScript ORM
- Next.js team for amazing framework

## 📞 Support

Having issues? Need help?

- 📧 Email: support@testcasegen.com
- 🐛 Report bugs: [GitHub Issues](https://github.com/yourusername/Test-case-generator/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/Test-case-generator/discussions)

## ⭐ Show Your Support

If you find this project useful, please give it a star! ⭐

---

<div align="center">
  <p>Built with ❤️ for competitive programmers</p>
  <p>Made with TypeScript, Next.js, PostgreSQL, and Google Gemini AI</p>
</div>
