import { storage } from "wxt/storage";
const CONFIGURATION_KEY = "YzQ3ODQ0Yjg=";

export default defineBackground({
  type: 'module',
  main: () => {
    if (import.meta.env.CHROME) chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(e => console.log(e));

    const onInstalled = async () => {
      if (import.meta.env.CHROME) {
        const currentVersion = storage.defineItem<string>("local:currentVersion");
        const updateShown = storage.defineItem<boolean>("local:updateShown", { defaultValue: false });

        const newVersion = browser.runtime.getManifest().version;
        const currentVersionValue = await currentVersion.getValue();

        if (newVersion !== currentVersionValue) {
          await currentVersion.setValue(newVersion);

          const updateShownValue = await updateShown.getValue();
          if (!updateShownValue) {
            await browser.tabs.create({ url: browser.runtime.getURL("/options.html") });
            await updateShown.setValue(true);
          }
        }
      }

      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          "id": "edgetts",
          "title": "Speak with MS-Edge TTS",
          "contexts": ["selection"]
        });
      });
    };

    browser.runtime.onInstalled.addListener(onInstalled);
    browser.runtime.onStartup.addListener(onInstalled);

    chrome.contextMenus.onClicked.addListener(async (clickData, tab) => {
      if (clickData.menuItemId != "edgetts" || !clickData.selectionText) return;

      const text = storage.defineItem<string>("session:text");
      text.setValue(clickData.selectionText);

      if (import.meta.env.CHROME) {
        chrome.sidePanel.open({ tabId: tab?.id! });
      }
      else if (import.meta.env.FIREFOX) {
        browser.browserAction.openPopup();
      }
    });
    chrome.commands.onCommand.addListener((command) => {
      if (command !== "edgettsinvoke") return;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0 || !tabs[0].id) {
          console.error('No active tab found.');
          return;
        }

        const tabId = tabs[0].id;

        // Inject a script to get the selected text
        chrome.scripting.executeScript(
          {
            target: { tabId },
            func: () => {
              // Get the selected text
              return window.getSelection()?.toString() || '';
            },
          },
          (results) => {
            if (chrome.runtime.lastError) {
              console.error('Error executing script:', chrome.runtime.lastError);
              return;
            }

            // Log the selected text
            const selectedText = results?.[0]?.result;
            if (selectedText === undefined) return;
            const text = storage.defineItem<string>("session:text");
            text.setValue(selectedText);
          },
        );
      });
    });
  }
});
