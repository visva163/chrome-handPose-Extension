document.addEventListener("DOMContentLoaded", function () {
    // Load all saved settings when popup opens
    chrome.storage.local.get(['isEnabled', 'settings', 'domainCache'], (data) => {
        // Initialize toggle switch
        const toggleSwitch = document.getElementById("toggleSwitch");
        toggleSwitch.checked = data.isEnabled ?? false;

        // Initialize sliders with saved values or defaults
        const settings = data.settings || {
            sensitivity: 5,
            index: 27,
            middle: 25,
            ring: 25,
            pinky: 25
        };

        // Update UI with saved values
        document.getElementById("sensitivity").value = settings.sensitivity;
        document.getElementById("index").value = settings.index;
        document.getElementById("middle").value = settings.middle;
        document.getElementById("ring").value = settings.ring;
        document.getElementById("pinky").value = settings.pinky;

        // Initialize domain cache if it doesn't exist
        const domainCache = data.domainCache || {};

        // Check current URL and load category from cache or fetch new
        (async function () {
            try {
                let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const url = tab.url;
                const hostname = new URL(url).hostname;

                // Check if we have this domain cached
                if (domainCache[hostname]) {
                    displayDomainCategory(domainCache[hostname]);
                } else {
                    // Only fetch if not in cache
                    const category = await detectDomain(url);
                    // Save to cache
                    domainCache[hostname] = category;
                    chrome.storage.local.set({ domainCache: domainCache });
                }
            } catch (error) {
                console.error("Error getting tab info:", error);
                document.getElementById("output").innerText = "Error: Couldn't determine domain.";
            }
        })();
    });

    // Handle toggle switch
    const toggleSwitch = document.getElementById("toggleSwitch");
    toggleSwitch.addEventListener("click", function () {
        const newState = toggleSwitch.checked;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            // Send message with the new state
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "toggleState",
                    isEnabled: newState,
                });
            });
        });
    });

    // Handle settings changes
    const doneB = document.getElementById("done");
    doneB.addEventListener("click", (e) => {
        const settings = {
            sensitivity: document.getElementById("sensitivity").value,
            index: document.getElementById("index").value,
            middle: document.getElementById("middle").value,
            ring: document.getElementById("ring").value,
            pinky: document.getElementById("pinky").value
        };

        // Save settings to storage
        chrome.storage.local.set({ settings: settings }, () => {
            // Send message with new settings
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "changeSetting",
                    setting: settings
                });
            });

            // Show saved confirmation
            document.getElementById("message").innerText = "Settings saved!";
            setTimeout(() => {
                document.getElementById("message").innerText = "";
            }, 2000);
        });
    });
});

// Helper function to display domain category and send zoomable status
// Helper function to display domain category and send zoomable status
function displayDomainCategory(category) {
    document.getElementById("output").innerText = `Current domain: ${category}`;

    // Set isZoomable to false specifically for video domains
    const isZoomable = category.toLowerCase() !== "video";
    console.log(`Domain category: ${category}, isZoomable set to: ${isZoomable}`);

    // Set zoomable state based on category
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "isZoomable",
                isZoomable: isZoomable
            });
        }
    });
}

async function detectDomain(url) {
    const apiKey = "AIzaSyCX1wzDyckiShnxj6TtB0CW12DuljKLIIg";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Classify this website URL into one of these categories: Music, Video, Article, etc... URL: ${url}. Return only one category name as the output.`;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const category = data.candidates[0].content.parts[0].text.trim();

        // Display the category
        displayDomainCategory(category);

        return category;
    } catch (error) {
        console.error("API Call Failed:", error);
        document.getElementById("output").innerText = "Error: Failed to classify domain.";
        throw new Error("Failed to classify domain.");
    }
}