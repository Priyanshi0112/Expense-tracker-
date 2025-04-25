// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseName = document.getElementById('expense-name');
const expenseAmount = document.getElementById('expense-amount');
const expenseCategory = document.getElementById('expense-category');
const expenseDate = document.getElementById('expense-date');
const expenseList = document.getElementById('expense-list');
const totalExpensesEl = document.getElementById('total-expenses');
const averageExpenseEl = document.getElementById('average-expense');
const largestExpenseEl = document.getElementById('largest-expense');
const expenseCountEl = document.getElementById('expense-count');
const filterCategory = document.getElementById('filter-category');
const sortBy = document.getElementById('sort-by');
const clearFiltersBtn = document.getElementById('clear-filters');
const categoryBreakdownEl = document.getElementById('category-breakdown');
const toast = document.getElementById('toast');

// Set today's date as default for date input
expenseDate.valueAsDate = new Date();

// Expense array
let expenses = [];
let filteredExpenses = [];

// Category icons mapping
const categoryIcons = {
    'Food': 'fa-utensils',
    'Transport': 'fa-car',
    'Entertainment': 'fa-film',
    'Utilities': 'fa-bolt',
    'Shopping': 'fa-shopping-bag',
    'Housing': 'fa-home',
    'Health': 'fa-heartbeat',
    'Education': 'fa-graduation-cap',
    'Other': 'fa-question-circle'
};

// Load expenses from localStorage
function loadExpenses() {
    const storedExpenses = localStorage.getItem('expenses');
    if (storedExpenses) {
        expenses = JSON.parse(storedExpenses);
        applyFiltersAndSort();
    }
}

// Save expenses to localStorage
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = '';
    
    const icon = document.createElement('i');
    icon.className = type === 'success' 
        ? 'fas fa-check-circle' 
        : 'fas fa-exclamation-circle';
    
    const text = document.createTextNode(message);
    
    toast.appendChild(icon);
    toast.appendChild(text);
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Add new expense
function addExpense(name, amount, category, date) {
    const expense = {
        id: Date.now(),
        name,
        amount: parseFloat(amount),
        category,
        date
    };
    
    expenses.push(expense);
    saveExpenses();
    applyFiltersAndSort();
    showToast('Expense added successfully!');
    
    // Reset form
    expenseForm.reset();
    expenseDate.valueAsDate = new Date();
}

// Delete expense
function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    applyFiltersAndSort();
    showToast('Expense deleted!');
}

// Apply filters and sorting
function applyFiltersAndSort() {
    const categoryFilter = filterCategory.value;
    const sortOption = sortBy.value;
    
    // Filter expenses
    filteredExpenses = categoryFilter 
        ? expenses.filter(expense => expense.category === categoryFilter)
        : [...expenses];
    
    // Sort expenses
    switch(sortOption) {
        case 'date-desc':
            filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'amount-desc':
            filteredExpenses.sort((a, b) => b.amount - a.amount);
            break;
        case 'amount-asc':
            filteredExpenses.sort((a, b) => a.amount - b.amount);
            break;
        case 'name-asc':
            filteredExpenses.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    updateUI();
}

// Update UI
function updateUI() {
    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="no-expenses">
                <i class="fas fa-inbox fa-3x"></i>
                <p>No expenses added yet. Start tracking your spending!</p>
            </div>
        `;
        updateSummary(0, 0, 0, 0);
        updateCategoryBreakdown();
        return;
    }
    
    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = `
            <div class="no-expenses">
                <i class="fas fa-filter fa-3x"></i>
                <p>No expenses match your filters.</p>
            </div>
        `;
        updateSummary(0, 0, 0, 0);
        return;
    }
    
    // Create table
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Calculate statistics
    let total = 0;
    let largest = 0;
    
    filteredExpenses.forEach(expense => {
        const formattedDate = new Date(expense.date).toLocaleDateString();
        
        html += `
            <tr>
                <td>${expense.name}</td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>
                    <span class="expense-category category-${expense.category}">
                        <i class="fas ${categoryIcons[expense.category]}"></i> 
                        ${expense.category}
                    </span>
                </td>
                <td>${formattedDate}</td>
                <td class="action-buttons">
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
        
        total += expense.amount;
        largest = Math.max(largest, expense.amount);
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    expenseList.innerHTML = html;
    
    // Calculate stats based on all expenses, not just filtered
    const allTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const allLargest = Math.max(...expenses.map(expense => expense.amount));
    const allAverage = allTotal / expenses.length || 0;
    
    updateSummary(allTotal, allAverage, allLargest, expenses.length);
    updateCategoryBreakdown();
}

// Update summary
function updateSummary(total, average, largest, count) {
    totalExpensesEl.textContent = `$${total.toFixed(2)}`;
    averageExpenseEl.textContent = `$${average.toFixed(2)}`;
    largestExpenseEl.textContent = `$${largest.toFixed(2)}`;
    expenseCountEl.textContent = count;
}

// Update category breakdown
function updateCategoryBreakdown() {
    if (expenses.length === 0) {
        categoryBreakdownEl.innerHTML = `
            <div class="no-expenses">
                <p>Add expenses to see category breakdown</p>
            </div>
        `;
        return;
    }

    const categoryTotals = {};
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate total for each category
    expenses.forEach(expense => {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });
    
    let html = '';
    
    // Create category items
    for (const [category, amount] of Object.entries(categoryTotals)) {
        const percentage = ((amount / totalAmount) * 100).toFixed(1);
        
        html += `
            <div class="category-item">
                <div class="category-name">
                    <i class="fas ${categoryIcons[category]}"></i> ${category}
                </div>
                <div class="category-amount">$${amount.toFixed(2)}</div>
                <div class="category-percent">${percentage}%</div>
            </div>
        `;
    }
    
    categoryBreakdownEl.innerHTML = html;
}

// Clear filters
function clearFilters() {
    filterCategory.value = '';
    sortBy.value = 'date-desc';
    applyFiltersAndSort();
}

// Event listeners
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!expenseName.value || !expenseAmount.value || !expenseCategory.value || !expenseDate.value) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    addExpense(expenseName.value, expenseAmount.value, expenseCategory.value, expenseDate.value);
});

filterCategory.addEventListener('change', applyFiltersAndSort);
sortBy.addEventListener('change', applyFiltersAndSort);
clearFiltersBtn.addEventListener('click', clearFilters);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadExpenses();
});