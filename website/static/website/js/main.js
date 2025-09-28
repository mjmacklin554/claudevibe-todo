// Taskflow - Main JavaScript File

// Daily Tasks Functionality
const TaskManager = {
    // Edit task form functionality
    editTask: function(hour) {
        // Hide all other edit forms
        document.querySelectorAll('[id^="edit-form-"]').forEach(form => {
            if (form.id !== `edit-form-${hour}`) {
                form.style.display = 'none';
            }
        });

        // Show the selected form
        const form = document.getElementById(`edit-form-${hour}`);
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';

            // Focus on the title input
            if (form.style.display === 'block') {
                const titleInput = form.querySelector('input[name="title"]');
                if (titleInput) {
                    titleInput.focus();
                }
            }
        }
    },

    // Cancel edit form
    cancelEdit: function(hour) {
        const form = document.getElementById(`edit-form-${hour}`);
        if (form) {
            form.style.display = 'none';
        }
    },

    // Initialize task manager
    init: function() {
        // Close edit forms when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.task-form') && !event.target.closest('button')) {
                document.querySelectorAll('[id^="edit-form-"]').forEach(form => {
                    form.style.display = 'none';
                });
            }
        });

        // Handle form submissions with loading states
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.classList.add('loading');
                    submitBtn.disabled = true;
                }
            });
        });

        // Auto-save functionality for task forms (optional enhancement)
        this.initAutoSave();
    },

    // Auto-save functionality (saves draft as user types)
    initAutoSave: function() {
        const taskForms = document.querySelectorAll('.task-form form');
        taskForms.forEach(form => {
            const inputs = form.querySelectorAll('input[name="title"], textarea[name="description"]');
            inputs.forEach(input => {
                let timeout;
                input.addEventListener('input', function() {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        // Save to localStorage as draft
                        const hour = form.querySelector('input[name="hour"]').value;
                        const formData = {
                            title: form.querySelector('input[name="title"]').value,
                            description: form.querySelector('textarea[name="description"]').value,
                            priority: form.querySelector('select[name="priority"]').value
                        };
                        localStorage.setItem(`task-draft-${hour}`, JSON.stringify(formData));
                    }, 1000);
                });
            });

            // Load drafts when form is opened
            const hour = form.querySelector('input[name="hour"]').value;
            const draft = localStorage.getItem(`task-draft-${hour}`);
            if (draft) {
                const data = JSON.parse(draft);
                const titleInput = form.querySelector('input[name="title"]');
                const descInput = form.querySelector('textarea[name="description"]');
                const prioritySelect = form.querySelector('select[name="priority"]');

                if (titleInput && !titleInput.value) titleInput.value = data.title || '';
                if (descInput && !descInput.value) descInput.value = data.description || '';
                if (prioritySelect && data.priority) prioritySelect.value = data.priority;
            }
        });
    },

    // Clear draft after successful save
    clearDraft: function(hour) {
        localStorage.removeItem(`task-draft-${hour}`);
    }
};

// Calendar Functionality
const CalendarManager = {
    // Navigate to specific month/year
    navigateToMonth: function(year, month) {
        const url = new URL(window.location);
        url.searchParams.set('year', year);
        url.searchParams.set('month', month);
        window.location.href = url.toString();
    },

    // Keyboard navigation for calendar
    initKeyboardNavigation: function() {
        document.addEventListener('keydown', function(e) {
            if (e.target.closest('.calendar-day')) {
                const currentDay = e.target.closest('.calendar-day');
                let nextDay;

                switch(e.key) {
                    case 'ArrowRight':
                        nextDay = currentDay.closest('td').nextElementSibling?.querySelector('.calendar-day');
                        break;
                    case 'ArrowLeft':
                        nextDay = currentDay.closest('td').previousElementSibling?.querySelector('.calendar-day');
                        break;
                    case 'ArrowDown':
                        const nextRow = currentDay.closest('tr').nextElementSibling;
                        if (nextRow) {
                            const cellIndex = Array.from(currentDay.closest('tr').children).indexOf(currentDay.closest('td'));
                            nextDay = nextRow.children[cellIndex]?.querySelector('.calendar-day');
                        }
                        break;
                    case 'ArrowUp':
                        const prevRow = currentDay.closest('tr').previousElementSibling;
                        if (prevRow) {
                            const cellIndex = Array.from(currentDay.closest('tr').children).indexOf(currentDay.closest('td'));
                            nextDay = prevRow.children[cellIndex]?.querySelector('.calendar-day');
                        }
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        currentDay.click();
                        return;
                }

                if (nextDay) {
                    e.preventDefault();
                    nextDay.focus();
                }
            }
        });

        // Make calendar days focusable
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.setAttribute('tabindex', '0');
        });
    }
};

