/* ============================================
   MCSS - Core Script
   Shared utilities and functions
   ============================================ */

// Theme Management
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('mcss-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateIcon(savedTheme);
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mcss-theme', next);
        this.updateIcon(next);
    },

    updateIcon(theme) {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }
    }
};

// Toast Notifications
const Toast = {
    container: null,

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    show(message, type = 'success', duration = 3000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠'
        };

        toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
        this.container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration + 300);
    }
};

// Navigation
const Navigation = {
    init() {
        // Highlight active nav link
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });

        // Mobile menu toggle
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
};

// Data Constants
const CONSTANTS = {
    CLASSES: {
        PHYSICAL: ['M1', 'M2', 'M3', 'M4', 'ME'],
        BIO: ['B1', 'B2']
    },

    SECTIONS: {
        PHYSICAL: 'Physical Science',
        BIO: 'Bio Science'
    },

    SUBJECTS: {
        PHYSICAL: ['Combined Mathematics', 'Physics', 'Chemistry'],
        BIO: ['Biology', 'Physics', 'Chemistry']
    },

    TERMS: ['Term 1', 'Term 2', 'Term 3']
};

// Utility Functions
const Utils = {
    // Get section from class
    getSection(className) {
        if (CONSTANTS.CLASSES.PHYSICAL.includes(className)) {
            return CONSTANTS.SECTIONS.PHYSICAL;
        }
        if (CONSTANTS.CLASSES.BIO.includes(className)) {
            return CONSTANTS.SECTIONS.BIO;
        }
        return '';
    },

    // Get subjects from class
    getSubjects(className) {
        const section = this.getSection(className);
        if (section === CONSTANTS.SECTIONS.PHYSICAL) {
            return CONSTANTS.SUBJECTS.PHYSICAL;
        }
        if (section === CONSTANTS.SECTIONS.BIO) {
            return CONSTANTS.SUBJECTS.BIO;
        }
        return [];
    },

    // Calculate mean
    mean(values) {
        if (!values.length) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    },

    // Calculate standard deviation
    stdDev(values) {
        if (values.length < 2) return 0;
        const m = this.mean(values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / values.length;
        return Math.sqrt(variance);
    },

    // Calculate Z-Score
    zScore(value, mean, stdDev) {
        if (stdDev === 0) return 0;
        return (value - mean) / stdDev;
    },

    // Format number
    formatNumber(num, decimals = 2) {
        return Number(num).toFixed(decimals);
    },

    // Get initials from name
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Date formatter
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};

// A/L Prediction Engine
const PredictionEngine = {
    predict(studentData) {
        const { terms, avgZScore, trend } = studentData;

        // Calculate weighted score based on multiple factors
        let score = 0;

        // Z-Score factor (40%)
        const zScoreFactor = Math.min(Math.max((avgZScore + 3) / 6, 0), 1) * 40;
        score += zScoreFactor;

        // Trend factor (30%) - improving, stable, declining
        const trendFactor = trend === 'improving' ? 30 : trend === 'stable' ? 20 : 10;
        score += trendFactor;

        // Consistency factor (20%)
        const marks = terms.map(t => t.total);
        const consistency = marks.length > 1 ? 
            1 - (Utils.stdDev(marks) / Utils.mean(marks)) : 0.5;
        score += consistency * 20;

        // Term completion factor (10%)
        score += (terms.length / 3) * 10;

        // Determine predictions
        const predictions = [];

        if (score >= 75) {
            predictions.push({ grade: '3A', probability: Math.min(score, 95) });
            predictions.push({ grade: '2A 1B', probability: Math.max(100 - score, 5) });
            predictions.push({ grade: '1A 2B', probability: 2 });
        } else if (score >= 60) {
            predictions.push({ grade: '2A 1B', probability: score - 50 });
            predictions.push({ grade: '3A', probability: Math.max(score - 60, 5) });
            predictions.push({ grade: '1A 2B', probability: 100 - (score - 50) - Math.max(score - 60, 5) });
        } else if (score >= 45) {
            predictions.push({ grade: '1A 2B', probability: score - 35 });
            predictions.push({ grade: '2A 1B', probability: Math.max(score - 45, 5) });
            predictions.push({ grade: '3B', probability: 100 - (score - 35) - Math.max(score - 45, 5) });
        } else if (score >= 30) {
            predictions.push({ grade: '3B', probability: score - 20 });
            predictions.push({ grade: '1A 2B', probability: Math.max(score - 30, 5) });
            predictions.push({ grade: '2B 1C', probability: 100 - (score - 20) - Math.max(score - 30, 5) });
        } else {
            predictions.push({ grade: '2B 1C', probability: Math.max(score, 30) });
            predictions.push({ grade: '3B', probability: Math.max(40 - score, 10) });
            predictions.push({ grade: '1B 2C', probability: Math.max(30 - score, 5) });
        }

        // Normalize probabilities
        const total = predictions.reduce((sum, p) => sum + p.probability, 0);
        return predictions.map(p => ({
            grade: p.grade,
            probability: Math.round((p.probability / total) * 100)
        })).sort((a, b) => b.probability - a.probability);
    }
};

// Export functions for modules
window.ThemeManager = ThemeManager;
window.Toast = Toast;
window.Navigation = Navigation;
window.CONSTANTS = CONSTANTS;
window.Utils = Utils;
window.PredictionEngine = PredictionEngine;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Navigation.init();
    Toast.init();
});
