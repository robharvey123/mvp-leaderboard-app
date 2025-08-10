# System Design: Brookweald CC MVP Leaderboard Application

## Implementation Approach

After analyzing the requirements for the Brookweald CC MVP Leaderboard application, I'm proposing a modern, scalable architecture that balances simplicity with the ability to handle the complex cricket statistics calculations and multi-platform deployment needs.

### Key Technical Challenges

1. **Complex MVP Point Calculation System**: The scoring system involves nuanced rules for batting, bowling, fielding performances with various bonuses and penalties.
2. **Cross-Platform Requirements**: The need to support both responsive web and native mobile applications while maintaining consistent data and user experience.
3. **Multiple User Roles**: Different access levels and capabilities for admins, players, and public viewers.
4. **Real-time Updates**: Ensuring leaderboard and statistics update promptly after new data entry.
5. **Data Integrity**: Maintaining accurate cricket statistics with override capabilities for administrators.

### Proposed Architecture

I recommend a modern client-server architecture with:

1. **Backend**:
   - Node.js with Express for the API server
   - MongoDB for flexible document-based storage
   - Firebase Authentication for user management and role-based access
   - RESTful API design with appropriate middleware for authentication and authorization

2. **Web Frontend**:
   - React.js with TypeScript for type safety
   - Tailwind CSS for responsive UI components
   - Redux for state management
   - Chart.js for statistical visualizations

3. **Mobile App**:
   - React Native for cross-platform development (iOS and Android)
   - Native Base for UI components
   - Same Redux store pattern as web for consistency

4. **Shared Logic**:
   - Calculation engine for MVP points implemented as a shared library
   - Validation rules defined once and used across platforms
   - API client library shared between web and mobile

### Key Components

1. **Authentication Service**: Manages user registration, login, and role-based access control
2. **Match Management Service**: Handles creation, update, and retrieval of match data
3. **Statistics Engine**: Calculates and maintains player performance statistics
4. **MVP Calculator**: Implements the scoring rules to compute player MVP points
5. **Leaderboard Service**: Generates filtered and sorted leaderboards
6. **Export Service**: Provides data export functionality for admins
7. **Admin Management Tools**: Special interfaces for overriding data and managing users

## Data Structures and Interfaces

Please see the class diagram file for a detailed representation of the data structures and their relationships.

### Core Classes and Services

#### Authentication Module

```typescript
interface IAuthService {
  registerUser(email: string, password: string, name: string): Promise<User>;
  login(email: string, password: string): Promise<{user: User, token: string}>;
  getCurrentUser(): User | null;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  updateUserRole(userId: string, role: UserRole): Promise<User>;
}

enum UserRole {
  ADMIN = 'admin',
  PLAYER = 'player',
  PUBLIC = 'public'
}
```

#### Match Management Module

```typescript
interface IMatchService {
  createMatch(matchData: MatchCreateDTO): Promise<Match>;
  updateMatch(matchId: string, matchData: MatchUpdateDTO): Promise<Match>;
  getMatchById(matchId: string): Promise<Match>;
  getMatchesBySeasonId(seasonId: string): Promise<Match[]>;
  getRecentMatches(limit: number): Promise<Match[]>;
  deleteMatch(matchId: string): Promise<void>;
  markMatchComplete(matchId: string, result: MatchResult): Promise<Match>;
  getMatchScorecard(matchId: string): Promise<MatchScorecard>;
  uploadMatchData(file: File): Promise<{matches: Match[], errors: any[]}>;
}
```

#### Player Performance Module

```typescript
interface IPlayerPerformanceService {
  addBattingPerformance(performance: BattingPerformanceDTO): Promise<BattingPerformance>;
  addBowlingPerformance(performance: BowlingPerformanceDTO): Promise<BowlingPerformance>;
  addFieldingPerformance(performance: FieldingPerformanceDTO): Promise<FieldingPerformance>;
  getPlayerPerformancesByMatch(matchId: string, playerId: string): Promise<PlayerMatchPerformance>;
  getPlayerSeasonStats(seasonId: string, playerId: string): Promise<PlayerSeasonStats>;
  getPlayerCareerStats(playerId: string): Promise<PlayerCareerStats>;
  updatePerformance(performanceId: string, performanceData: any): Promise<any>;
  assignSpecialDesignation(matchId: string, playerId: string, designation: SpecialDesignationType): Promise<SpecialDesignation>;
}
```

