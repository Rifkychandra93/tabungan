// Savings Tracker Application
class SavingsTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.init();
    }

    init() {
        this.updateDisplay();
        this.attachEventListeners();
    }

    // Load transactions from localStorage
    loadTransactions() {
        const saved = localStorage.getItem('savingsTransactions');
        return saved ? JSON.parse(saved) : [];
    }

    // Save transactions to localStorage
    saveTransactions() {
        localStorage.setItem('savingsTransactions', JSON.stringify(this.transactions));
    }

    // Add new transaction
    addTransaction(amount, type, description) {
        const transaction = {
            id: Date.now(),
            amount: parseFloat(amount),
            type: type,
            description: description || (type === 'income' ? 'Income' : 'Expense'),
            date: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateDisplay();
        this.animateBalance();
    }

    // Delete transaction
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.updateDisplay();
    }

    // Clear all transactions
    clearAllTransactions() {
        if (this.transactions.length === 0) return;
        
        if (confirm('Are you sure you want to clear all transactions? This cannot be undone.')) {
            this.transactions = [];
            this.saveTransactions();
            this.updateDisplay();
        }
    }

    // Calculate totals
    calculateTotals() {
        let income = 0;
        let expense = 0;

        this.transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                income += transaction.amount;
            } else {
                expense += transaction.amount;
            }
        });

        return {
            income,
            expense,
            balance: income - expense
        };
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('IDR', 'Rp');
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // If today
        if (diffDays === 0) {
            return 'Today, ' + date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        // If yesterday
        if (diffDays === 1) {
            return 'Yesterday, ' + date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }

        // If within a week
        if (diffDays < 7) {
            return date.toLocaleDateString('en-US', { 
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }

        // Otherwise
        return date.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Update display
    updateDisplay() {
        const totals = this.calculateTotals();

        // Update balance card
        document.getElementById('totalBalance').textContent = this.formatCurrency(totals.balance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totals.income);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totals.expense);

        // Update transaction list
        this.renderTransactions();
    }

    // Render transactions
    renderTransactions() {
        const transactionList = document.getElementById('transactionList');

        if (this.transactions.length === 0) {
            transactionList.innerHTML = `
                <div class="empty-state">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="40" stroke="#e5e7eb" stroke-width="3" stroke-dasharray="5 5"/>
                        <text x="50" y="60" font-size="40" fill="#e5e7eb" text-anchor="middle">📊</text>
                    </svg>
                    <p>No transactions yet</p>
                    <span>Start by adding your first transaction above</span>
                </div>
            `;
            return;
        }

        transactionList.innerHTML = this.transactions.map(transaction => `
            <div class="transaction-item ${transaction.type}" data-id="${transaction.id}">
                <div class="transaction-icon">
                    ${transaction.type === 'income' ? '+' : '-'}
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <button class="transaction-delete" onclick="tracker.deleteTransaction(${transaction.id})">
                    ×
                </button>
            </div>
        `).join('');
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Animate balance
    animateBalance() {
        const balanceElement = document.getElementById('totalBalance');
        balanceElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            balanceElement.style.transform = 'scale(1)';
        }, 300);
    }

    // Attach event listeners
    attachEventListeners() {
        const form = document.getElementById('transactionForm');
        const amountInput = document.getElementById('amount');
        const descriptionInput = document.getElementById('description');

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const amount = amountInput.value;
            const description = descriptionInput.value;
            const type = e.submitter.dataset.type;

            if (!amount || amount <= 0) {
                this.showNotification('Please enter a valid amount', 'error');
                return;
            }

            this.addTransaction(amount, type, description);
            
            // Reset form
            amountInput.value = '';
            descriptionInput.value = '';
            amountInput.focus();

            // Show notification
            this.showNotification(
                `${type === 'income' ? 'Income' : 'Expense'} added successfully!`,
                'success'
            );
        });

        // Clear history button
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearAllTransactions();
        });

        // Format amount input on blur
        amountInput.addEventListener('input', (e) => {
            // Remove any non-numeric characters except decimal point
            e.target.value = e.target.value.replace(/[^\d]/g, '');
        });
    }

    // Show notification
    showNotification(message, type) {
        // Remove existing notification if any
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            background: type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            zIndex: '1000',
            animation: 'slideInRight 0.3s ease-out',
            fontWeight: '500',
            fontSize: '14px',
            maxWidth: '300px'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }

    #totalBalance {
        transition: transform 0.3s ease;
    }
`;
document.head.appendChild(style);

// Initialize the app
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new SavingsTracker();
});
