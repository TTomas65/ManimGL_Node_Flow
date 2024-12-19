const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { exec } = require('child_process')
const fs = require('fs')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  win.loadFile('index.html')
  // Fejlesztői eszközök megnyitása
  win.webContents.openDevTools()
}

// Handle Python code generation and execution
ipcMain.on('generate-animation', (event, data) => {
  const filePath = path.join(__dirname, 'text_animation.py')
  
  try {
    fs.writeFileSync(filePath, data.pythonCode)
    console.log('Python file created:', filePath)
    
    // Execute ManimGL command with preview quality and opengl renderer
    const command = 'manimgl text_animation.py TextAnimation'
    console.log('Executing command:', command)
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error running ManimGL:', error)
        console.error('stderr:', stderr)
        event.reply('animation-error', error.message)
        return
      }
      console.log('ManimGL output:', stdout)
      if (stderr) console.log('ManimGL stderr:', stderr)
      event.reply('animation-complete', stdout)
    })
  } catch (error) {
    console.error('Error creating file:', error)
    event.reply('animation-error', error.message)
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