#### MVP Calculation Module

```typescript
interface IMVPCalculator {
  calculateBattingPoints(batting: BattingPerformance): number;
  calculateBowlingPoints(bowling: BowlingPerformance): number;
  calculateFieldingPoints(fielding: FieldingPerformance): number;
  calculateTeamPoints(match: Match, playerId: string): number;
  calculateSpecialDesignationPoints(designations: SpecialDesignation[]): number;
  calculateTotalMVPPoints(playerId: string, matchId: string): Promise<number>;
  recalculateLeaderboard(seasonId: string): Promise<MVPLeaderboard>;
}
```

#### Leaderboard Module

```typescript
interface ILeaderboardService {
  getCurrentLeaderboard(): Promise<MVPLeaderboard>;
  getLeaderboardBySeasonId(seasonId: string): Promise<MVPLeaderboard>;
  getFilteredLeaderboard(filters: LeaderboardFilters): Promise<MVPLeaderboard>;
  getPlayerRanking(playerId: string, seasonId?: string): Promise<PlayerRankingDetail>;
  exportLeaderboardToCSV(leaderboardId: string): Promise<string>;
}

interface LeaderboardFilters {
  seasonId?: string;
  matchId?: string;
  startDate?: Date;
  endDate?: Date;
  playerId?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

#### Admin Module

```typescript
interface IAdminService {
  getUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: UserRole): Promise<User>;
  overridePlayerStats(performanceId: string, stats: any): Promise<any>;
  manageSeasons(seasonData: SeasonDTO): Promise<Season>;
  systemConfiguration(): Promise<SystemConfig>;
  getAuditLogs(filters: AuditLogFilters): Promise<AuditLog[]>;
}
```

## API Endpoints

### Authentication Endpoints

- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Authenticate user and return token
- **GET /api/auth/profile** - Get current user profile
- **PUT /api/auth/profile** - Update user profile
- **POST /api/auth/password/forgot** - Request password reset
- **POST /api/auth/password/reset** - Reset password with token

### Players Endpoints

- **GET /api/players** - List all players
- **GET /api/players/:id** - Get player details
- **POST /api/players** - Create new player (Admin)
- **PUT /api/players/:id** - Update player (Admin)
- **DELETE /api/players/:id** - Deactivate player (Admin)
- **GET /api/players/:id/stats** - Get player statistics
- **GET /api/players/:id/matches** - Get player match history

### Matches Endpoints

- **GET /api/matches** - List matches with filters
- **GET /api/matches/:id** - Get match details
- **POST /api/matches** - Create new match (Admin)
- **PUT /api/matches/:id** - Update match details (Admin)
- **DELETE /api/matches/:id** - Delete match (Admin)
- **GET /api/matches/:id/scorecard** - Get full match scorecard
- **POST /api/matches/import** - Import matches from CSV (Admin)

### Performance Endpoints

- **POST /api/performances/batting** - Add batting performance (Admin)
- **POST /api/performances/bowling** - Add bowling performance (Admin)
- **POST /api/performances/fielding** - Add fielding performance (Admin)
- **PUT /api/performances/:type/:id** - Update performance record (Admin)
- **DELETE /api/performances/:type/:id** - Delete performance record (Admin)
- **POST /api/performances/special-designation** - Assign special designation (Admin)

### Leaderboard Endpoints

- **GET /api/leaderboards/current** - Get current season leaderboard
- **GET /api/leaderboards/:seasonId** - Get leaderboard by season
- **GET /api/leaderboards/filter** - Get filtered leaderboard
- **GET /api/leaderboards/export** - Export leaderboard to CSV (Admin)
- **GET /api/leaderboards/player/:id** - Get specific player ranking

### Admin Endpoints

- **GET /api/admin/users** - List all users (Admin)
- **PUT /api/admin/users/:id/role** - Update user role (Admin)
- **PUT /api/admin/override/:performanceId** - Override statistics (Admin)
- **GET /api/admin/audit-logs** - Get audit logs (Admin)
- **POST /api/admin/seasons** - Create/update seasons (Admin)
- **GET /api/admin/config** - Get system configuration (Admin)
- **PUT /api/admin/config** - Update system configuration (Admin)

## Program Call Flow

Please see the sequence diagram file for detailed flow of key operations in the system, including:
1. User authentication process
2. Match creation and performance data entry
3. MVP point calculation and leaderboard generation
4. Player statistics retrieval
5. CSV export functionality

## Component Architecture

### Web Frontend Architecture

```
- App/
  - components/
    - common/
      - Header.tsx
      - Footer.tsx
      - Sidebar.tsx
      - LoadingSpinner.tsx
      - ErrorBoundary.tsx
    - auth/
      - LoginForm.tsx
      - RegisterForm.tsx
      - PasswordReset.tsx
    - leaderboard/
      - LeaderboardTable.tsx
      - FilterControls.tsx
      - PlayerRankCard.tsx
    - player/
      - PlayerCard.tsx
      - PlayerStats.tsx
      - PerformanceHistory.tsx
      - StatisticsChart.tsx
    - match/
      - MatchCard.tsx
      - ScoreCard.tsx
      - MatchList.tsx
    - admin/
      - UserManagement.tsx
      - DataOverrideForm.tsx
      - ImportExportControls.tsx
      - SeasonManager.tsx
  - pages/
    - HomePage.tsx
    - LeaderboardPage.tsx
    - PlayerProfilePage.tsx
    - MatchDetailPage.tsx
    - AdminDashboard.tsx
    - LoginPage.tsx
    - RegisterPage.tsx
  - services/
    - api/
      - apiClient.ts
      - authService.ts
      - playerService.ts
      - matchService.ts
      - leaderboardService.ts
      - adminService.ts
    - utils/
      - formatter.ts
      - validation.ts
      - mvpCalculator.ts
  - store/
    - slices/
      - authSlice.ts
      - playerSlice.ts
      - matchSlice.ts
      - leaderboardSlice.ts
      - uiSlice.ts
    - index.ts
  - App.tsx
  - index.tsx
