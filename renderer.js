const { ipcRenderer } = require("electron");
const { isValidUrl, isValidInterval } = require("./utils");

let notificationType = "desktop";
let email = "";

// Get modal elements
const modal = document.getElementById("settingsModal");
const btnOpenSettings = document.getElementById("openSettings");
const btnClose = document.getElementsByClassName("close")[0];
const btnSaveSettings = document.getElementById("saveSettings");

// Open the modal
btnOpenSettings.onclick = () => {
  modal.style.display = "block";
};

// Close the modal
btnClose.onclick = () => {
  modal.style.display = "none";
};

// Save settings from the modal
btnSaveSettings.onclick = () => {
  notificationType = document.getElementById("notificationType").value;
  email = document.getElementById("email").value;
  modal.style.display = "none";
};

// Add URL button event
document.getElementById("addUrl").addEventListener("click", () => {
  const url = document.getElementById("url").value.trim();
  const interval = parseInt(document.getElementById("interval").value);

  if (isValidUrl(url) && isValidInterval(interval)) {
    // Check if the URL already exists in the list
    const existingUrls = Array.from(
      document.querySelectorAll("#urlList li span")
    ).map((span) => span.textContent.split(" ")[0]);

    if (existingUrls.includes(url)) {
      alert("URL already exists.");
      return;
    }

    // Immediately update the UI
    const urlListElement = document.getElementById("urlList");
    const li = document.createElement("li");

    const removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.className = "remove-btn";
    removeButton.addEventListener("click", () => {
      ipcRenderer.send("remove-url", url);
    });

    const textContent = document.createElement("span");
    textContent.textContent = `${url} (Every ${interval} minutes) - No change detected`;

    li.appendChild(removeButton);
    li.appendChild(textContent);
    urlListElement.appendChild(li);

    // Send the URL to the main process
    ipcRenderer.send("add-url", { url, interval, notificationType, email });

    // Clear inputs
    document.getElementById("url").value = "";
    document.getElementById("interval").value = "";
  } else {
    alert("Please enter a valid URL and a positive interval.");
  }
});

ipcRenderer.on("update-url-list", (event, urlList) => {
  const urlListElement = document.getElementById("urlList");
  urlListElement.innerHTML = "";

  urlList.forEach((urlObj) => {
    const li = document.createElement("li");

    const removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.className = "remove-btn";
    removeButton.addEventListener("click", () => {
      ipcRenderer.send("remove-url", urlObj.url);
    });

    const textContent = document.createElement("span");
    textContent.textContent = `${urlObj.url} (Every ${urlObj.interval} minutes) - ${urlObj.latestResult}`;

    li.appendChild(removeButton);
    li.appendChild(textContent);
    urlListElement.appendChild(li);
  });
});
