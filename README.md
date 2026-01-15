# LynkSkill

A modern internship platform connecting students with companies, featuring AI-powered portfolio auditing, assignment management, and comprehensive dashboards for both students and companies.

## 🌟 Features

### For Students
- **Portfolio Management**: Create and manage professional portfolios with skills, projects, experience, and education
- **AI-Powered Portfolio Audit**: Get intelligent feedback and suggestions to improve your portfolio using OpenAI
- **Internship Discovery**: Browse and apply to internships from various companies
- **Application Tracking**: Monitor the status of your applications (Pending, Approved, Rejected)
- **Assignment Management**: Complete and submit assignments for internships
- **Experience Tracking**: Document and showcase your internship experiences
- **Leaderboard**: See how you rank among other students

### For Companies
- **Company Profile**: Create and manage company profiles with logos and descriptions
- **Internship Posting**: Create and manage internship listings with detailed requirements
- **Application Management**: Review and manage student applications
- **Assignment Creation**: Create assignments for interns with due dates
- **Experience Verification**: Review and grade student-submitted experiences
- **EIK Validation**: Validate company identification numbers (Bulgarian EIK)

### Platform Features
- **Role-Based Access Control**: Separate dashboards for students and companies
- **Onboarding Flow**: Guided setup process for new users
- **Policy Acceptance**: Terms of Service and Privacy Policy acceptance
- **Real-time Updates**: Live updates on applications and assignments
- **Responsive Design**: Mobile-friendly interface with dark mode support
- **AI Assistant**: Intelligent chat advisor for portfolio improvement

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Framer Motion** - Animation library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **next-themes** - Theme management (dark/light mode)

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - ORM for database operations
- **PostgreSQL** - Database (hosted on Supabase)

### Authentication & Authorization
- **Clerk** - Authentication and user management
- **Middleware** - Route protection and role-based access

### AI & External Services
- **OpenAI** - AI-powered portfolio auditing and chat advisor
- **Supabase** - Database hosting and file storage
- **Upstash Redis** - Rate limiting

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Prisma Studio** - Database GUI

## 📁 Project Structure

```
LynkSkill/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── assistant/           # AI assistant endpoints
│   │   ├── applications/        # Application management
│   │   ├── assignments/         # Assignment management
│   │   ├── companies/           # Company management
│   │   ├── experience/          # Experience tracking
│   │   ├── internships/         # Internship management
│   │   ├── portfolio/           # Portfolio management
│   │   ├── projects/            # Project management
│   │   └── user/                # User management
│   ├── dashboard/               # Dashboard pages
│   │   ├── company/            # Company dashboard
│   │   └── student/            # Student dashboard
│   ├── onboarding/             # Onboarding flow
│   ├── assignments/            # Assignment pages
│   ├── privacy/                # Privacy policy
│   └── terms/                  # Terms of service
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   ├── dashboard/              # Dashboard-specific components
│   └── landing/                # Landing page components
├── lib/                         # Utility libraries
│   ├── clerk.ts               # Clerk client
│   ├── openai.ts              # OpenAI client
│   ├── prisma.ts              # Prisma client
│   └── utils.ts               # Utility functions
├── prisma/                     # Database schema and migrations
│   └── schema.prisma          # Database models
├── public/                     # Static assets
└── scripts/                    # Utility scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (Supabase recommended)
- Clerk account for authentication
- OpenAI API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LynkSkill
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database (Supabase)
   DATABASE_URL="postgresql://postgres:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/redirect-after-signin
   NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/redirect-after-signin

   # OpenAI (for AI assistant)
   OPENAI_API_KEY="sk-proj-..."
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # (Optional) Open Prisma Studio to view database
   npx prisma studio
   ```

5. **Configure Clerk**

   - Create a Clerk account at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy the Publishable Key and Secret Key to your `.env` file
   - Configure JWT templates in Clerk dashboard to include:
     - `role`: "STUDENT" or "COMPANY"
     - `onboardingComplete`: boolean

6. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

### Core Models

- **User**: Represents both students and companies
  - `role`: STUDENT or COMPANY
  - `onboardingComplete`: Boolean
  - `tosAccepted`, `privacyAccepted`: Policy acceptance

- **Company**: Company profiles
  - `name`, `eik`, `description`, `location`, `website`, `logo`
  - Relations: internships, projects, experiences

- **Profile**: User profile information
  - `name`, `bio`

- **Internship**: Internship listings
  - `title`, `description`, `qualifications`, `location`
  - `paid`, `salary`, `applicationStart`, `applicationEnd`
  - `testAssignmentTitle`, `testAssignmentDescription`, `testAssignmentDueDate`

- **Application**: Student applications to internships
  - `status`: PENDING, APPROVED, REJECTED
  - Relations: internship, student, project

- **Assignment**: Tasks assigned to students
  - `title`, `description`, `dueDate`
  - Relations: internship, student, submissions

- **AssignmentFile**: File submissions for assignments
  - `name`, `size`, `url`

- **Portfolio**: Student portfolios
  - `fullName`, `headline`, `bio`, `skills`, `interests`
  - `experience`, `education`, `projects`, `certifications`
  - `linkedin`, `github`, `portfolioUrl`
  - `approvalStatus`: PENDING, APPROVED, REJECTED

