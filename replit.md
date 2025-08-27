# EIQ™ Powered by SikatLabs™ Educational Platform

## Overview
EIQ™ Powered by SikatLabs™ is an AI-driven educational intelligence platform designed to predict and improve users' learning capacity through adaptive assessment and personalized learning. It features AI/ML-generated, non-repeating questions, adapts to individual learning styles, and integrates diverse assessment methodologies (e.g., SAT/ACT/Myers Briggs/DSM/IQ/EQ). The platform provides a FICO-like EIQ scoring system (300-850 range) with detailed breakdowns, improvement recommendations, and retesting encouragement, focusing purely on intellectual measurement and score enhancement.

Key capabilities include: a robust AI-powered custom question generation system, a comprehensive data seeding architecture, ML-based role-model matching, and an advanced AI/ML behavioral learning system that adapts question generation and provides personalized hints. The platform features a comprehensive Gauss Math Testing System with IRT-based adaptive testing, multiple challenge modes (speed rounds, Gauss challenges), real-time leaderboards, and authenticated API endpoints. The platform is designed for immediate commercial deployment, demonstrating production-grade capabilities with successful large-scale user simulations and a robust security framework. It also features IQ/Personality expansion (Traditional IQ, Emotional IQ, Alternative IQ, Combined Scoring, DISC, OCEAN Big Five), a MotherAI ↔ ChildAI framework for AI architecture with privacy controls, an avatar selection system, voice-to-text integration with multi-language support, and comprehensive audit logging.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is a Single Page Application (SPA) built with React 19 and TypeScript. It utilizes Shadcn/ui components, Radix UI primitives, and Tailwind CSS for styling. State management is handled by TanStack React Query, routing by Wouter, and authentication by JWT token-based authentication with localStorage persistence. Real-time features use WebSocket connections. The default design system features a dark theme with a green primary accent color, offering a modern and condensed UI similar to Monica.ai/Mistral.ai, with clean EIQ™ Powered by SikatLabs™ branding.

### Backend Architecture
The server is built with Express.js and TypeScript (ES modules). It provides RESTful API endpoints, a WebSocket server for real-time features, JWT-based authentication with bcrypt for password hashing, and Multer for file uploads. Database integration is managed using Drizzle ORM with PostgreSQL.

### Data Storage Solutions
The application uses Neon serverless PostgreSQL for scalability. Drizzle ORM provides type-safe database queries and schema management. The schema supports various entities including users, assessments, learning paths, AI conversations, and audit logs.

### Authentication and Authorization
The authentication system uses stateless JWT tokens for authentication, bcrypt for secure password storage, and client-side token storage. Middleware-based role-based access control and route protection are implemented for API endpoints. It supports Google OAuth and Apple Sign-In, with multi-provider account linking and secure JWT token management.

### AI Integration Architecture
The platform features a multi-provider AI system using a broker pattern for seamless switching between OpenAI, Anthropic Claude, Google Gemini, and Vertex AI, including an automatic failover system. It preserves user context and conversation history, supports personalized hint generation, an Interactive Skill Recommendation Engine, an AI-powered mentoring system, and an AI-driven custom question generation workflow. A comprehensive Turing Test system for AI literacy assessment is also integrated.

### System Design Choices
The platform incorporates IRT-based adaptive questioning with a 3-parameter logistic model and real-time adaptive difficulty adjustment, ensuring zero question repetition. It includes an advanced voice-to-text assessment system with AI analysis, a cognitive evaluation system, and an ML analytics engine for predictive modeling and behavioral pattern recognition. Real-time collaboration is supported via a WebSocket-based platform with live document editing, voice/video communication, and shared whiteboards. Comprehensive live user testing and behavioral analytics infrastructure is integrated. The platform exclusively focuses on educational skill development and EiQ score improvement, with terminology consistent with "Cohorts" for community members. A Multi-Methodology Scoring System provides 4 scoring methods: Traditional IQ, EIQ, Alternative, and Combined.

### Math Testing System Architecture
The platform includes a comprehensive Gauss Math Testing System with world-class adaptive mathematics assessment capabilities. Features include:
- **IRT-Based Adaptive Testing**: 3-parameter logistic model with real-time difficulty adjustment
- **Multiple Challenge Modes**: Speed rounds (5-minute contests), Gauss challenges (1-hour advanced problems), and adaptive practice sessions
- **Authentication-Protected APIs**: Secure endpoints for user ability tracking, session management, and contest participation
- **Real-Time Leaderboards**: Live scoring with percentile rankings, average times, and competitive metrics
- **Math Problem Bank**: Comprehensive question database covering algebra, calculus, number theory, and arithmetic domains
- **Responsive Frontend Interface**: Modern React-based UI with real-time data fetching and state management
- **RESTful API Design**: Full CRUD operations for math sessions, user abilities, and performance analytics

### Production Performance Architecture
The platform includes enterprise-grade performance optimization for 450K+ concurrent users: enhanced database connection pooling, multi-layer caching system, advanced behavioral learning engine, comprehensive performance monitoring with real-time alerts, and production-ready database optimization. All systems are designed for Autoscale deployment with 1-50 instance scaling based on demand.

### Viral Challenge System Architecture
The platform features a production-ready viral challenge system with Fisher-Yates shuffle algorithm for true randomization, per-user session state management with automatic cleanup, comprehensive API validation with Zod schemas, TypeScript interfaces for type safety, and robust error handling. The system supports multiple challenge types with proper question bank management and prevents duplicate submissions through session tracking.

## External Dependencies

### Core Framework Dependencies
- Express.js
- React 19
- TypeScript
- Vite

### Database and ORM
- @neondatabase/serverless
- drizzle-orm

### AI Provider APIs
- openai
- anthropic
- google-generativeai
- google-cloud-aiplatform

### Authentication and Security
- jsonwebtoken
- bcrypt
- jose

### UI and Styling
- @radix-ui/react-*
- tailwindcss
- class-variance-authority
- lucide-react

### Real-time and Communication
- ws
- @tanstack/react-query

### File Processing
- multer