# 4PLAY Frontend - Next.js Web Application

This is the frontend web application for the 4PLAY parlay betting platform, built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Postgres + Auth)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Environment variables configured (see below)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the `webapp` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
webapp/
├── src/
│   ├── app/                      # App Router pages
│   │   ├── auth/                 # Authentication pages
│   │   │   ├── login/            # Login page
│   │   │   ├── signup/           # Signup page
│   │   │   └── callback/         # Auth callback handler
│   │   ├── profile/              # User profile page
│   │   ├── leaderboard/          # Leaderboard page
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page (game listings)
│   ├── components/               # React components
│   │   ├── Navbar.tsx            # Navigation bar
│   │   ├── GameCard.tsx          # Individual game card
│   │   └── ParlayBuilder.tsx     # Parlay builder (sticky bottom)
│   ├── lib/                      # Utilities
│   │   └── supabase/             # Supabase client
│   │       ├── client.ts         # Browser client
│   │       └── server.ts         # Server client
│   ├── types/                    # TypeScript types
│   │   └── database.types.ts     # Database type definitions
│   └── middleware.ts             # Auth middleware
├── public/                       # Static files
├── .env.local                    # Environment variables (local)
└── package.json                  # Dependencies
```

## Pages

### Home Page (`/`)
- Displays today's games filtered by sport
- Users can select picks from different games
- Sticky parlay builder at bottom
- Each game shows Match Odds (1X2) by default
- Expandable to show all markets

### Profile Page (`/profile`)
- User statistics (total parlays, wins, losses, win rate)
- Parlay history with filters
- Shows individual pick results

### Leaderboard Page (`/leaderboard`)
- Rankings by wins or win rate
- Highlights current user
- Mobile-responsive table/cards

### Authentication Pages
- `/auth/login` - Sign in
- `/auth/signup` - Create account
- `/auth/callback` - OAuth callback handler

## Features

### Game Listings
- Filter by sport (Ice Hockey, Football, All Sports)
- Shows only today's games
- Displays game time, league, match info
- Match Odds (1X2) prominently displayed
- "+X markets" button to expand

### Parlay Builder
- Sticky bottom sheet (mobile-friendly)
- Shows selected picks (max 4)
- Enforces unique EventIDs
- Displays total odds calculation
- Submit parlay when complete

### User Profiles
- View parlay history
- Filter by status (all, pending, won, lost)
- Statistics dashboard
- Individual pick results

### Leaderboard
- Sort by wins or win rate
- Responsive design (table on desktop, cards on mobile)
- Highlights current user

## Authentication

Uses Supabase Auth with email/password:
- Sign up creates account and user profile (via trigger)
- Protected routes redirect to login if not authenticated
- Session managed via middleware

## Database Integration

Connects to Supabase tables:
- `games` - Today's available games
- `odds` - Betting markets for games
- `parlays` - User parlay submissions
- `parlay_picks` - Individual picks
- `user_profiles` - User data
- `leaderboard` - Materialized view for rankings

## Styling

- **Color Scheme:** Dark theme with purple/pink gradients
- **Mobile-First:** Responsive breakpoints
- **Components:** Reusable cards, buttons, filters
- **Animations:** Smooth transitions and hover effects

## Deployment

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) in parent directory for Vercel deployment instructions.

## Development Tips

### Hot Reload
Next.js automatically reloads when you save files.

### Type Safety
TypeScript catches errors before runtime. Check `types/database.types.ts` for all type definitions.

### Supabase Client
- Use `createClient()` from `lib/supabase/client.ts` in client components
- Use `createClient()` from `lib/supabase/server.ts` in server components

### Debugging
- Check browser console for client-side errors
- Check terminal for server-side errors
- Use Supabase dashboard to inspect database

## Troubleshooting

### Build Errors

**"Module not found"**
```bash
npm install
```

**"Environment variables missing"**
- Check `.env.local` exists
- Verify variables start with `NEXT_PUBLIC_`

### Runtime Errors

**"Failed to fetch games"**
- Check Supabase connection
- Run `upload_odds_to_supabase.py` to populate data
- Verify RLS policies allow public read on games/odds

**"Authentication error"**
- Check Supabase Auth is enabled
- Verify redirect URLs in Supabase dashboard
- Clear browser cookies and try again

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## License

MIT - Educational/Personal Use
