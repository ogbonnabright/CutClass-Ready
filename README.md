# CutClass

CutClass is a React + Vite application. This version replaces the demo browser-local login system with Firebase Authentication (email/password) and Firestore user profiles.

## 1. Create/configure your Firebase project

1. Open https://console.firebase.google.com/ and create/select a project.
2. In **Build → Authentication → Get started → Sign-in method**, enable **Email/Password**.
3. In **Build → Firestore Database**, create a database. Start in production mode; the included `firestore.rules` file contains the initial user-profile rules.
4. In **Project settings → General → Your apps**, add a Web app and copy its Firebase configuration values.
5. In **Authentication → Settings → Authorized domains**, add the Firebase Hosting domain once it is created. Add your custom domain there too if you use one.

## 2. Configure local environment

Install Node.js LTS, then copy `.env.example` to `.env` and replace each placeholder with the values from your Firebase Web app configuration:

```bash
npm install
npm run dev
```

The `.env` file should contain these variables (the Firebase web configuration is intended to be public app configuration, not a service-account key):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Never put Firebase Admin SDK service-account credentials or other private server secrets in a `VITE_` variable.

## 3. Deploy to Firebase Hosting

From this project directory:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

Choose the Firebase project you created. Then deploy the Firestore rules and the website:

```bash
firebase deploy --only firestore:rules
npm run build
firebase deploy --only hosting
```

The build output is `dist/`; `firebase.json` configures Firebase Hosting to serve it and route React paths to `index.html`.

## Authentication and data notes

- Passwords are managed by Firebase Authentication; they are not saved to Firestore or localStorage by this implementation.
- User profile documents are stored at `users/{uid}`.
- The initial Firestore rules deny all other collections. Before adding bookings, barber profiles, subscription records or payment records, design explicit rules for those records. Do not loosen the catch-all rule as a shortcut.
- Existing demo users and passwords previously stored in each browser's localStorage are not migrated. Users need to create new Firebase accounts. Do not import old browser-stored password values into Firestore.
- Email verification must be completed from the link Firebase sends. The profile page's refresh control checks the actual Firebase verification status; it cannot mark an email verified by itself.
- Firebase Hosting only hosts the frontend. Real subscription billing, booking workflows, and any privileged operations need their own secure implementation and must not trust client-supplied payment status.
