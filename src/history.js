// History page script
const historyList = document.getElementById('history-list');
const searchInput = document.getElementById('search-input');
const clearAllBtn = document.getElementById('clear-all-btn');
const emptyState = document.getElementById('empty-state');
const noResults = document.getElementById('no-results');

let allHistory = [];
let filteredHistory = [];

// Format date for grouping
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

// Format time
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// Get favicon URL
function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
  } catch {
    return '';
  }
}

// Group history by date
function groupHistoryByDate(history) {
  const groups = {};
  
  history.forEach(item => {
    const dateKey = formatDate(item.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });

  return groups;
}

// Render history
function renderHistory(history) {
  historyList.innerHTML = '';
  
  if (history.length === 0) {
    historyList.classList.add('hidden');
    if (searchInput.value.trim()) {
      noResults.classList.remove('hidden');
      emptyState.classList.add('hidden');
    } else {
      emptyState.classList.remove('hidden');
      noResults.classList.add('hidden');
    }
    return;
  }

  historyList.classList.remove('hidden');
  emptyState.classList.add('hidden');
  noResults.classList.add('hidden');

  const groups = groupHistoryByDate(history);

  Object.entries(groups).forEach(([date, items]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'history-group';

    const dateHeader = document.createElement('div');
    dateHeader.className = 'group-date';
    dateHeader.textContent = date;
    groupDiv.appendChild(dateHeader);

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'history-item';
      itemDiv.title = item.url;

      const favicon = document.createElement('img');
      favicon.className = 'history-favicon';
      favicon.src = getFaviconUrl(item.url);
      favicon.onerror = () => {
        favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"></svg>';
      };

      const infoDiv = document.createElement('div');
      infoDiv.className = 'history-info';

      const title = document.createElement('div');
      title.className = 'history-title';
      title.textContent = item.title || item.url;

      const url = document.createElement('div');
      url.className = 'history-url';
      url.textContent = item.url;

      infoDiv.appendChild(title);
      infoDiv.appendChild(url);

      const time = document.createElement('div');
      time.className = 'history-time';
      time.textContent = formatTime(item.timestamp);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'history-actions';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon';
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      `;
      deleteBtn.title = 'Remover do histórico';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteHistoryItem(item.id);
      };

      actionsDiv.appendChild(deleteBtn);

      itemDiv.appendChild(favicon);
      itemDiv.appendChild(infoDiv);
      itemDiv.appendChild(time);
      itemDiv.appendChild(actionsDiv);

      itemDiv.onclick = () => {
        window.heraAPI.createNewTab(item.url);
      };

      groupDiv.appendChild(itemDiv);
    });

    historyList.appendChild(groupDiv);
  });
}

// Load history
async function loadHistory() {
  try {
    historyList.innerHTML = '<div class="loading">Carregando histórico</div>';
    allHistory = await window.heraAPI.getHistory();
    filteredHistory = allHistory;
    renderHistory(filteredHistory);
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    historyList.innerHTML = '<div class="empty-state"><p>Erro ao carregar histórico</p></div>';
  }
}

// Search history
function searchHistory(query) {
  if (!query.trim()) {
    filteredHistory = allHistory;
  } else {
    const lowerQuery = query.toLowerCase();
    filteredHistory = allHistory.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.url.toLowerCase().includes(lowerQuery)
    );
  }
  renderHistory(filteredHistory);
}

// Delete single history item
async function deleteHistoryItem(id) {
  if (!confirm('Remover este item do histórico?')) {
    return;
  }

  try {
    // TODO: Implementar API para remover item individual
    // await window.heraAPI.deleteHistoryItem(id);
    
    // Por enquanto, remove localmente
    allHistory = allHistory.filter(item => item.id !== id);
    filteredHistory = filteredHistory.filter(item => item.id !== id);
    renderHistory(filteredHistory);
  } catch (error) {
    console.error('Erro ao remover item:', error);
    alert('Erro ao remover item do histórico');
  }
}

// Clear all history
async function clearAllHistory() {
  if (!confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
    return;
  }

  try {
    await window.heraAPI.clearHistory();
    allHistory = [];
    filteredHistory = [];
    renderHistory(filteredHistory);
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    alert('Erro ao limpar histórico');
  }
}

// Event listeners
searchInput.addEventListener('input', (e) => {
  searchHistory(e.target.value);
});

clearAllBtn.addEventListener('click', clearAllHistory);

// Initialize
loadHistory();
