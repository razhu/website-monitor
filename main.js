const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const { isValidUrl } = require("./utils");
const { getInitialState, monitorUrl } = require("./monitor");
const fs = require("fs");
const path = require("path");

let mainWindow;
let urlList = [];
const configFilePath = path.join(app.getPath("userData"), "config.json");

function loadConfig() {
  if (fs.existsSync(configFilePath)) {
    const data = fs.readFileSync(configFilePath);
    return JSON.parse(data);
  }
  return [];
}

function saveConfig() {
  fs.writeFileSync(configFilePath, JSON.stringify(urlList, null, 2));
}

async function restartMonitoring() {
  for (const urlObj of urlList) {
    monitorUrl(urlObj.url, urlObj.interval, (currentState) => {
      if (currentState !== urlObj.initialState) {
        const timestamp = new Date().toISOString();
        const result = `Change detected on ${timestamp}`;
        urlObj.latestResult = result;
        mainWindow.webContents.send("update-url-list", urlList);
        new Notification({
          title: "Website Monitor",
          body: result,
        }).show();
      } else {
        urlObj.latestResult = "No change detected";
        mainWindow.webContents.send("update-url-list", urlList);
      }
      saveConfig();
    });
  }
}

app.on("ready", async () => {
  try {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    mainWindow.loadFile("index.html");

    // Load saved configuration
    urlList = loadConfig();
    mainWindow.webContents.on("did-finish-load", () => {
      mainWindow.webContents.send("update-url-list", urlList);
      restartMonitoring();
    });

    ipcMain.on("add-url", async (event, { url, interval }) => {
      try {
        if (isValidUrl(url)) {
          if (urlList.find((u) => u.url === url)) {
            console.log("URL already exists");
            return;
          }

          console.log(`Adding URL: ${url} with interval: ${interval}`);
          const initialState = await getInitialState(url);
          urlList.push({
            url,
            interval: parseInt(interval),
            initialState,
            latestResult: "No change detected",
          });
          mainWindow.webContents.send("update-url-list", urlList);
          saveConfig();

          monitorUrl(url, parseInt(interval), (currentState) => {
            const urlObj = urlList.find((u) => u.url === url);
            if (currentState !== urlObj.initialState) {
              const timestamp = new Date().toISOString();
              const result = `Change detected on ${timestamp}`;
              urlObj.latestResult = result;
              mainWindow.webContents.send("update-url-list", urlList);
              new Notification({
                title: "Website Monitor",
                body: result,
              }).show();
            } else {
              urlObj.latestResult = "No change detected";
              mainWindow.webContents.send("update-url-list", urlList);
            }
            saveConfig();
          });
        } else {
          console.log("Invalid URL");
        }
      } catch (error) {
        console.error(`Error adding URL: ${error.message}`);
      }
    });

    ipcMain.on("remove-url", (event, url) => {
      try {
        urlList = urlList.filter((u) => u.url !== url);
        mainWindow.webContents.send("update-url-list", urlList);
        saveConfig();
      } catch (error) {
        console.error(`Error removing URL: ${error.message}`);
      }
    });
  } catch (error) {
    console.error(`Error launching app: ${error.message}`);
  }
});

app.on("window-all-closed", async () => {
  if (browser) await browser.close();
  app.quit();
});
