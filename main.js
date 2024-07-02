const { app, BrowserWindow, Menu } = require('electron');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile('index.html');

  // Create a custom menu template
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New File', click: () => { /* Add your functionality here */ } },
        { label: 'Save', click: () => { /* Add your functionality here */ } },
        { label: 'Save As', click: () => { /* Add your functionality here */ } },
        { role: 'quit', label: 'Exit' }
      ]
    }
  ];

  // Set the custom menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
