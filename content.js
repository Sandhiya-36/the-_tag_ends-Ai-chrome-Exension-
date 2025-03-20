const GEMINI_API_KEY = 'AIzaSyAk9uS-JMX8fYUubjyLD_773c3TYy9WTYw';

function waitForEditorAndRun(callback) {
  const interval = setInterval(() => {
    const editor = document.querySelector('.monaco-editor');
    if (editor) {
      clearInterval(interval);
      callback();
    }
  }, 1000);
}

function injectButtonPanel() {
  const existingPanel = document.getElementById("leetgpt-panel");
  if (existingPanel) return;

  const panel = document.createElement('div');
  panel.id = "leetgpt-panel";
  panel.style.position = 'fixed';
  panel.style.bottom = '100px';
  panel.style.right = '30px';
  panel.style.zIndex = '9999';
  panel.style.background = '#1e1e1e';
  panel.style.color = 'white';
  panel.style.padding = '12px';
  panel.style.borderRadius = '10px';
  panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
  panel.innerHTML = `
    <button id="autoBtn">✨ Autocomplete</button>
    <button id="optimizeBtn">🛠 Optimize</button>
    <button id="analyzeBtn">📊 Analyze</button>
    <button id="suggestBtn">🌍 Suggest</button>
  `;

  [...panel.querySelectorAll('button')].forEach(btn => {
    btn.style.margin = '5px';
    btn.style.padding = '5px 10px';
    btn.style.background = '#007acc';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
  });

  document.body.appendChild(panel);

  document.getElementById("autoBtn").onclick = handleAutocomplete;
  document.getElementById("optimizeBtn").onclick = handleOptimization;
  document.getElementById("analyzeBtn").onclick = handleComplexity;
  document.getElementById("suggestBtn").onclick = handleSuggestion;
}

function getEditorValue() {
  const lines = document.querySelectorAll('.view-lines > div');
  let code = '';
  lines.forEach(line => {
    code += line.innerText + '\n';
  });
  return code.trim();
}

function getLeetCodePrompt() {
  try {
    const titleElem = document.querySelector('div[data-cy="question-title"]');
    const title = titleElem ? titleElem.innerText.trim() : 'LeetCode Problem';

    const descElem = document.querySelector('.content__u3I1.question-content__JfgR') ||
                     document.querySelector('[data-key="description-content"]') ||
                     document.querySelector('.question-content');

    const description = descElem ? descElem.innerText.trim() : 'No description found.';

    return `${title}\n\n${description}`;
  } catch (e) {
    console.error("Error fetching LeetCode problem description:", e);
    return "Problem description could not be fetched.";
  }
}

async function fetchGemini(prompt) {
  try {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,    
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content.parts[0].text) {
      throw new Error("Invalid Gemini response: " + JSON.stringify(data));
    }

    return data.candidates[0].content.parts[0].text.trim();

  } catch (err) {
    console.error("Gemini API Error:", err);
    alert("Gemini API Error: " + err.message);
    return "Error: Could not fetch response.";
  }
}

// 👇 NEW: Output to floating panel instead of alert
function showInEditor(text) {
  const existing = document.getElementById("leetgpt-output");
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = "leetgpt-output";
  container.style = 'position:fixed; bottom:20px; left:20px; background:white; color:black; padding:15px; max-height:400px; max-width:500px; overflow:auto; z-index:9999; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.3); white-space:pre-wrap;';
  container.innerText = text;

  const close = document.createElement('div');
  close.innerText = "✖";
  close.style = 'position:absolute; top:5px; right:10px; cursor:pointer; font-weight:bold;';
  close.onclick = () => container.remove();

  container.appendChild(close);
  document.body.appendChild(container);
}

async function handleAutocomplete() {
  const problemText = getLeetCodePrompt();
  const code = getEditorValue();
  const prompt = `LeetCode Problem:\n${problemText}\n\nUser's Code:\n${code}\n\nPlease autocomplete the next lines of code. Return only code with correct syntax.`;
  const suggestion = await fetchGemini(prompt);
  showInEditor("Autocomplete Suggestion:\n\n" + suggestion);
}

async function handleOptimization() {
  const problemText = getLeetCodePrompt();
  const code = getEditorValue();
  const prompt = `LeetCode Problem:\n${problemText}\n\nUser's Code:\n${code}\n\nPlease optimize this code for better performance. Return only improved code.`;
  const optimized = await fetchGemini(prompt);
  showInEditor("Optimized Code:\n\n" + optimized);
}

async function handleComplexity() {
  const problemText = getLeetCodePrompt();
  const code = getEditorValue();
  const prompt = `LeetCode Problem:\n${problemText}\n\nUser's Code:\n${code}\n\nAnalyze the time and space complexity of this code. Return only the analysis.`;
  const result = await fetchGemini(prompt);
  showInEditor("📊 Complexity Analysis:\n\n" + result);
}

async function handleSuggestion() {
  const problemText = getLeetCodePrompt();
  const code = getEditorValue();
  const prompt = `LeetCode Problem:\n${problemText}\n\nUser's Code:\n${code}\n\nSuggest 3 real-world use cases related to this problem.`;
  const problems = await fetchGemini(prompt);
  showInEditor("🌍 Real-World Problems:\n\n" + problems);
}

waitForEditorAndRun(() => {
  injectButtonPanel();
});
