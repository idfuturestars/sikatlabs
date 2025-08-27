# Live User Testing System - Technical Documentation

## Overview
**MVP 3.2 - Permanent Live User Testing & Analytics Infrastructure**

The EiQ™ platform now includes a comprehensive live user testing system that captures real-time behavioral data from deployed applications. This system is designed to collect authentic user interactions for AI learning and platform optimization.

## System Architecture

### Database Schema
Four new permanent tables added to PostgreSQL:

1. **`user_behavior_tracking`** - Individual user interaction events
2. **`live_testing_sessions`** - Session-level testing and performance metrics
3. **`ai_learning_data`** - Processed data for AI model training
4. **`real_time_analytics`** - Aggregated metrics for dashboard visualization

### Core Components

#### 1. Live Testing Engine (`server/ai/liveTestingEngine.ts`)
- **Purpose**: Central processing engine for all live testing operations
- **Features**:
  - Real-time user behavior tracking
  - AI-powered data analysis and pattern recognition
  - Automatic analytics aggregation every 5 minutes
  - Feature extraction for machine learning models
  - A/B testing support with statistical analysis

#### 2. Client-Side Tracking Hook (`client/src/hooks/useLiveTracking.ts`)
- **Purpose**: Browser-based data collection and event tracking
- **Features**:
  - Automatic page view tracking
  - Scroll depth and engagement monitoring
  - Click path recording
  - Focus/idle time measurement
  - Device and browser detection
  - Reliable data transmission on page unload

#### 3. Global Tracking Provider (`client/src/components/common/LiveTrackingProvider.tsx`)
- **Purpose**: Application-wide tracking context and error handling
- **Features**:
  - Automatic error tracking
  - Convenience functions for common tracking patterns
  - Performance metrics collection
  - Feature usage analytics

#### 4. Analytics Dashboard (`client/src/pages/analytics-dashboard.tsx`)
- **Purpose**: Real-time data visualization and insights
- **Features**:
  - Live metrics display with 30-second refresh
  - Interactive charts and graphs
  - Time-range filtering (1h, 24h, 7d, 30d)
  - Automated insights and recommendations
  - Device and engagement breakdowns

## API Endpoints

### Core Analytics Endpoints
- `POST /api/analytics/track-behavior` - Track individual user events
- `POST /api/analytics/create-session` - Initialize testing sessions
- `GET /api/analytics/dashboard` - Retrieve dashboard data
- `GET /api/analytics/realtime` - Generate real-time analytics
- `POST /api/analytics/ai-learning` - Process data for AI training
- `GET /api/analytics/experiment/:name` - A/B test variant assignment

## Data Collection Types

### User Behavior Events
- **Page Views**: Navigation patterns and time spent
- **Button Clicks**: User interaction patterns
- **Form Submissions**: Conversion tracking
- **Assessment Events**: Learning progression and difficulty adaptation
- **Error Events**: Technical issues and user friction points

### Performance Metrics
- **Response Times**: API and page load performance
- **Engagement Quality**: Scroll depth, focus time, interaction frequency
- **Device Information**: Screen size, browser type, connection speed
- **Session Duration**: Time spent in application

### AI Learning Data
- **Feature Vectors**: Numerical representations for ML models
- **Behavior Patterns**: Identified user behavior clusters
- **Correlations**: Relationships between different data points
- **Confidence Scores**: AI model prediction accuracy

## Implementation Guidelines

### Frontend Integration
```typescript
// Wrap your app with the tracking provider
import { LiveTrackingProvider } from '@/components/common/LiveTrackingProvider';

function App() {
  return (
    <LiveTrackingProvider>
      <YourAppContent />
    </LiveTrackingProvider>
  );
}

// Use tracking in components
import { useQuickTracking } from '@/components/common/LiveTrackingProvider';

function MyComponent() {
  const { trackButtonClick, trackAssessmentInteraction } = useQuickTracking();
  
  const handleSubmit = () => {
    trackButtonClick('submit-assessment', { section: 'math' });
    // Your submit logic
  };
}
```

### Backend Analytics Access
```typescript
// Access the live testing engine
import { liveTestingEngine } from './ai/liveTestingEngine';

// Track custom events
await liveTestingEngine.trackUserBehavior({
  userId: 'user123',
  sessionId: 'session456',
  eventType: 'custom_event',
  eventData: { customField: 'value' },
  page: '/assessment'
});

// Generate analytics dashboard
const dashboard = await liveTestingEngine.getAnalyticsDashboard('24h');
```

## Data Privacy & Security

### User Privacy Protection
- User IDs are hashed for analytics processing
- IP addresses are anonymized after processing
- Personal information is never stored in analytics tables
- GDPR-compliant data retention policies

### Security Measures
- All analytics endpoints require JWT authentication
- Data transmission uses HTTPS encryption
- Database access restricted to authenticated services
- Audit logging for all data access

## AI Learning Integration

### Feature Extraction
The system automatically extracts features for AI model training:
- **Numeric Features**: Time spent, interaction counts, performance metrics
- **Categorical Features**: Device type, browser, experience level
- **Temporal Features**: Time of day, day of week patterns
- **Interaction Features**: Click patterns, scroll behavior

### Model Training Data
- **Raw Data**: Original user interactions and responses
- **Processed Data**: AI-analyzed insights and patterns
- **Labels**: Classification labels for supervised learning
- **Validation**: Confidence scoring and data quality assessment

## Performance Considerations

### Real-Time Processing
- Background analytics processing every 5 minutes
- Efficient database queries with proper indexing
- Memory-optimized data structures for high-volume tracking
- Automatic cleanup of old analytics data

### Scalability
- Horizontal scaling support for high user volumes
- Database partitioning for large datasets
- CDN integration for analytics dashboard assets
- Microservice architecture ready for distributed deployment

## Monitoring & Alerting

### System Health Metrics
- Analytics processing latency
- Database connection pool status
- Memory usage and performance
- Error rates and failure scenarios

### Business Metrics
- User engagement trends
- Conversion rate optimization
- A/B test performance
- AI model accuracy improvements

## Future Enhancements

### Planned Features
1. **Real-Time Personalization**: Dynamic content adaptation based on user behavior
2. **Predictive Analytics**: Machine learning models for user behavior prediction
3. **Advanced A/B Testing**: Multi-variant testing with automatic winner selection
4. **Cross-Platform Tracking**: Mobile app and web unified analytics
5. **External Integrations**: Google Analytics, Mixpanel, and custom webhook support

### Technical Roadmap
- GraphQL API for advanced analytics queries
- Real-time WebSocket updates for live dashboard
- Machine learning pipeline for automated insights
- Data warehouse integration for historical analysis
- Advanced visualization with custom chart types

## Support & Maintenance

### Regular Tasks
- Weekly analytics data review
- Monthly AI model retraining
- Quarterly performance optimization
- Annual data retention policy compliance

### Troubleshooting
- Analytics data not appearing: Check authentication and network connectivity
- Dashboard loading slowly: Verify database query performance
- Missing user events: Ensure tracking provider is properly initialized
- AI insights not generating: Validate minimum data threshold requirements

---

**Last Updated**: August 10, 2025  
**Version**: MVP 3.2  
**Next Review**: August 17, 2025