// Downloads page script
const downloadsList = document.getElementById('downloads-list');
const openFolderBtn = document.getElementById('open-folder-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const emptyState = document.getElementById('empty-state');

let downloads = [];

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Get file icon based on extension
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  
  const icons = {
    // Documents
    pdf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>`,
    
    // Images
    jpg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`,
    jpeg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`,
    png: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`,
    
    // Archives
    zip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>`,
    rar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>`,
    
    // Default
    default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>`
  };

  return icons[ext] || icons.default;
}

// Render downloads
function renderDownloads() {
  downloadsList.innerHTML = '';
  
  if (downloads.length === 0) {
    downloadsList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  downloadsList.classList.remove('hidden');
  emptyState.classList.add('hidden');

  downloads.forEach(download => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'download-item';
    itemDiv.dataset.id = download.id;

    const iconDiv = document.createElement('div');
    iconDiv.className = 'download-icon';
    iconDiv.innerHTML = getFileIcon(download.filename);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'download-info';

    const name = document.createElement('div');
    name.className = 'download-name';
    name.textContent = download.filename;
    name.title = download.filename;

    const details = document.createElement('div');
    details.className = 'download-details';

    const size = document.createElement('span');
    size.className = 'download-size';
    size.textContent = formatFileSize(download.totalBytes || 0);

    const status = document.createElement('div');
    status.className = 'download-status';
    
    const statusDot = document.createElement('span');
    statusDot.className = `status-dot ${download.state}`;
    
    const statusText = document.createElement('span');
    const statusLabels = {
      completed: 'Concluído',
      downloading: 'Baixando...',
      failed: 'Falhou',
      cancelled: 'Cancelado'
    };
    statusText.textContent = statusLabels[download.state] || download.state;

    status.appendChild(statusDot);
    status.appendChild(statusText);

    details.appendChild(size);
    details.appendChild(status);

    infoDiv.appendChild(name);
    infoDiv.appendChild(details);

    // Progress bar for downloading items
    if (download.state === 'downloading' && download.progress !== undefined) {
      const progressDiv = document.createElement('div');
      progressDiv.className = 'download-progress';

      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';

      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = `${download.progress}%`;

      progressBar.appendChild(progressFill);

      const progressText = document.createElement('div');
      progressText.className = 'progress-text';
      progressText.textContent = `${Math.round(download.progress)}% - ${formatFileSize(download.receivedBytes || 0)} de ${formatFileSize(download.totalBytes || 0)}`;

      progressDiv.appendChild(progressBar);
      progressDiv.appendChild(progressText);
      infoDiv.appendChild(progressDiv);
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'download-actions';

    // Open file button (only for completed downloads)
    if (download.state === 'completed') {
      const openBtn = document.createElement('button');
      openBtn.className = 'btn-icon';
      openBtn.title = 'Abrir arquivo';
      openBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      `;
      openBtn.onclick = () => openFile(download);
      actionsDiv.appendChild(openBtn);
    }

    // Show in folder button
    const folderBtn = document.createElement('button');
    folderBtn.className = 'btn-icon';
    folderBtn.title = 'Mostrar na pasta';
    folderBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    `;
    folderBtn.onclick = () => showInFolder(download);
    actionsDiv.appendChild(folderBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon';
    deleteBtn.title = 'Remover da lista';
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      </svg>
    `;
    deleteBtn.onclick = () => removeDownload(download.id);
    actionsDiv.appendChild(deleteBtn);

    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(infoDiv);
    itemDiv.appendChild(actionsDiv);

    downloadsList.appendChild(itemDiv);
  });
}

// Open file
function openFile(download) {
  if (window.heraAPI && window.heraAPI.openDownloadedFile) {
    window.heraAPI.openDownloadedFile(download.savePath);
  } else {
    alert('Funcionalidade de abrir arquivo ainda não implementada');
  }
}

