# NeuroLift Backend Security Setup

This document outlines the security measures implemented for the NeuroLift backend using Firebase.

## 🚀 Quick Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enable Authentication and Firestore
4. Get your configuration keys

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 3. Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

## 🔒 Security Features

### Authentication Security
- **Email Verification Required**: Users must verify email before accessing data
- **Session Management**: Automatic session timeout (24 hours)
- **Rate Limiting**: Max 100 requests per minute per user
- **Input Validation**: Email and password validation with security patterns
- **Security Monitoring**: Failed login attempts are logged and monitored

### Data Security
- **User-Scoped Data**: All data is isolated per user with Firestore security rules
- **Data Validation**: Server-side validation of all workout and journal data
- **Sanitization**: Automatic removal of potentially dangerous fields
- **Encryption**: Optional client-side encryption for sensitive data
- **Audit Logging**: All data operations are logged for security monitoring

### Firestore Security Rules
```javascript
// Only authenticated, verified users can access their own data
match /users/{userId} {
  allow read, write: if isOwner(userId) && isValidUser();
}
```

### Cloud Functions Security
- **User Lifecycle Management**: Automatic cleanup on account deletion
- **Data Validation**: Server-side validation of all data writes
- **Rate Limiting**: Server-side rate limiting for API calls
- **Security Alerts**: Automated monitoring and alerts

## 🛡️ Security Monitoring

### Security Events Tracked
- Authentication attempts (success/failure)
- Data access patterns
- Suspicious activities
- Rate limit violations

### Monitoring Dashboard
Access security reports via:
```javascript
import { securityMonitor } from './utils/securityMonitor';
const report = securityMonitor.exportSecurityReport();
```

## 🔐 Data Encryption

### Client-Side Encryption
```javascript
import { dataEncryption } from './utils/dataEncryption';

// Initialize with user password
await dataEncryption.generateKey(userPassword);

// Encrypt sensitive data
const encrypted = await dataEncryption.encryptData(sensitiveData);

// Decrypt when needed
const decrypted = await dataEncryption.decryptData(encrypted);
```

### Server-Side Encryption
Firebase automatically encrypts data at rest and in transit.

## 🚦 Rate Limiting

### Client-Side Rate Limiting
- 100 requests per minute per user
- Automatic backoff and retry logic
- User-friendly error messages

### Server-Side Rate Limiting
- Cloud Functions enforce server-side limits
- Automatic blocking of abusive patterns
- Audit logging of violations

## 📊 Audit Logging

### What Gets Logged
- User authentication events
- Data modification operations
- Security violations
- System access patterns

### Log Access
```javascript
const recentEvents = securityMonitor.getRecentEvents(50);
const securityReport = securityMonitor.exportSecurityReport();
```

## 🛠️ Maintenance

### Regular Tasks
```bash
# Clear old security events (monthly)
securityMonitor.clearOldEvents(30);

# Check for suspicious activity
const alerts = securityMonitor.detectSuspiciousActivity();
if (alerts.length > 0) {
  // Send alerts to administrators
}
```

### Backup Strategy
- Daily automated backups via Cloud Functions
- Data exported to secure storage
- 30-day retention policy
- GDPR-compliant deletion

## 🚨 Security Alerts

### Automated Alerts
- Multiple failed authentication attempts
- Unusual data access patterns
- Rate limit violations
- Account suspension events

### Manual Monitoring
```javascript
// Check for security issues
const alerts = securityMonitor.detectSuspiciousActivity();
alerts.forEach(alert => {
  console.warn('Security Alert:', alert);
  // Send notification to security team
});
```

## 🔧 Troubleshooting

### Common Issues

**Authentication Fails**
- Check Firebase project configuration
- Verify email verification is enabled
- Check Firestore security rules

**Data Sync Issues**
- Verify user authentication
- Check network connectivity
- Review Firestore security rules

**Rate Limiting**
- Wait for cooldown period
- Check request frequency
- Contact support if legitimate

## 📞 Support

For security-related issues:
- Check the security monitor logs
- Review Firebase console for errors
- Contact the development team

## 📋 Compliance

### GDPR Compliance
- Right to data deletion (automatic cleanup)
- Data portability (export functionality)
- Consent management (authentication required)
- Audit logging for accountability

### Security Standards
- Firebase security best practices
- OWASP recommendations
- Industry-standard encryption
- Regular security audits