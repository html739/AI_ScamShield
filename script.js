const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");
const analyzeBtn = document.getElementById("analyzeBtn");
const buttonText = document.getElementById("buttonText");
const clearBtn = document.getElementById("clearBtn");
const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const resultBox = document.getElementById("resultBox");

messageInput.addEventListener("input", () => {
    charCount.textContent = `${messageInput.value.length} / 5000 characters`;
});

document.querySelectorAll(".sample-btn").forEach((button) => {
    button.addEventListener("click", () => {
        messageInput.value = button.dataset.sample;
        messageInput.dispatchEvent(new Event("input"));
        messageInput.focus();
        errorBox.classList.add("hidden");
        resultBox.classList.add("hidden");
    });
});

clearBtn.addEventListener("click", () => {
    messageInput.value = "";
    messageInput.dispatchEvent(new Event("input"));
    errorBox.classList.add("hidden");
    resultBox.classList.add("hidden");
    messageInput.focus();
});

analyzeBtn.addEventListener("click", async () => {
    const message = messageInput.value.trim();

    errorBox.classList.add("hidden");
    resultBox.classList.add("hidden");

    if (!message) {
        errorBox.textContent = "Please enter a message or select a sample message first.";
        errorBox.classList.remove("hidden");
        messageInput.focus();
        return;
    }

    analyzeBtn.disabled = true;
    loadingBox.classList.remove("hidden");
    buttonText.textContent = "Analyzing...";

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "The analysis could not be completed.");
        }

        showResults(data);

    } catch (error) {
        errorBox.textContent = error.message || "Unable to connect to the server. Please try again.";
        errorBox.classList.remove("hidden");
    } finally {
        analyzeBtn.disabled = false;
        loadingBox.classList.add("hidden");
        buttonText.textContent = "Analyze Message with AI";
    }
});

function showResults(data) {
    const score = Number(data.risk_score);
    const validScore = Number.isFinite(score) && score >= 0 && score <= 100;

    if (!validScore || !["Low", "Medium", "High"].includes(data.risk_level)) {
        throw new Error("The server returned an invalid analysis result. Please try again.");
    }

    document.getElementById("riskScore").textContent = score;
    document.getElementById("riskTitle").textContent = data.risk_level + " Potential Risk";
    document.getElementById("riskSummary").textContent = data.summary || "No summary was provided.";

    const badge = document.getElementById("riskBadge");
    badge.textContent = data.risk_level.toUpperCase() + " RISK";
    badge.className = "risk-badge " + data.risk_level.toLowerCase();

    const circle = document.getElementById("riskCircle");
    const ringColors = {
        Low: "#4ade80",
        Medium: "#fbbf24",
        High: "#f87171"
    };

    circle.style.borderColor = ringColors[data.risk_level];
    circle.style.boxShadow = `0 0 22px ${ringColors[data.risk_level]}22`;

    fillList("warningList", data.warning_signs);
    fillList("safetyList", data.safety_tips);

    resultBox.classList.remove("hidden");
    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function fillList(elementId, items) {
    const list = document.getElementById(elementId);
    list.replaceChildren();

    const safeItems = Array.isArray(items) ? items : [];

    safeItems.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = String(item);
        list.appendChild(li);
    });

    if (safeItems.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No specific items were returned.";
        list.appendChild(li);
    }
}