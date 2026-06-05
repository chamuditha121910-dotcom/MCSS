# MCSS - Marks Calculation & Student Statistics System

A modern, professional web application for analyzing Advanced Level Science students' term test marks.

## 🎨 Features

- **Premium Golden Yellow + Black Theme** with glassmorphism effects
- **Fully Responsive Design** - works on desktop, tablet, and mobile
- **Dark/Light Mode** support
- **Hidden Mark Entry** via keyboard shortcut (Ctrl + Shift + A + M)
- **Smart Student Search** with autocomplete
- **Automatic Z-Score Calculation** (separate for Physical & Bio Science)
- **Automatic Ranking System** (Class, Section)
- **A/L Exam Prediction Engine**
- **Real-time Updates** via Firebase
- **Chart.js Visualizations** for performance tracking
- **PDF & Excel Export** capabilities
- **Admin Panel** for data management

## 🏗️ Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Firebase (Firestore + Authentication)
- **Charts:** Chart.js 4.4.1
- **Export:** jsPDF, CSV
- **Design:** Glassmorphism, CSS Grid, Flexbox

## 📁 File Structure

```
mcss/
├── index.html          # Dashboard (Homepage)
├── dashboard.html      # Dashboard redirect
├── student.html        # Student Profile
├── analytics.html      # Advanced Analytics
├── admin.html          # Admin Panel
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── script.js           # Core utilities
│   ├── firebase.js         # Database operations
│   ├── dashboard.js        # Dashboard logic
│   ├── student.js          # Student profile logic
│   ├── analytics.js        # Analytics logic
│   └── admin.js            # Admin panel logic
└── README.md
```

## 🚀 Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (optional, for admin access)

### 2. Configure Firebase
Open `js/firebase-config.js` and replace with your Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### 3. Firestore Rules
Set up Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development only
    }
  }
}
```

> ⚠️ **Note:** Use proper authentication rules for production!

### 4. Deploy
Host the files on any static hosting service:
- Firebase Hosting
- GitHub Pages
- Netlify
- Vercel

## 📊 Student Structure

### Physical Science Classes
- M1, M2, M3, M4, ME
- Subjects: Combined Mathematics, Physics, Chemistry

### Bio Science Classes
- B1, B2
- Subjects: Biology, Physics, Chemistry

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + A + M` | Open Mark Entry Modal |

## 🔢 Z-Score Formula

```
Z = (X - μ) / σ
```

Where:
- **X** = Student Total Marks
- **μ** = Mean Total Marks of Student's Section
- **σ** = Standard Deviation of Student's Section

> Physical Science and Bio Science students are NEVER compared together.

## 🎨 Color Scheme

| Color | Hex Code | Usage |
|-------|----------|-------|
| Golden Yellow | `#FFD700` | Primary accent, highlights |
| Black | `#000000` | Background, text |
| White | `#FFFFFF` | Text, borders |

## 📱 Responsive Breakpoints

- **Desktop:** > 1024px
- **Tablet:** 768px - 1024px
- **Mobile:** < 768px
- **Small Mobile:** < 480px

## 🔒 Security Notes

- The hidden mark entry (Ctrl+Shift+A+M) provides a layer of obscurity
- For production, implement Firebase Authentication
- Use proper Firestore security rules
- Validate all input data on both client and server

## 📝 License

MIT License - Free for educational use.

## 🙏 Credits

- Chart.js for beautiful charts
- Firebase for real-time database
- Google Fonts (Poppins)
