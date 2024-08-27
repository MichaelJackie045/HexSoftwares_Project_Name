document.addEventListener('DOMContentLoaded', initToDoApp);

function initToDoApp() {
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');

  // Load tasks from local storage
  let tasks = loadTasksFromStorage();

  tasks.forEach(task => addTaskToDOM(task));

  // Event listeners
  todoForm.addEventListener('submit', (e) => handleFormSubmit(e, todoInput, tasks, todoList));
  todoList.addEventListener('click', (e) => handleTaskClick(e, tasks));
  todoList.addEventListener('dragstart', handleDragStart);
  todoList.addEventListener('dragend', handleDragEnd);
  todoList.addEventListener('dragover', handleDragOver);
  todoList.addEventListener('drop', () => handleDrop(tasks));
}

function handleFormSubmit(e, todoInput, tasks, todoList) {
  e.preventDefault();
  const taskText = todoInput.value.trim();
  if (taskText === '') return;

  const task = createNewTask(taskText);
  tasks.push(task);
  addTaskToDOM(task);
  saveTasksToStorage(tasks);
  todoInput.value = '';
}

function handleTaskClick(e, tasks) {
  const li = e.target.closest('li');
  if (!li) return;
  
  const taskId = li.getAttribute('data-id');
  const task = tasks.find(task => task.id == taskId);

  if (e.target.classList.contains('remove')) {
    removeTask(taskId, li, tasks);
  } else if (e.target.classList.contains('timer-btn')) {
    togglePomodoro(task, li);
  } else if (li) {
    toggleTaskCompletion(task, li);
  }
}

function handleDragStart(e) {
  e.target.classList.add('dragging');
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  const todoList = document.getElementById('todo-list');
  const afterElement = getDragAfterElement(todoList, e.clientY);
  const draggable = document.querySelector('.dragging');
  if (afterElement == null) {
    todoList.appendChild(draggable);
  } else {
    todoList.insertBefore(draggable, afterElement);
  }
}

function handleDrop(tasks) {
  const todoList = document.getElementById('todo-list');
  const draggedTask = document.querySelector('.dragging');
  const newTaskIndex = [...todoList.children].indexOf(draggedTask);
  const draggedTaskId = draggedTask.getAttribute('data-id');
  const draggedTaskIndex = tasks.findIndex(task => task.id == draggedTaskId);

  if (newTaskIndex !== draggedTaskIndex) {
    const [movedTask] = tasks.splice(draggedTaskIndex, 1);
    tasks.splice(newTaskIndex, 0, movedTask);
    saveTasksToStorage(tasks);
  }
}

function createNewTask(text) {
  return {
    id: Date.now(),
    text: text,
    completed: false,
    pomodoro: { timer: 25 * 60, active: false, interval: null }
  };
}

function addTaskToDOM(task) {
  const todoList = document.getElementById('todo-list');
  const li = document.createElement('li');
  li.setAttribute('data-id', task.id);
  li.className = task.completed ? 'completed' : '';
  li.setAttribute('draggable', 'true');

  const timer = document.createElement('div');
  timer.classList.add('timer');
  const timeDisplay = document.createElement('span');
  timeDisplay.textContent = formatTime(task.pomodoro.timer);
  timer.appendChild(timeDisplay);
  const timerButton = document.createElement('button');
  timerButton.textContent = 'Start';
  timerButton.classList.add('timer-btn');
  timer.appendChild(timerButton);

  const taskText = document.createTextNode(task.text);
  li.appendChild(taskText);
  li.appendChild(timer);

  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remove';
  removeButton.classList.add('remove');
  li.appendChild(removeButton);

  todoList.appendChild(li);
}

function removeTask(taskId, li, tasks) {
  tasks = tasks.filter(task => task.id != taskId);
  saveTasksToStorage(tasks);
  li.remove();
}

function toggleTaskCompletion(task, li) {
  task.completed = !task.completed;
  li.classList.toggle('completed', task.completed);
  saveTasksToStorage(tasks);
}

function togglePomodoro(task, li) {
  const timerButton = li.querySelector('.timer-btn');
  if (!task.pomodoro.active) {
    startPomodoro(task, timerButton, li);
  } else {
    stopPomodoro(task, timerButton);
  }
  saveTasksToStorage(tasks);
}

function startPomodoro(task, timerButton, li) {
  task.pomodoro.active = true;
  timerButton.textContent = 'Stop';
  task.pomodoro.interval = setInterval(() => {
    task.pomodoro.timer--;
    if (task.pomodoro.timer <= 0) {
      completePomodoro(task, timerButton, li);
    } else {
      updateTimerDisplay(task, li);
    }
  }, 1000);
}

function stopPomodoro(task, timerButton) {
  clearInterval(task.pomodoro.interval);
  task.pomodoro.active = false;
  timerButton.textContent = 'Start';
}

function completePomodoro(task, timerButton, li) {
  clearInterval(task.pomodoro.interval);
  task.pomodoro.active = false;
  task.pomodoro.timer = 25 * 60;
  alert('Pomodoro completed! Time for a break.');
  saveTasksToStorage(tasks);
  updateTimerDisplay(task, li);
  timerButton.textContent = 'Start';
}

function updateTimerDisplay(task, li) {
  const timeDisplay = li.querySelector('.timer span');
  timeDisplay.textContent = formatTime(task.pomodoro.timer);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function loadTasksFromStorage() {
  return JSON.parse(localStorage.getItem('tasks')) || [];
}

function saveTasksToStorage(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
