# User Profile & Logout Feature

## Overview
Added user profile management and logout functionality to the application.

## Components

### UserProfile Component (`components/UserProfile.tsx`)
A dropdown menu component that displays:
- User avatar with initials
- User email and name
- Profile settings link
- Logout button

**Features:**
- Click outside to close dropdown
- Smooth animations
- Loading state during logout
- Automatic redirect to login after logout

### Profile Page (`pages/profile.tsx`)
A dedicated profile settings page where users can:
- Update their full name
- View their email (read-only)
- Change their password
- See success/error notifications

**Security:**
- Password must be at least 6 characters
- Password confirmation validation
- Protected route (requires authentication)

## Integration

### TopNav Component
Updated to include the UserProfile dropdown in place of the static avatar.

### Authentication Flow
1. User clicks on avatar dropdown
2. Can navigate to profile settings or logout
3. Logout clears session and redirects to login page
4. Profile page is protected and requires authentication

## Usage

### Accessing Profile
Click on the user avatar in the top navigation bar and select "Profile Settings"

### Updating Profile
1. Navigate to profile page
2. Update full name
3. Click "Save Changes"

### Changing Password
1. Navigate to profile page
2. Enter new password
3. Confirm new password
4. Click "Update Password"

### Logging Out
1. Click on user avatar dropdown
2. Click "Logout"
3. Automatically redirected to login page

## API Integration
Uses Supabase Auth API:
- `supabase.auth.updateUser()` for profile updates
- `supabase.auth.signOut()` for logout
- Real-time auth state management via hooks