// Show in folder
function showInFolder(download) {
  if (window.heraAPI && window.heraAPI.showDownloadInFolder) {
    window.heraAPI.showDownloadInFolder(download.savePath);
  } else {
    alert('Funcionalidade de mostrar na pasta ainda não implementada');
  }
}

// Remove download from list
async function removeDownload(id) {
  try {
    const success = await window.heraAPI.removeDownload(id);
    if (success) {
      downloads = downloads.filter(d => d.id !== id);
      renderDownloads();
    }
  } catch (error) {
    console.error('[Downloads] Erro ao remover download:', error);
  }
}

// Clear completed downloads
async function clearCompleted() {
  try {
    await window.heraAPI.clearCompletedDownloads();
    await loadDownloads(); // Recarrega do DB
  } catch (error) {
    console.error('[Downloads] Erro ao limpar downloads:', error);
  }
}

// ✅ REFATORADO: Agora usa banco de dados SQLite em vez de localStorage
// O array 'downloads' é apenas um cache local para a UI

// Load downloads from database
async function loadDownloads() {
  try {
    downloads = await window.heraAPI.getDownloads();
    
    if (downloads.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      renderDownloads();
    }
  } catch (error) {
    console.error('[Downloads] Erro ao carregar downloads do DB:', error);
    emptyState.classList.remove('hidden');
  }
}

// Open downloads folder
function openDownloadsFolder() {
  if (window.heraAPI && window.heraAPI.openDownloadsFolder) {
    window.heraAPI.openDownloadsFolder();
  } else {
    alert('Funcionalidade ainda não implementada');
  }
}

// Listen for new downloads
if (window.heraAPI) {
  // Download started
  window.heraAPI.onDownloadStarted((data) => {
    console.log('[Downloads] Download started:', data);
    const download = {
      id: data.id, // ✅ CORREÇÃO: Usar o ID do evento
      filename: data.filename,
      savePath: data.savePath,
      totalBytes: data.totalBytes,
      receivedBytes: 0,
      progress: 0,
      state: 'downloading'
    };
    downloads.unshift(download);
    renderDownloads();
    // ✅ Não precisa mais salvar - já está no DB via index.ts
    console.log('[Downloads] Download adicionado com ID correto:', download.id);
  });

  // Download progress
  window.heraAPI.onDownloadProgress((data) => {
    const download = downloads.find(d => d.id === data.id); // ✅ CORREÇÃO: Buscar por ID
    if (download) {
      download.receivedBytes = data.receivedBytes;
      download.totalBytes = data.totalBytes;
      download.progress = (data.receivedBytes / data.totalBytes) * 100;
      renderDownloads();
    } else {
      console.warn('[Downloads] Progress para download não encontrado:', data.id);
      console.log('[Downloads] Downloads atuais:', downloads.map(d => d.id));
    }
  });

  // Download complete
  window.heraAPI.onDownloadComplete((data) => {
    console.log('[Downloads] Download complete:', data);
    const download = downloads.find(d => d.id === data.id); // ✅ CORREÇÃO: Buscar por ID
    if (download) {
      console.log(`[Download ${download.id}] Estado recebido: ${data.state}`);
      
      // ✅ Hotfix temporário para o bug "Cancelado"
      if (data.state === 'cancelled' && download.progress > 99) {
        console.warn('[Downloads] Download estava quase completo, marcando como completed');
        download.state = 'completed';
      } else {
        download.state = data.state || 'completed';
      }
      
      download.progress = 100;
      download.receivedBytes = download.totalBytes;
      download.savePath = data.savePath; // ✅ Atualiza o savePath final
      renderDownloads();
      // ✅ Não precisa mais salvar - já está no DB via index.ts
      console.log('[Downloads] Download atualizado:', download);
    } else {
      console.warn('[Downloads] Download concluído não encontrado:', data.id);
    }
  });
}

// Event listeners
openFolderBtn.addEventListener('click', openDownloadsFolder);
clearCompletedBtn.addEventListener('click', clearCompleted);

// Initialize
loadDownloads();