```

### Mobile App Architecture

```
- App/
  - navigation/
    - AppNavigator.tsx
    - AuthNavigator.tsx
    - TabNavigator.tsx
    - AdminNavigator.tsx
  - screens/
    - auth/
      - LoginScreen.tsx
      - RegisterScreen.tsx
      - ForgotPasswordScreen.tsx
    - home/
      - HomeScreen.tsx
      - NotificationsScreen.tsx
    - leaderboard/
      - LeaderboardScreen.tsx
      - FilterScreen.tsx
    - player/
      - PlayerListScreen.tsx
      - PlayerProfileScreen.tsx
      - StatsDetailScreen.tsx
    - match/
      - MatchListScreen.tsx
      - MatchDetailScreen.tsx
    - admin/
      - AdminDashboardScreen.tsx
      - DataEntryScreen.tsx
      - UserManagementScreen.tsx
  - components/
    - common/
      - HeaderBar.tsx
      - TabBar.tsx
      - LoadingOverlay.tsx
      - ErrorView.tsx
    - leaderboard/
      - LeaderboardList.tsx
      - FilterModal.tsx
    - player/
      - PlayerCard.tsx
      - StatsSummary.tsx
    - match/
      - MatchSummaryCard.tsx
      - PerformanceEntry.tsx
  - services/
    - Same structure as web app
  - store/
    - Same structure as web app
  - App.tsx
  - index.js
