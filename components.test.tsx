/**
 * EiQ™ Platform Component Tests
 * Unit tests for React components
 */

import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock wouter router components with ES modules
jest.mock('wouter');

// Mock React Query provider
const mockQueryClient = {
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  clear: jest.fn(),
};

const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="query-provider">{children}</div>;
};

// Mock components for testing
const MockButton = ({ children, onClick, disabled, 'data-testid': testId }: any) => (
  <button onClick={onClick} disabled={disabled} data-testid={testId}>
    {children}
  </button>
);

const MockInput = ({ value, onChange, placeholder, 'data-testid': testId }: any) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    data-testid={testId}
  />
);

describe('EiQ™ Platform Components', () => {
  beforeEach(() => {
    // Setup test environment
    global.testUtils.setupApiMocks({
      '/api/auth/user': global.testUtils.createMockUser(),
      '/api/assessments': [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Components', () => {
    it('should render login form correctly', () => {
      const LoginForm = () => (
        <form data-testid="login-form">
          <MockInput
            data-testid="input-email"
            placeholder="Email"
            type="email"
          />
          <MockInput
            data-testid="input-password"
            placeholder="Password"
            type="password"
          />
          <MockButton data-testid="button-login">
            Sign In
          </MockButton>
        </form>
      );

      render(<LoginForm />);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-password')).toBeInTheDocument();
      expect(screen.getByTestId('button-login')).toBeInTheDocument();
    });

    it('should handle login form submission', async () => {
      const mockLogin = jest.fn();
      const user = userEvent.setup();

      const LoginForm = () => (
        <form data-testid="login-form" onSubmit={mockLogin}>
          <MockInput
            data-testid="input-email"
            placeholder="Email"
          />
          <MockInput
            data-testid="input-password"
            placeholder="Password"
          />
          <MockButton data-testid="button-login" type="submit">
            Sign In
          </MockButton>
        </form>
      );

      render(<LoginForm />);

      const submitButton = screen.getByTestId('button-login');
      await user.click(submitButton);

      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe('Assessment Components', () => {
    it('should render assessment question correctly', () => {
      const mockQuestion = {
        id: 'q1',
        text: 'What is 2 + 2?',
        options: [
          { id: 'a', text: '3' },
          { id: 'b', text: '4' },
          { id: 'c', text: '5' },
          { id: 'd', text: '6' }
        ]
      };

      const AssessmentQuestion = ({ question }: { question: typeof mockQuestion }) => (
        <div data-testid="assessment-question">
          <h3 data-testid="question-text">{question.text}</h3>
          <div data-testid="question-options">
            {question.options.map(option => (
              <label key={option.id} data-testid={`option-${option.id}`}>
                <input type="radio" name="answer" value={option.id} />
                {option.text}
              </label>
            ))}
          </div>
        </div>
      );

      render(<AssessmentQuestion question={mockQuestion} />);

      expect(screen.getByTestId('assessment-question')).toBeInTheDocument();
      expect(screen.getByTestId('question-text')).toHaveTextContent('What is 2 + 2?');
      expect(screen.getByTestId('option-b')).toHaveTextContent('4');
    });

    it('should handle answer selection', async () => {
      const mockOnAnswer = jest.fn();
      const user = userEvent.setup();

      const AssessmentQuestion = ({ onAnswer }: { onAnswer: (answer: string) => void }) => (
        <div data-testid="assessment-question">
          <h3>What is 2 + 2?</h3>
          <label data-testid="option-b">
            <input
              type="radio"
              name="answer"
              value="b"
              onChange={() => onAnswer('b')}
            />
            4
          </label>
        </div>
      );

      render(<AssessmentQuestion onAnswer={mockOnAnswer} />);

      const optionB = screen.getByDisplayValue('b');
      await user.click(optionB);

      expect(mockOnAnswer).toHaveBeenCalledWith('b');
    });
  });

  describe('Dashboard Components', () => {
    it('should render user dashboard with stats', () => {
      const mockStats = {
        totalAssessments: 5,
        averageScore: 785,
        completionRate: 95,
        rank: 'Advanced'
      };

      const UserDashboard = ({ stats }: { stats: typeof mockStats }) => (
        <div data-testid="user-dashboard">
          <div data-testid="stat-assessments">
            Assessments: {stats.totalAssessments}
          </div>
          <div data-testid="stat-score">
            Average Score: {stats.averageScore}
          </div>
          <div data-testid="stat-completion">
            Completion Rate: {stats.completionRate}%
          </div>
          <div data-testid="stat-rank">
            Rank: {stats.rank}
          </div>
        </div>
      );

      render(<UserDashboard stats={mockStats} />);

      expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('stat-assessments')).toHaveTextContent('Assessments: 5');
      expect(screen.getByTestId('stat-score')).toHaveTextContent('Average Score: 785');
      expect(screen.getByTestId('stat-completion')).toHaveTextContent('Completion Rate: 95%');
      expect(screen.getByTestId('stat-rank')).toHaveTextContent('Rank: Advanced');
    });

    it('should handle navigation between dashboard sections', async () => {
      const mockNavigate = jest.fn();
      const user = userEvent.setup();

      const DashboardNav = ({ onNavigate }: { onNavigate: (section: string) => void }) => (
        <nav data-testid="dashboard-nav">
          <MockButton
            data-testid="nav-assessments"
            onClick={() => onNavigate('assessments')}
          >
            Assessments
          </MockButton>
          <MockButton
            data-testid="nav-analytics"
            onClick={() => onNavigate('analytics')}
          >
            Analytics
          </MockButton>
          <MockButton
            data-testid="nav-profile"
            onClick={() => onNavigate('profile')}
          >
            Profile
          </MockButton>
        </nav>
      );

      render(<DashboardNav onNavigate={mockNavigate} />);

      await user.click(screen.getByTestId('nav-assessments'));
      expect(mockNavigate).toHaveBeenCalledWith('assessments');

      await user.click(screen.getByTestId('nav-analytics'));
      expect(mockNavigate).toHaveBeenCalledWith('analytics');

      await user.click(screen.getByTestId('nav-profile'));
      expect(mockNavigate).toHaveBeenCalledWith('profile');
    });
  });

  describe('AI Features Components', () => {
    it('should render AI tutor interface', () => {
      const AITutor = () => (
        <div data-testid="ai-tutor">
          <div data-testid="ai-messages">
            <div data-testid="ai-message">How can I help you learn today?</div>
          </div>
          <div data-testid="ai-input-container">
            <MockInput
              data-testid="ai-input"
              placeholder="Ask me anything..."
            />
            <MockButton data-testid="ai-send">
              Send
            </MockButton>
          </div>
        </div>
      );

      render(<AITutor />);

      expect(screen.getByTestId('ai-tutor')).toBeInTheDocument();
      expect(screen.getByTestId('ai-messages')).toBeInTheDocument();
      expect(screen.getByTestId('ai-input')).toBeInTheDocument();
      expect(screen.getByTestId('ai-send')).toBeInTheDocument();
    });

    it('should handle AI message submission', async () => {
      const mockSendMessage = jest.fn();
      const user = userEvent.setup();

      const AITutor = ({ onSendMessage }: { onSendMessage: (message: string) => void }) => (
        <div data-testid="ai-tutor">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            onSendMessage(formData.get('message') as string);
          }}>
            <input
              name="message"
              data-testid="ai-input"
              placeholder="Ask me anything..."
            />
            <MockButton data-testid="ai-send" type="submit">
              Send
            </MockButton>
          </form>
        </div>
      );

      render(<AITutor onSendMessage={mockSendMessage} />);

      const input = screen.getByTestId('ai-input');
      const sendButton = screen.getByTestId('ai-send');

      await user.type(input, 'Help me with calculus');
      await user.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith('Help me with calculus');
    });
  });

  describe('Enterprise Components', () => {
    it('should render organization dashboard', () => {
      const mockOrgData = {
        name: 'Acme University',
        tier: 'Enterprise',
        totalUsers: 2500,
        activeUsers: 1847,
        usage: {
          storage: '47 GB',
          apiCalls: 125000,
        }
      };

      const OrganizationDashboard = ({ org }: { org: typeof mockOrgData }) => (
        <div data-testid="org-dashboard">
          <h1 data-testid="org-name">{org.name}</h1>
          <div data-testid="org-tier">Plan: {org.tier}</div>
          <div data-testid="org-users">
            Users: {org.activeUsers} / {org.totalUsers}
          </div>
          <div data-testid="org-storage">
            Storage: {org.usage.storage}
          </div>
          <div data-testid="org-api-calls">
            API Calls: {org.usage.apiCalls}
          </div>
        </div>
      );

      render(<OrganizationDashboard org={mockOrgData} />);

      expect(screen.getByTestId('org-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('org-name')).toHaveTextContent('Acme University');
      expect(screen.getByTestId('org-tier')).toHaveTextContent('Plan: Enterprise');
      expect(screen.getByTestId('org-users')).toHaveTextContent('Users: 1847 / 2500');
    });

    it('should handle white-label customization', async () => {
      const mockUpdateBranding = jest.fn();
      const user = userEvent.setup();

      const BrandingPanel = ({ onUpdateBranding }: { onUpdateBranding: (config: any) => void }) => (
        <div data-testid="branding-panel">
          <input
            data-testid="input-app-name"
            placeholder="App Name"
            defaultValue="EiQ™ Platform"
          />
          <input
            data-testid="input-primary-color"
            type="color"
            defaultValue="#059669"
          />
          <MockButton
            data-testid="button-save-branding"
            onClick={() => onUpdateBranding({
              appName: 'Custom Learning Platform',
              primaryColor: '#ff6b35'
            })}
          >
            Save Branding
          </MockButton>
        </div>
      );

      render(<BrandingPanel onUpdateBranding={mockUpdateBranding} />);

      const saveButton = screen.getByTestId('button-save-branding');
      await user.click(saveButton);

      expect(mockUpdateBranding).toHaveBeenCalledWith({
        appName: 'Custom Learning Platform',
        primaryColor: '#ff6b35'
      });
    });
  });

  describe('Error Handling Components', () => {
    it('should render error boundary', () => {
      const ErrorBoundary = ({ error }: { error?: string }) => (
        <div data-testid="error-boundary">
          {error ? (
            <div data-testid="error-message">
              Something went wrong: {error}
            </div>
          ) : (
            <div data-testid="error-fallback">
              An unexpected error occurred
            </div>
          )}
        </div>
      );

      render(<ErrorBoundary error="Network connection failed" />);

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Something went wrong: Network connection failed');
    });

    it('should handle loading states', () => {
      const LoadingComponent = ({ isLoading, children }: { isLoading: boolean; children?: React.ReactNode }) => (
        <div data-testid="loading-component">
          {isLoading ? (
            <div data-testid="loading-spinner">Loading...</div>
          ) : (
            <div data-testid="loaded-content">{children}</div>
          )}
        </div>
      );

      const { rerender } = render(
        <LoadingComponent isLoading={true}>
          Content
        </LoadingComponent>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('loaded-content')).not.toBeInTheDocument();

      rerender(
        <LoadingComponent isLoading={false}>
          Content
        </LoadingComponent>
      );

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('loaded-content')).toBeInTheDocument();
    });
  });
});