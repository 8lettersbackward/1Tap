# 1TAP | Emergency Buddy - Project Blueprint

## Project Overview
1TAP is a professional-grade safety orchestration hub designed for instant emergency response and personal security. It features a dual-role architecture (Users and Guardians) for coordinated asset protection.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Backend**: Firebase (Authentication, Realtime Database, Firestore)
- **GenAI**: Genkit (Google AI Plugin) for Reverse Geocoding
- **Mapping**: Leaflet.js for high-resolution tactical map visualization

## Database Architecture (Firebase RTDB)
The system utilizes a hierarchical structure optimized for real-time situational awareness:

### 1. User Profiles
- `users/${uid}/profile`: 
  - `email`: User's primary email.
  - `role`: 'user' or 'guardian'.
  - `displayName`: Tactical signature.

### 2. Personnel (Buddies)
- `users/${uid}/buddies/${buddyId}`:
  - `name`: Enlisted contact name.
  - `phoneNumber`: Contact digits.
  - `groups`: Associated protocol groups.

### 3. Hardware Nodes
- `users/${uid}/nodes/${nodeId}`:
  - `nodeName`: Custom node signature.
  - `hardwareId`: Unique hardware identifier.
  - `status`: Online/Offline.
  - `temperature`: Thermal threshold.
  - `trackRequest`: Boolean (Persistent tracking).
  - `latitude` / `longitude`: Spatial coordinates.

### 4. Notification Vault
- `users/${uid}/notifications/${alertId}`:
  - `type`: 'sos' or 'telemetry'.
  - `message`: Contextual dispatch.
  - `latitude` / `longitude`: Precision coordinates.
  - `place`: Human-readable location (Geocoded).
  - `trigger`: Signal source (e.g., 'TrackResponse').

## Key Functional Logic

### 1. Persistent Tracking Protocol
- Tracking is initiated via `trackRequest=true` on a hardware node.
- **No Timeout**: Legacy 10-second windows have been decommissioned. Tracking remains active until manually set to `false`.
- **Identity Signing**: The `trackRequester` field stores the UID of the Guardian who initiated the signal.

### 2. Tactical Intercepts
- **SOS Alert (Red)**: High-priority trigger. Auto-deploys a modal with map and geocoded data. Synchronized across User and Guardian accounts.
- **Telemetry Update (Blue)**: Triggered by 'TrackResponse'. Integrated into the notification vault with a blue visual signature. Does NOT auto-deploy modal to avoid operational disruption.

### 3. Reverse Geocoding Flow
- Utilizes Genkit to intercept raw coordinates.
- Transforms `latitude` and `longitude` into `city`, `province`, and `country`.
- Results are committed back to the notification vault for human readability.

## UI/UX Design Standards
- **Theme**: Tactical Minimalist (Monochrome Mobile).
- **Color Palettes**:
  - Primary: Tactical Blue (`#3b82f6`)
  - Accent: High-Visibility Red (`#ef4444`) for SOS
- **Modals**: Dynamic height with `CLOSE` command locked to viewport bottom on mobile units.
- **Navigation**: Persistent terminal sidebars on desktop; toggle-based menus on handheld units.

## Operational Commands
- **Enlist**: Add emergency contacts to the vault.
- **Arm Node**: Register and calibrate hardware thresholds.
- **Purge**: Permanent data deletion from the terminal.
- **Satellite Bridge**: Direct link to Google Maps from any spatial intercept.
