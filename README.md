# Brookweald Cricket Club MVP Leaderboard App

This application tracks player performances and calculates MVP (Most Valuable Player) points for Brookweald Cricket Club. The app provides a leaderboard view, player statistics, match details, and administrative tools for managing club data.

## Features

- User authentication with admin, player, and public roles
- Comprehensive MVP points leaderboard
- Detailed player statistics and performance metrics
- Match management with scoring input
- Player comparison tools
- Admin dashboard for data management
- Responsive design for use on various devices
- Dual storage options: localStorage and Google Sheets

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI components
- **State Management**: React Context API
- **Routing**: React Router
- **Data Storage**: Dual system with localStorage or Google Sheets API
- **Charts & Visualization**: Recharts
- **Authentication**: Token-based authentication (simulated)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm package manager

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/brookweald-cc-app.git
   cd brookweald-cc-app
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Start the development server:
   ```
   pnpm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Data Storage Options

The application supports two data storage mechanisms:

1. **LocalStorage**: Default storage option that works entirely in the browser
2. **Google Sheets**: Cloud-based storage option that enables data sharing and backup

### Setting Up Google Sheets Integration

To use Google Sheets as your backend, follow these steps:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Sheets API for your project

2. **Create API Credentials**:
   - In your Google Cloud project, go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID credentials
   - Set the authorized JavaScript origins to include your app's URL (e.g., http://localhost:5173 for development)
   - Download the credentials JSON file

3. **Create a Google Spreadsheet**:
   - Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
   - Note the spreadsheet ID from the URL (it's the long string between `/d/` and `/edit` in the URL)
   - Make sure your Google account has edit permission for this spreadsheet

4. **Configure the App**:
   - Update the configuration in `/src/lib/sheets-service.ts`:
     ```typescript
     // Google Sheets API configuration
     const API_KEY = 'YOUR_API_KEY'; // From Google Cloud credentials
     const CLIENT_ID = 'YOUR_CLIENT_ID'; // From Google Cloud credentials
     const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // From the spreadsheet URL
     ```

5. **Switch to Google Sheets Storage**:
   - In the app, go to Settings > Storage Options
   - Select "Google Sheets" as the storage backend
   - Click "Authenticate" and complete the Google OAuth flow when prompted
   - If this is the first time using the spreadsheet, click "Initialize" to set up the required sheets and sample data

### Note on Storage Implementation

The current implementation provides a simulated Google Sheets API using localStorage to demonstrate the concept. In a production environment, you would replace this with the actual Google Sheets API calls using the Google API Client Library.

## Data Migration

To migrate data from localStorage to Google Sheets:

1. Go to Admin > Settings > Storage
2. Ensure you have configured Google Sheets as described above
3. Click "Export Data from LocalStorage"
4. Click "Import Data to Google Sheets"
5. Confirm the migration

## User Roles

- **Admin**: Full access to all features including data management
- **Player**: Access to personal statistics and general leaderboards
- **Public**: Limited access to leaderboards and public information

## Default Accounts

The application comes with pre-configured sample accounts:

- **Admin Account**:
  - Email: admin@brookwealdcc.com
  - Password: admin

- **Player Account**:
  - Email: john.smith@example.com
  - Password: password

## Developer Documentation

### Project Structure

```
brookweald_cc_app/
├── docs/                  # Documentation files
│   ├── prd.md            # Product Requirements Document
│   ├── system_design.md  # System Design Document
│   ├── class_diagram.mermaid
│   └── sequence_diagram.mermaid
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── admin/       # Admin-specific components
│   │   ├── common/      # Shared components
│   │   ├── layouts/     # Layout components
│   │   └── ui/          # UI components (shadcn)
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   │   ├── data-service.ts       # Data service abstraction layer
│   │   ├── mvp-calculator.ts     # MVP point calculation logic
│   │   ├── sheets-service.ts     # Google Sheets service
│   │   ├── storage-service.ts    # localStorage service
│   │   └── utils.ts              # General utilities
│   ├── pages/           # Page components
│   └── types/           # TypeScript type definitions
├── .gitignore
├── index.html
├── package.json
├── README.md
└── tsconfig.json
```

### Key Data Models

- **User**: Represents an account in the system (admin, player, public)
- **Player**: Represents a cricket player with stats and profile info
- **Match**: Contains details about a cricket match
- **Performance**: Records a player's performance in a match (batting, bowling, fielding)
- **MVPLeaderboard**: Aggregates player points for rankings

### Adding New Features

1. Define TypeScript interfaces in `/src/types/index.ts`
2. Implement data service functions in the appropriate service file
3. Create React components in `/src/components/`
4. Update the routing in `/src/App.tsx` if adding new pages
5. Add any required context providers in `/src/contexts/`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.