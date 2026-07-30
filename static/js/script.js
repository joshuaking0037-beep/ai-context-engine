document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analyze-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const resultContainer = document.getElementById('result-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const task = document.getElementById('task-select').value;
        const text = document.getElementById('input-text').value;

        if (!text.trim()) {
            alert('Please enter some text to analyze.');
            return;
        }

        // Set UI to loading state
        setLoadingState(true);

        try {
            // Send request to Flask backend
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task, text }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success: Parse markdown and display
                resultContainer.classList.remove('result-placeholder');
                // Use marked.js (loaded in HTML) to parse Markdown to HTML
                resultContainer.innerHTML = marked.parse(data.result);
            } else {
                // Error from backend
                showError(data.error || 'An error occurred during analysis.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showError('Failed to connect to the server. Is the Flask app running?');
        } finally {
            // Restore UI state
            setLoadingState(false);
        }
    });

    function setLoadingState(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            resultContainer.innerHTML = '<div class="result-placeholder">Analyzing text...</div>';
            resultContainer.classList.add('result-placeholder');
        } else {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    function showError(message) {
        resultContainer.classList.remove('result-placeholder');
        resultContainer.innerHTML = `<div style="color: #ef4444; padding: 1rem; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; background: rgba(239, 68, 68, 0.1);">${message}</div>`;
    }
});
