# CampusConnect

A production-ready, responsive, and accessible single-page application for centralized campus event management. Built with vanilla HTML, CSS, and JavaScript.

## 🎯 Overview

CampusConnect provides students, event organizers, and administrators with a central platform to discover, manage, and track campus events. The application features a clean, modern design with comprehensive accessibility support and mobile responsiveness.

## ✨ Features

### Core Functionality
- **Event Discovery**: Browse and search campus events with advanced filtering
- **Event Management**: Create, edit, and delete events (organizer dashboard)
- **RSVP System**: Users can RSVP to events and track their participation
- **Calendar Integration**: Add events to calendar via ICS file download
- **User Authentication**: Login/signup system with role-based access

### Design & UX
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Theme Support**: Dark/light theme toggle with localStorage persistence
- **Modern UI**: Clean design with teal (#06b6d4) and navy (#0f1724) color palette
- **Micro-interactions**: Smooth transitions, hover effects, and loading states
- **Typography**: Inter font for UI, JetBrains Mono for code elements

### Accessibility
- **WCAG Compliant**: Semantic HTML, ARIA roles, and proper labeling
- **Keyboard Navigation**: Full keyboard support with Alt+Left/Right shortcuts
- **Screen Reader Support**: Comprehensive ARIA attributes and descriptions
- **Focus Management**: Visible focus indicators and logical tab order
- **Skip Links**: Quick navigation for assistive technologies

### Technical Features
- **SPA Routing**: Hash-based client-side routing
- **Form Validation**: Comprehensive client-side validation with error handling
- **Local Storage**: Demo data persistence (ready for API integration)
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, and JSON-LD structured data
- **Performance**: Optimized CSS with custom properties and efficient JavaScript

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for development)

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd CampusConnect
   ```

2. **Serve the files**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### Demo Account
- **Email**: `org@uni.edu`
- **Password**: `password`
- **Role**: Organizer (can create/edit events)

## 📱 Responsive Breakpoints

- **Mobile**: ≤ 480px
- **Tablet**: 481px - 1024px  
- **Desktop**: ≥ 1025px

## 🎨 Design System

### Color Palette
- **Primary**: Teal (#06b6d4)
- **Secondary**: Dark Navy (#0f1724)
- **Background**: White (#ffffff) / Dark (#0f1724)
- **Text**: Navy (#0f1724) / Light (#f8fafc)
- **Muted**: Gray (#64748b)

### Typography
- **Primary Font**: Inter (300-800 weights)
- **Monospace**: JetBrains Mono (400-600 weights)
- **Scale**: 12px - 36px with consistent line heights

### Spacing
- **Scale**: 4px base unit (0.25rem - 5rem)
- **Consistent**: Uses CSS custom properties throughout

## 🔧 Development

### Project Structure
```
CampusConnect/
├── index.html          # Main HTML file with semantic structure
├── style.css           # CSS with design system and responsive styles
├── script.js           # JavaScript with SPA routing and functionality
├── README.md           # This file
├── LICENSE             # MIT License
└── assets/             # Optional: favicon, logo, images
    ├── favicon.svg
    ├── favicon.png
    └── logo.svg
```

### Key Components

#### HTML Structure
- Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ARIA roles and attributes for accessibility
- Skip links and focus management
- Theme toggle and mobile navigation

#### CSS Architecture
- CSS Custom Properties for design system
- Mobile-first responsive design
- Dark/light theme support
- Component-based styling
- Print and reduced-motion media queries

#### JavaScript Modules
- **Theme Management**: Dark/light theme toggle
- **Mobile Navigation**: Hamburger menu with accessibility
- **Form Validation**: Comprehensive validation system
- **Router**: Enhanced SPA routing with state management
- **Auth System**: User authentication and session management
- **Event Management**: CRUD operations for events
- **Calendar Integration**: ICS file generation

## 🧪 Testing

### Manual Testing Checklist

#### Accessibility Testing
- [ ] Screen reader compatibility (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation (Tab, Enter, Escape, Alt+Arrow)
- [ ] Focus indicators visible and logical
- [ ] Color contrast meets WCAG AA standards
- [ ] Skip links work properly

#### Responsive Testing
- [ ] Mobile (320px - 480px)
- [ ] Tablet (481px - 1024px)
- [ ] Desktop (1025px+)
- [ ] Touch interactions work on mobile
- [ ] Hamburger menu functions properly

#### Functionality Testing
- [ ] User registration and login
- [ ] Event creation, editing, deletion
- [ ] RSVP functionality
- [ ] Calendar download
- [ ] Search and filtering
- [ ] Theme toggle persistence
- [ ] Form validation

#### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Automated Testing
```bash
# Run accessibility audit (if using axe-core)
npm test

# Run Lighthouse audit
lighthouse http://localhost:8000 --output html
```

## 🔌 API Integration

The application is designed to easily integrate with a backend API. Current localStorage implementation can be replaced with API calls:

### Authentication Endpoints
```javascript
// Replace Auth.login() with:
POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, name, email, isOrganizer } }

// Replace Auth.signup() with:
POST /api/auth/signup
Body: { name, email, password, isOrganizer }
Response: { token, user: { id, name, email, isOrganizer } }
```

### Event Endpoints
```javascript
// Replace Events.all() with:
GET /api/events

// Replace Events.create() with:
POST /api/events
Body: { title, description, date, endDate, location, host, image, category }

// Replace Events.update() with:
PUT /api/events/:id
Body: { title, description, date, endDate, location, host, image, category }

// Replace Events.remove() with:
DELETE /api/events/:id
```

### RSVP Endpoints
```javascript
// Replace Events.rsvp() with:
POST /api/events/:id/rsvp

// Replace Events.unrsvp() with:
DELETE /api/events/:id/rsvp

// Replace Events.byUser() with:
GET /api/users/:id/rsvps
```

## 🚀 Deployment

### Static Hosting
The application can be deployed to any static hosting service:

- **Netlify**: Drag and drop the folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Enable in repository settings
- **AWS S3**: Upload files to S3 bucket
- **Firebase Hosting**: Use Firebase CLI

### Environment Variables
For production deployment, update:
- Meta tag URLs (`og:url`, `twitter:url`)
- JSON-LD structured data URLs
- API endpoints (when backend is ready)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow semantic HTML practices
- Maintain accessibility standards
- Use the established design system
- Test across different devices and browsers
- Document any new features or changes

## 📞 Support

For support, email support@campusconnect.edu or create an issue in the repository.

## 🎉 Acknowledgments

- Design inspiration from modern web applications
- Accessibility guidelines from WCAG 2.1
- Typography from Google Fonts (Inter, JetBrains Mono)
- Icons and emojis for visual elements

---

**CampusConnect** - Connecting campus communities through events 🎓✨