- **Project**: Projects created during internships
  - `title`, `description`
  - Relations: internship, application, student, company, experiences

- **Experience**: Experience entries with media
  - `mediaUrls`, `status`, `grade`
  - Relations: student, company, project

## 🔐 Authentication & Authorization

### Clerk Integration

The platform uses Clerk for authentication. Key features:

- **Sign In/Sign Up**: Email/password and OAuth providers
- **Session Management**: Automatic session handling
- **JWT Templates**: Custom claims for role and onboarding status
- **Middleware Protection**: Route-based access control

### Role-Based Access Control

- **Student Routes**: `/dashboard/student/*`
- **Company Routes**: `/dashboard/company/*`
- **Public Routes**: `/`, `/terms`, `/privacy`
- **Onboarding Routes**: `/onboarding`, `/redirect-after-signin`

### Middleware Flow

1. Check if route is public → Allow access
2. Check if user is authenticated → Sync with database
3. Check onboarding status → Redirect if incomplete
4. Check role → Redirect to appropriate dashboard

## 🤖 AI Assistant

The AI assistant provides two modes:

### Portfolio Audit Mode
- Analyzes student portfolios
- Identifies strengths and weaknesses
- Provides actionable improvement suggestions
- Uses OpenAI GPT models for intelligent analysis

### Chat Advisor Mode
- Interactive Q&A about portfolio improvement
- Context-aware responses based on previous conversations
- Section-specific advice (Headline, Bio, Skills, etc.)

### Implementation

- **Endpoint**: `/api/assistant`
- **Authentication**: Required (Clerk)
- **Timeout**: 60 seconds
- **Memory**: In-memory session tracking (30 min TTL)

## 📝 API Routes

### Authentication
- `POST /api/sync-users` - Sync Clerk users with database
- `GET /api/get-role` - Get user role
- `GET /api/check-user` - Check if user exists

### Applications
- `GET /api/applications` - Get all applications
- `GET /api/applications/me` - Get current user's applications
- `GET /api/applications/company` - Get company's applications
- `GET /api/applications/[id]` - Get application by ID

### Assignments
- `GET /api/assignments/[id]` - Get assignment details
- `POST /api/assignments/[id]/upload` - Upload assignment file
- `GET /api/assignments/company` - Get company's assignments
- `GET /api/student-assignments/[id]` - Get student's assignment
- `POST /api/student-assignments/[id]/upload` - Upload student assignment

### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/approved` - Get approved companies
- `GET /api/company/me` - Get current user's company
- `POST /api/company/accept-policies` - Accept company policies

### Experience
- `GET /api/experience` - Get experiences
- `GET /api/experience/[id]` - Get experience by ID
- `GET /api/experience/recent-files` - Get recent experience files

### Internships
- `GET /api/internships` - Get all internships
- `GET /api/internships/[id]` - Get internship by ID
- `DELETE /api/internship/delete` - Delete internship

### Portfolio
- `GET /api/portfolio` - Get portfolio
- `GET /api/portfolio/me` - Get current user's portfolio
- `GET /api/portfolio/[studentId]` - Get student's portfolio
- `POST /api/portfolio/upload` - Upload portfolio file

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/approved` - Get approved projects
- `POST /api/projects/cleanup` - Cleanup old projects

### User
- `GET /api/user/me` - Get current user
- `POST /api/user/intro-shown` - Mark intro as shown

### Other
- `POST /api/assistant` - AI assistant endpoint
- `POST /api/validate-eik` - Validate Bulgarian EIK
- `POST /api/upload-logo` - Upload company logo
- `POST /api/cleanup` - Cleanup old data
- `GET /api/leaderboard` - Get leaderboard

## 🎨 UI Components

### Radix UI Components
- Avatar, Badge, Button, Calendar, Card, Chart, Checkbox
- Dialog, Dropdown Menu, Form, Input, Label, Popover
- Progress, Scroll Area, Select, Separator, Skeleton
- Tabs, Textarea, Tooltip

### Custom Components
- `AIAssistant` - AI chat interface
- `AIMascotScene` - 3D mascot animation
- `ApplyBtn` - Apply button component
- `DashboardLayout` - Dashboard layout wrapper
- `FileUpload` - File upload component
- `HeroSection` - Landing page hero
- `InternshipModal` - Internship details modal
- `Portfolio` - Portfolio display component
- `ThemeToggle` - Dark/light mode toggle
- `UserMenu` - User dropdown menu

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check Supabase project status
- Ensure connection pooling is enabled

**Clerk Authentication Issues**
- Verify Clerk keys in `.env`
- Check JWT templates include required claims
- Clear browser cookies and try again

**AI Assistant Not Working**
- Verify `OPENAI_API_KEY` is set
- Check API key has sufficient credits
- Review server logs for timeout errors

**File Upload Failures**
- Check file size limits (50MB max)
- Verify Supabase storage permissions
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is correct

**Build Errors**
- Run `npx prisma generate` before building
- Check TypeScript errors with `npx tsc --noEmit`
- Clear `.next` cache: `rm -rf .next`

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

All variables from `.env` must be added to Vercel:
- Database URLs
- Clerk keys
- OpenAI API key
- Supabase keys

### Database Migrations

Run migrations in production:
```bash
npx prisma migrate deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and confidential.

## 📞 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using Next.js, Clerk, and Supabase