```

## Authentication and Authorization Flow

The authentication and authorization system will use JWT (JSON Web Tokens) with Firebase Authentication as the identity provider.

### Registration Flow

1. User submits registration form with email, password, name
2. System validates input and checks for existing accounts
3. If registration is for player role, admin approval is required
4. System creates user account with PUBLIC role by default
5. Verification email is sent to the user
6. After verification, user can log in
7. Admin can later promote the user to PLAYER or ADMIN role

### Login Flow

1. User submits email and password
2. System authenticates with Firebase
3. If successful, user profile is fetched from database
4. JWT token is generated with user role and permissions
5. Token is returned to client and stored securely
6. Token is included in all subsequent API requests
7. Server validates token for each request

### Authorization Middleware

```typescript
// Example of role-based middleware
const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Usage in routes
router.post('/matches', requireRole([UserRole.ADMIN]), matchController.createMatch);
```

## MVP Calculation Implementation

The MVP point calculation is a core component of the application. This will be implemented as a dedicated service that follows these principles:

1. **Single Source of Truth**: All calculation rules are defined in one place to ensure consistency
2. **Pure Functions**: Calculations are implemented as pure functions for testability
3. **Memoization**: Results are cached to improve performance
4. **Event-driven Updates**: Point recalculations triggered by relevant data changes

### MVP Calculator Class

```typescript
class MVPCalculator implements IMVPCalculator {
  
  // Batting points calculation
  calculateBattingPoints(batting: BattingPerformance): number {
    let points = 0;
    
    // Base runs
    points += batting.runsScored;
    
    // Boundaries
    points += batting.fours * 4;
    points += batting.sixes * 6;
    
    // Milestones
    if (batting.runsScored >= 100) {
      points += 50; // Century bonus
    } else if (batting.runsScored >= 50) {
      points += 25; // Half-century bonus
    }
    
    // Duck penalty
    if (batting.runsScored === 0 && batting.dismissalType !== 'Not Out') {
      points -= 15;
    }
    
    return points;
  }
  
  // Bowling points calculation
  calculateBowlingPoints(bowling: BowlingPerformance): number {
    let points = 0;
    
    // Wickets
    points += bowling.wickets * 25;
    
    // Haul bonuses
    if (bowling.wickets >= 5) {
      points = 75 + (bowling.wickets - 5) * 25; // 5-wicket haul is 75 total (not additional)
    } else if (bowling.wickets === 3 || bowling.wickets === 4) {
      points += 5; // 3 or 4-wicket bonus
    }
    
    // Maidens
    points += bowling.maidens * 10;
    
    return points;
  }
  
  // Fielding points calculation
  calculateFieldingPoints(fielding: FieldingPerformance): number {
    let points = 0;
    
    // Catches
    points += fielding.catches * 10;
    
    // Stumpings
    points += fielding.stumpings * 10;
    
    // Run outs
    points += fielding.directRunOuts * 20;
    points += fielding.assistedRunOuts * 10;
    
    // Dropped catches penalty
    points -= fielding.droppedCatches * 10;
    
    return points;
  }
  
  // Team points calculation
  calculateTeamPoints(match: Match, playerId: string): number {
    // Check if player was in winning team
    const playerInMatch = this.checkPlayerInMatch(match, playerId);
    if (playerInMatch && match.result === 'Win') {
      return 3; // 3 points for being in winning team
    }
    return 0;
  }
  
  // Special designation points
  calculateSpecialDesignationPoints(designations: SpecialDesignation[]): number {
    let points = 0;
    
    designations.forEach(designation => {
      if (designation.designationType === 'Wally of the Week') {
        points -= 3;
      }
      // Other special designations can be added here
    });
    
    return points;
  }
  
