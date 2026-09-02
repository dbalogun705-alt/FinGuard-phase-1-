# FinGuard Phase 1

FinGuard is a financial management product for people experiencing debt pressure
and limited cashflow buffers. It helps users understand their financial health,
track debt, monitor cashflow, forecast shortfalls, and review financial reports.

## Framework and Tools

- HTML5 for the page structure and dashboard screens
- CSS3 for shared layouts, responsive styling, and page-specific designs
- Vanilla JavaScript for page interactions and dashboard behavior
- Bootstrap 5.3.3 for responsive utilities, spacing, buttons, and layout helpers
- Google Fonts Inter for the main interface typography
- SVG image assets for the FinGuard brand, sidebar icons, charts, and status icons
- Browser `localStorage` for the sign-in session and saved settings
- Fetch API for communication with the FinGuard backend

This phase uses a lightweight front-end structure rather than a JavaScript
framework such as React or Angular. The pages can be opened locally and share
common dashboard styles and scripts.

## What We Created

The project was developed collaboratively. Together, we created and connected:

- A landing page with FinGuard branding and entry points for sign in and sign up
- Sign-up, sign-in, and verification screens
- A shared dashboard shell with a fixed blue sidebar and responsive layout
- Sidebar navigation between Overview, Assessment, Debt & DTI, Cashflow Buffer,
  Shortfall Forecast, Risk Explanation, Reports, Profile, and Settings
- A collapsible sidebar controlled by the white toggle button
- Assessment pages for income, expenses, debts, and assessment completion
- Debt & DTI, Risk Explanation, Overview, and Cashflow Buffer dashboard pages
- A Shortfall Forecast page with a six-month health table and forecast status
- A Reports page with downloadable report cards and a privacy notice
- A Profile page with personal information, security, account, and privacy areas
- A Settings page with notification preferences, appearance controls, and a tip

## My Work in This Phase

My work included building and refining the dashboard experience, including:

- Connecting the page-specific CSS files to their HTML pages
- Fixing dashboard navigation links so sidebar items open the correct pages
- Implementing the shared sidebar toggle using the `is-collapsed` state
- Correcting active sidebar states so the current page is highlighted
- Creating the Shortfall Forecast and Reports page presentation
- Recreating the Profile and Settings screens from the provided designs
- Separating profile behavior into `profile.js` and settings behavior into
  `settings.js`
- Adding settings switches, dark mode behavior, and saved preferences
- Adding profile actions for editing profile information and account/security rows

## Collaboration

### Frontend Developers

- Balogun Ayomikun - Team Lead
- Daniel Oluwaseun
- Abayomi Dele-Ale

The remaining dashboard flows, authentication screens, backend API integration,
financial profile requests, debt requests, and supporting page scripts were
created and integrated as collaborative team work. The shared codebase combines
these contributions through common files such as `dashboard.css`, `dashboard.js`,
`api.js`, and the dashboard page templates.

## Project Structure

```text
Dashboard pages/   HTML screens for authentication and dashboard features
css folder/        Shared and page-specific CSS files
javascript/        Authentication, API, dashboard, and page scripts
Images/            Brand and interface assets
Server/            Server-side project files
auth/              Authentication-related files
index.html         FinGuard landing page
style.css          Landing page styles
```

## Running the Project

Open `index.html` in a browser, or serve the repository with a local static
server. Create an account or sign in before opening protected dashboard pages.
