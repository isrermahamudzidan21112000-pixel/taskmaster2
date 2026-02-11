// Task Manager App Logic

let tasks = [];
let currentFilter = 'all';
let currentPriority = 'medium';
let deferredPrompt;

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
        updateStats();
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Add new task
function addTask() {
    const input = document.getElementById('task-input');
    const taskText = input.value.trim();
    
    if (taskText === '') {
        input.focus();
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        priority: currentPriority,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    input.value = '';
    saveTasks();
    renderTasks();
    updateStats();
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
}

// Clear completed tasks
function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    updateStats();
}

// Render tasks
function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    let filteredTasks = tasks;
    
    // Apply filter
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3>No tasks yet</h3>
                <p>Add a task to get started!</p>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = filteredTasks.map(task => {
        const priorityClass = `priority-${task.priority}`;
        const badgeClass = `badge-${task.priority}`;
        const completedClass = task.completed ? 'completed' : '';
        const checkedClass = task.completed ? 'checked' : '';
        
        const timeAgo = getTimeAgo(task.createdAt);
        
        return `
            <div class="task-item ${priorityClass} ${completedClass}">
                <div class="checkbox ${checkedClass}" onclick="toggleTask(${task.id})"></div>
                <div class="task-content">
                    <div class="task-text">${escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority-badge ${badgeClass}">${task.priority.toUpperCase()}</span>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    
    document.getElementById('total-tasks').textContent = total;
    document.getElementById('active-tasks').textContent = active;
    document.getElementById('completed-tasks').textContent = completed;
}

// Get time ago string
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Priority selector
document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentPriority = this.dataset.priority;
    });
});

// Filter tabs
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTasks();
    });
});

// Enter key to add task
document.getElementById('task-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// PWA Installation
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install prompt after 3 seconds
    setTimeout(() => {
        const installPrompt = document.getElementById('install-prompt');
        installPrompt.classList.add('show');
    }, 3000);
});

function installApp() {
    const installPrompt = document.getElementById('install-prompt');
    installPrompt.classList.remove('show');
    
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('App installed');
            }
            deferredPrompt = null;
        });
    }
}

function dismissInstall() {
    const installPrompt = document.getElementById('install-prompt');
    installPrompt.classList.remove('show');
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(registration => console.log('Service Worker registered'))
        .catch(error => console.log('Service Worker registration failed:', error));
}

// Initialize app
loadTasks();