  // Total MVP points calculation for a player in a match
  async calculateTotalMVPPoints(playerId: string, matchId: string): Promise<number> {
    // Fetch all performance records
    const [batting, bowling, fielding, match, designations] = await Promise.all([
      this.battingRepo.findByPlayerAndMatch(playerId, matchId),
      this.bowlingRepo.findByPlayerAndMatch(playerId, matchId),
      this.fieldingRepo.findByPlayerAndMatch(playerId, matchId),
      this.matchRepo.findById(matchId),
      this.designationRepo.findByPlayerAndMatch(playerId, matchId)
    ]);
    
    // Calculate individual component points
    const battingPoints = batting ? this.calculateBattingPoints(batting) : 0;
    const bowlingPoints = bowling ? this.calculateBowlingPoints(bowling) : 0;
    const fieldingPoints = fielding ? this.calculateFieldingPoints(fielding) : 0;
    const teamPoints = this.calculateTeamPoints(match, playerId);
    const specialPoints = this.calculateSpecialDesignationPoints(designations);
    
    // Sum all points
    const totalPoints = battingPoints + bowlingPoints + fieldingPoints + teamPoints + specialPoints;
    
    // Update player MVP entry
    await this.updatePlayerMVPEntry(playerId, matchId, {
      totalMVPPoints: totalPoints,
      battingPoints,
      bowlingPoints,
      fieldingPoints,
      teamPoints,
      specialPoints
    });
    
    return totalPoints;
  }
  
  // Recalculate entire leaderboard for a season
  async recalculateLeaderboard(seasonId: string): Promise<MVPLeaderboard> {
    // Implementation omitted for brevity
  }
}
```

## Responsive Design Considerations

### Web Platform

1. **Fluid Grid Layout**:
   - Use responsive grid system from Tailwind CSS
   - Design with mobile-first approach
   - Implement breakpoints for tablet and desktop views

2. **Component Adaptability**:
   - Leaderboard: Horizontal scroll on mobile, full table on desktop
   - Navigation: Hamburger menu on mobile, expanded navigation on desktop
   - Forms: Single column on mobile, multiple columns on desktop

3. **Performance Optimization**:
   - Lazy loading of images and components
   - Code splitting to reduce initial bundle size
   - Server-side rendering for initial page load

### Mobile Application

1. **Native UI Components**:
   - Utilize platform-specific UI patterns
   - Tab-based navigation
   - Bottom sheet for filters
   - Pull-to-refresh for data updates

2. **Offline Capabilities**:
   - Local storage of recent leaderboard data
   - Queue data entry operations when offline
   - Sync mechanism when connection is restored

3. **Device Adaptation**:
   - Support for different screen sizes and orientations
   - Adaptive font sizing
   - Consideration for notches and safe areas

## Deployment Architecture

```
Client Browsers/Mobile Apps → CDN → API Gateway → Application Server → Database
                                                 ↓
                                       Firebase Authentication
```

1. **Frontend Hosting**:
   - Web application deployed to Firebase Hosting
   - Mobile apps distributed through App Store and Google Play

2. **Backend Services**:
   - Node.js API server deployed to cloud platform (e.g., Google Cloud Run)
   - Containerized for easy scaling and deployment

3. **Database**:
   - MongoDB Atlas for managed database service
   - Automated backups and high availability

4. **Authentication**:
   - Firebase Authentication for identity management
   - JWT tokens for API authorization

5. **Monitoring and Logging**:
   - Application monitoring for performance and errors
   - Audit logging for security and compliance

## Anything UNCLEAR

1. **Historical Data Migration**: The PRD doesn't specify if there's existing historical data that needs to be migrated. If there is, we would need a data migration strategy.

2. **Offline Functionality Depth**: While offline functionality is mentioned as a P2 requirement, the extent of offline capabilities (what operations should work offline vs. require connectivity) needs further clarification.

3. **External System Integration**: There's no mention of integration with external cricket statistics platforms. If this is required, additional API interfaces would be needed.

4. **Concurrency Handling**: If multiple administrators are entering data simultaneously, concurrency control mechanisms would be needed to prevent conflicts.

5. **Data Backup Strategy**: The PRD mentions data integrity but doesn't specify backup requirements or retention policies.

6. **MVP Scoring Edge Cases**: There may be edge cases in the MVP scoring system that aren't explicitly covered, such as how to handle incomplete matches or rare cricket events.

7. **User Registration Approval Process**: The detailed workflow for admin approval of new player accounts needs further clarification.