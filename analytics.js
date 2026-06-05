/* ============================================
   MCSS - Analytics Script
   Advanced analytics with charts and comparisons
   ============================================ */

class AnalyticsController {
    constructor() {
        this.students = [];
        this.marks = [];
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadData();
        this.renderClassComparison();
        this.renderSubjectPerformance();
        this.renderRankDistribution();
        this.renderSectionComparison();
        this.setupRealtimeListeners();
    }

    async loadData() {
        try {
            const studentsResult = await db.getAllStudents();
            if (studentsResult.success) this.students = studentsResult.data;

            const marksResult = await db.getAllMarks();
            if (marksResult.success) this.marks = marksResult.data;
        } catch (error) {
            console.error('Error loading analytics data:', error);
            Toast.show('Error loading analytics data', 'error');
        }
    }

    setupRealtimeListeners() {
        db.onMarksChange(() => {
            this.loadData().then(() => {
                this.renderClassComparison();
                this.renderSubjectPerformance();
                this.renderRankDistribution();
                this.renderSectionComparison();
            });
        });
    }

    renderClassComparison() {
        const allClasses = [...CONSTANTS.CLASSES.PHYSICAL, ...CONSTANTS.CLASSES.BIO];

        const classAverages = allClasses.map(className => {
            const classMarks = this.marks.filter(m => m.class === className);
            if (classMarks.length === 0) return 0;
            return Utils.mean(classMarks.map(m => m.total));
        });

        const ctx = document.getElementById('class-comparison-chart');
        if (!ctx) return;

        if (this.charts.classComparison) {
            this.charts.classComparison.destroy();
        }

        this.charts.classComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allClasses,
                datasets: [{
                    label: 'Average Total Marks',
                    data: classAverages,
                    backgroundColor: allClasses.map((_, i) => 
                        i < 5 ? 'rgba(59, 130, 246, 0.7)' : 'rgba(34, 197, 94, 0.7)'
                    ),
                    borderColor: allClasses.map((_, i) => 
                        i < 5 ? '#3B82F6' : '#22C55E'
                    ),
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: 'Poppins', size: 13 },
                        bodyFont: { family: 'Poppins', size: 12 },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                            font: { family: 'Poppins' }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                            font: { family: 'Poppins' }
                        }
                    }
                }
            }
        });
    }

    renderSubjectPerformance() {
        const allSubjects = ['Combined Mathematics', 'Physics', 'Chemistry', 'Biology'];

        const subjectAverages = allSubjects.map(subject => {
            const subjectMarks = this.marks.filter(m => 
                m.subjects && m.subjects[subject] !== undefined
            );
            if (subjectMarks.length === 0) return 0;
            return Utils.mean(subjectMarks.map(m => m.subjects[subject]));
        });

        const ctx = document.getElementById('subject-performance-chart');
        if (!ctx) return;

        if (this.charts.subjectPerformance) {
            this.charts.subjectPerformance.destroy();
        }

        this.charts.subjectPerformance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: allSubjects,
                datasets: [{
                    label: 'Average Marks',
                    data: subjectAverages,
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    borderColor: '#FFD700',
                    borderWidth: 2,
                    pointBackgroundColor: '#FFD700',
                    pointBorderColor: '#000',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: 'Poppins', size: 13 },
                        bodyFont: { family: 'Poppins', size: 12 },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                            font: { family: 'Poppins', size: 11 }
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                            font: { family: 'Poppins', size: 10 },
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    }

    renderRankDistribution() {
        // Get all section ranks
        const physicalRanks = this.marks
            .filter(m => m.section === CONSTANTS.SECTIONS.PHYSICAL)
            .map(m => m.sectionRank)
            .filter(r => r);

        const bioRanks = this.marks
            .filter(m => m.section === CONSTANTS.SECTIONS.BIO)
            .map(m => m.sectionRank)
            .filter(r => r);

        const allRanks = [...physicalRanks, ...bioRanks];

        const top10 = allRanks.filter(r => r <= 10).length;
        const top25 = allRanks.filter(r => r > 10 && r <= 25).length;
        const top50 = allRanks.filter(r => r > 25 && r <= 50).length;
        const others = allRanks.filter(r => r > 50).length;

        const ctx = document.getElementById('rank-distribution-chart');
        if (!ctx) return;

        if (this.charts.rankDistribution) {
            this.charts.rankDistribution.destroy();
        }

        this.charts.rankDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Top 10', 'Top 25', 'Top 50', 'Others'],
                datasets: [{
                    data: [top10, top25, top50, others],
                    backgroundColor: [
                        '#FFD700',
                        '#C0C0C0',
                        '#CD7F32',
                        'rgba(255, 255, 255, 0.1)'
                    ],
                    borderColor: [
                        '#FFD700',
                        '#C0C0C0',
                        '#CD7F32',
                        'rgba(255, 255, 255, 0.2)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                            font: { family: 'Poppins', size: 12 },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: 'Poppins', size: 13 },
                        bodyFont: { family: 'Poppins', size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderSectionComparison() {
        const physicalMarks = this.marks.filter(m => m.section === CONSTANTS.SECTIONS.PHYSICAL);
        const bioMarks = this.marks.filter(m => m.section === CONSTANTS.SECTIONS.BIO);

        const physicalAvg = physicalMarks.length > 0 ? Utils.mean(physicalMarks.map(m => m.total)) : 0;
        const bioAvg = bioMarks.length > 0 ? Utils.mean(bioMarks.map(m => m.total)) : 0;

        const ctx = document.getElementById('section-comparison-chart');
        if (!ctx) return;

        if (this.charts.sectionComparison) {
            this.charts.sectionComparison.destroy();
        }

        this.charts.sectionComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Physical Science', 'Bio Science'],
                datasets: [{
                    label: 'Average Total Marks',
                    data: [physicalAvg, bioAvg],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(34, 197, 94, 0.7)'
                    ],
                    borderColor: [
                        '#3B82F6',
                        '#22C55E'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: 'Poppins', size: 13 },
                        bodyFont: { family: 'Poppins', size: 12 },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                            font: { family: 'Poppins' }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                            font: { family: 'Poppins' }
                        }
                    }
                }
            }
        });
    }
}

// Initialize analytics
let analyticsController;
document.addEventListener('DOMContentLoaded', () => {
    analyticsController = new AnalyticsController();
});
