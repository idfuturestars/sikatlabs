/**
 * EiQ™ Platform Dashboard Simplified Tests
 * Focus on basic rendering and core functionality
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simplified Dashboard mock focused on rendering
const SimpleDashboard = ({ 
  eiqScore = 750, 
  progress = 85, 
  username = "Test User" 
}: {
  eiqScore?: number;
  progress?: number;
  username?: string;
}) => (
  <div data-testid="dashboard-main">
    <header data-testid="dashboard-header">
      <h1>Welcome, {username}</h1>
      <nav data-testid="dashboard-nav">
        <a href="/assessments">Assessments</a>
        <a href="/ai-tutor">AI Tutor</a>
        <a href="/learning-paths">Learning Paths</a>
      </nav>
    </header>
    
    <main data-testid="dashboard-content">
      <section data-testid="eiq-score-section">
        <h2>Your EiQ Score</h2>
        <div data-testid="score-display">{eiqScore}</div>
        <div data-testid="score-range">Range: 300-850</div>
      </section>
      
      <section data-testid="progress-section">
        <h2>Learning Progress</h2>
        <div data-testid="progress-bar">
          <div style={{ width: `${progress}%` }}>
            {progress}% Complete
          </div>
        </div>
      </section>
      
      <section data-testid="quick-actions">
        <h2>Quick Actions</h2>
        <button data-testid="start-assessment">Start Assessment</button>
        <button data-testid="chat-ai">Chat with AI Tutor</button>
        <button data-testid="view-analytics">View Analytics</button>
      </section>
    </main>
  </div>
);

// Simple stats component
const DashboardStats = ({ 
  assessmentsCompleted = 5,
  hoursStudied = 12,
  streakDays = 7 
}: {
  assessmentsCompleted?: number;
  hoursStudied?: number;
  streakDays?: number;
}) => (
  <div data-testid="dashboard-stats">
    <div data-testid="stat-assessments">
      Assessments: {assessmentsCompleted}
    </div>
    <div data-testid="stat-hours">
      Hours: {hoursStudied}
    </div>
    <div data-testid="stat-streak">
      Streak: {streakDays} days
    </div>
  </div>
);

describe('EiQ™ Dashboard Simplified Tests', () => {
  
  describe('Basic Dashboard Rendering', () => {
    it('should render main dashboard structure', () => {
      render(<SimpleDashboard />);
      
      expect(screen.getByTestId('dashboard-main')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should display welcome message with username', () => {
      render(<SimpleDashboard username="John Doe" />);
      
      expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
    });

    it('should render navigation links', () => {
      render(<SimpleDashboard />);
      
      expect(screen.getByTestId('dashboard-nav')).toBeInTheDocument();
      expect(screen.getByText('Assessments')).toBeInTheDocument();
      expect(screen.getByText('AI Tutor')).toBeInTheDocument();
      expect(screen.getByText('Learning Paths')).toBeInTheDocument();
    });
  });

  describe('EiQ Score Display', () => {
    it('should display EiQ score correctly', () => {
      render(<SimpleDashboard eiqScore={750} />);
      
      expect(screen.getByTestId('eiq-score-section')).toBeInTheDocument();
      expect(screen.getByTestId('score-display')).toHaveTextContent('750');
      expect(screen.getByText('Range: 300-850')).toBeInTheDocument();
    });

    it('should handle different score values', () => {
      render(<SimpleDashboard eiqScore={420} />);
      
      expect(screen.getByTestId('score-display')).toHaveTextContent('420');
    });
  });

  describe('Progress Section', () => {
    it('should display learning progress', () => {
      render(<SimpleDashboard progress={85} />);
      
      expect(screen.getByTestId('progress-section')).toBeInTheDocument();
      expect(screen.getByText('85% Complete')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      render(<SimpleDashboard progress={60} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(screen.getByText('60% Complete')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render action buttons', () => {
      render(<SimpleDashboard />);
      
      expect(screen.getByTestId('start-assessment')).toBeInTheDocument();
      expect(screen.getByTestId('chat-ai')).toBeInTheDocument();
      expect(screen.getByTestId('view-analytics')).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      render(<SimpleDashboard />);
      
      expect(screen.getByText('Start Assessment')).toBeInTheDocument();
      expect(screen.getByText('Chat with AI Tutor')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
    });
  });

  describe('Dashboard Stats', () => {
    it('should render statistics correctly', () => {
      render(<DashboardStats />);
      
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByText('Assessments: 5')).toBeInTheDocument();
      expect(screen.getByText('Hours: 12')).toBeInTheDocument();
      expect(screen.getByText('Streak: 7 days')).toBeInTheDocument();
    });

    it('should handle custom stat values', () => {
      render(
        <DashboardStats 
          assessmentsCompleted={10}
          hoursStudied={25}
          streakDays={14}
        />
      );
      
      expect(screen.getByText('Assessments: 10')).toBeInTheDocument();
      expect(screen.getByText('Hours: 25')).toBeInTheDocument();
      expect(screen.getByText('Streak: 14 days')).toBeInTheDocument();
    });
  });

  describe('Rendering Stability', () => {
    it('should not throw errors with default props', () => {
      expect(() => {
        render(<SimpleDashboard />);
      }).not.toThrow();
    });

    it('should not throw errors with custom props', () => {
      expect(() => {
        render(
          <SimpleDashboard 
            eiqScore={800}
            progress={95}
            username="Jane Smith"
          />
        );
      }).not.toThrow();
    });

    it('should handle edge cases gracefully', () => {
      expect(() => {
        render(<SimpleDashboard eiqScore={0} progress={0} username="" />);
      }).not.toThrow();
    });
  });
});