# FHIR Blockly Authentication System

A modern, responsive authentication system built with React and Vite, featuring login and signup pages with comprehensive validation.

## Features

### 🔐 Authentication Features
- **Login Page** with email/password validation
- **Signup Page** with comprehensive form validation
- **Password Strength Indicator** with real-time feedback
- **Remember Me** functionality
- **Protected Routes** with automatic redirects
- **Social Login** options (Google, Twitter)
- **Form Validation** with real-time error feedback

### 🎨 UI/UX Features
- **Modern Design** with gradient backgrounds
- **Responsive Layout** that works on all devices
- **Loading States** with animated spinners
- **Error Handling** with user-friendly messages
- **Password Visibility Toggle**
- **Smooth Transitions** and hover effects
- **Accessibility** features

### 🔧 Technical Features
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Heroicons** for beautiful icons
- **Local Storage** for persistent sessions
- **Form Validation** utilities
- **Protected Route** component
- **Error Boundary** ready

## Validation Rules

### Login Form
- **Email**: Required, valid email format
- **Password**: Required, minimum 6 characters

### Signup Form
- **First Name**: Required, minimum 2 characters, letters only
- **Last Name**: Required, minimum 2 characters, letters only
- **Email**: Required, valid email format
- **Password**: Required, minimum 8 characters with:
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character
- **Confirm Password**: Must match password
- **Terms Agreement**: Must be checked

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
chat/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.js
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.js
│   │   │   └── Signup.js
│   │   └── Dashboard.js
│   ├── utils/
│   │   └── auth.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── index.html
└── README.md
```

## Usage

### Authentication Flow

1. **Login Page** (`/login`)
   - Enter email and password
   - Optional "Remember Me" checkbox
   - Links to signup and forgot password

2. **Signup Page** (`/signup`)
   - Fill in all required fields
   - Password strength indicator
   - Terms and conditions agreement
   - Links back to login

3. **Dashboard** (`/dashboard`)
   - Protected route (requires authentication)
   - Shows user information
   - Logout functionality

### Protected Routes

The `ProtectedRoute` component handles authentication:

```jsx
// Public route (redirects authenticated users)
<ProtectedRoute requireAuth={false}>
  <Login />
</ProtectedRoute>

// Protected route (redirects unauthenticated users)
<ProtectedRoute requireAuth={true}>
  <Dashboard />
</ProtectedRoute>
```

## API Integration

The authentication system is ready for API integration. Update the following functions in `src/utils/auth.js`:

- `setAuthToken()` - Store JWT token
- `getAuthToken()` - Retrieve JWT token
- `setUserData()` - Store user information
- `getUserData()` - Retrieve user information

## Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update `src/index.css` for custom component styles

### Validation
- Update validation rules in `src/utils/auth.js`
- Modify password requirements in `PASSWORD_REQUIREMENTS`

### Routes
- Add new routes in `src/App.js`
- Create new protected/public pages as needed

## Dependencies

- **React**: 18.2.0
- **React Router**: 6.8.1
- **Heroicons**: 2.0.18
- **Tailwind CSS**: 3.2.7
- **Vite**: 5.0.8

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- ESLint for code linting
- Tailwind CSS for styling
- Vite for fast development

## Security Features

- **Password Strength Validation**
- **Form Input Sanitization**
- **Protected Route Implementation**
- **Session Management**
- **Error Handling**

## Future Enhancements

- [ ] Add forgot password functionality
- [ ] Implement email verification
- [ ] Add two-factor authentication
- [ ] Integrate with real API endpoints
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add dark mode support
- [ ] Add internationalization (i18n)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
