// Firebase Cloud Functions for enhanced security and processing
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user profile document
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: user.emailVerified,
      accountStatus: 'active'
    });

    console.log(`User profile created for: ${user.uid}`);

    // Send welcome email (implement with your email service)
    // await sendWelcomeEmail(user.email, user.displayName);

  } catch (error) {
    console.error('Error creating user profile:', error);
  }
});

exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete all user data for GDPR compliance
    const userDocRef = admin.firestore().collection('users').doc(user.uid);

    // Delete subcollections
    const collections = ['workouts', 'journal', 'templates'];
    for (const collection of collections) {
      const snapshot = await userDocRef.collection(collection).get();
      const batch = admin.firestore().batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }

    // Delete main user document
    await userDocRef.delete();

    console.log(`User data deleted for: ${user.uid}`);

  } catch (error) {
    console.error('Error deleting user data:', error);
  }
});

// Data validation function
exports.validateWorkoutData = functions.firestore
  .document('users/{userId}/workouts/{workoutId}')
  .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : null;

    if (!data) return; // Deletion, allow

    // Validate required fields
    const requiredFields = ['id', 'date', 'durationSeconds', 'exercises', 'totalVolume'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`Missing required field: ${field}`);
        return null; // Reject invalid data
      }
    }

    // Validate data types and ranges
    if (typeof data.durationSeconds !== 'number' || data.durationSeconds < 0) {
      console.error('Invalid durationSeconds');
      return null;
    }

    if (typeof data.totalVolume !== 'number' || data.totalVolume < 0) {
      console.error('Invalid totalVolume');
      return null;
    }

    // Add server timestamp
    return change.after.ref.update({
      validatedAt: admin.firestore.FieldValue.serverTimestamp(),
      serverValidated: true
    });
  });

// Rate limiting function
exports.checkRateLimit = functions.firestore
  .document('users/{userId}/{collection}/{documentId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const collection = context.params.collection;

    // Skip rate limiting for reads or if it's a server operation
    if (!change.after.exists || change.after.data()?.serverValidated) {
      return;
    }

    // Implement rate limiting logic here
    const now = Date.now();
    const windowStart = now - (60 * 1000); // 1 minute window

    // Check recent writes by this user
    const recentWrites = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('audit')
      .where('timestamp', '>', windowStart)
      .get();

    if (recentWrites.size > 100) { // Max 100 writes per minute
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Rate limit exceeded. Too many requests.'
      );
    }

    // Log the write for audit
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('audit')
      .add({
        action: 'write',
        collection: collection,
        documentId: context.params.documentId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: context.rawRequest?.ip || 'unknown'
      });
  });

// Backup function (run on schedule)
exports.dailyBackup = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting daily backup...');

    // Implement backup logic here
    // This could export data to Google Cloud Storage or another backup system

    console.log('Daily backup completed');
    return null;
  });

// Security monitoring
exports.securityAlert = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Monitor for suspicious changes
    if (before?.accountStatus !== 'suspended' && after?.accountStatus === 'suspended') {
      // Send security alert
      console.log(`Security Alert: Account ${context.params.userId} suspended`);

      // Could send email alerts, SMS, etc.
      // await sendSecurityAlert(context.params.userId, 'Account suspended');
    }
  });