// Alert Management
const AlertManager = {
    // Auto-dismiss alerts after a certain time
    initAutoDismiss: function() {
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(alert => {
            setTimeout(() => {
                const closeBtn = alert.querySelector('.btn-close');
                if (closeBtn) {
                    closeBtn.click();
                }
            }, 5000); // Auto-dismiss after 5 seconds
        });
    },

    // Show custom alert
    show: function(message, type = 'info', duration = 5000) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        const container = document.querySelector('.messages') || document.querySelector('.container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', alertHtml);

            // Auto-dismiss
            if (duration > 0) {
                setTimeout(() => {
                    const alert = container.querySelector('.alert');
                    if (alert) {
                        const closeBtn = alert.querySelector('.btn-close');
                        if (closeBtn) closeBtn.click();
                    }
                }, duration);
            }
        }
    }
};

// Form Enhancements
const FormManager = {
    // Add form validation enhancements
    init: function() {
        // Real-time validation feedback
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', function() {
                    this.validateInput();
                });

                input.addEventListener('input', function() {
                    if (this.classList.contains('is-invalid')) {
                        this.validateInput();
                    }
                });
            });
        });

        // Add validation method to input elements
        HTMLInputElement.prototype.validateInput = function() {
            if (this.checkValidity()) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            } else {
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
            }
        };

        HTMLTextAreaElement.prototype.validateInput = HTMLInputElement.prototype.validateInput;
        HTMLSelectElement.prototype.validateInput = HTMLInputElement.prototype.validateInput;
    },

    // Confirm before form submission for destructive actions
    confirmSubmit: function(form, message) {
        form.addEventListener('submit', function(e) {
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    }
};

// Utility Functions
const Utils = {
    // Smooth scroll to element
    scrollTo: function(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    },

    // Format date for display
    formatDate: function(date) {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    // Debounce function for performance
    debounce: function(func, wait) {
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

    // Check if user prefers reduced motion
    prefersReducedMotion: function() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
};

// Theme Management (for future dark mode support)
const ThemeManager = {
    // Get current theme
    getCurrentTheme: function() {
        return localStorage.getItem('theme') || 'light';
    },

    // Set theme
    setTheme: function(theme) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        // Update theme toggle button if it exists
        const themeToggle = document.querySelector('#theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    },

    // Initialize theme
    init: function() {
        const savedTheme = this.getCurrentTheme();
        this.setTheme(savedTheme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all managers
    TaskManager.init();
    CalendarManager.initKeyboardNavigation();
    AlertManager.initAutoDismiss();
    FormManager.init();
    ThemeManager.init();

    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                Utils.scrollTo(target, 20);
            }
        });
    });

    // Add loading states to navigation links
    document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])').forEach(link => {
        link.addEventListener('click', function() {
            if (!this.target || this.target === '_self') {
                this.classList.add('loading');
            }
        });
    });

    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    console.log('Taskflow JavaScript initialized successfully!');
});

// Export functions for global access (if needed)
window.TaskManager = TaskManager;
window.CalendarManager = CalendarManager;
window.AlertManager = AlertManager;
window.Utils = Utils;

// Global functions for backward compatibility
window.editTask = TaskManager.editTask.bind(TaskManager);
window.cancelEdit = TaskManager.cancelEdit.bind(TaskManager);