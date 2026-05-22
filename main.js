const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

function createWindow() {
  // Configuração Kiosk / Tela Cheia
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    kiosk: true, // Modo Kiosk (tela cheia, sem barra de tarefas do SO)
    fullscreen: true,
    autoHideMenuBar: true,
    frame: false, // Sem bordas
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Permitir acesso rápido a APIs do Node se necessário
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Prevenir que o usuário feche acidentalmente via atalhos
  mainWindow.on('close', (e) => {
    // e.preventDefault(); // Descomente para bloquear fechamento total
  });
}

app.whenReady().then(() => {
  createWindow();

  // Desabilitar atalhos globais de recarregar e devtools (para produção)
  globalShortcut.register('CommandOrControl+R', () => {
    console.log('Recarregar bloqueado');
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    console.log('DevTools bloqueado');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
