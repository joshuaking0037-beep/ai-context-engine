document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analyze-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const resultContainer = document.getElementById('result-container');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    
    // Tabs logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const mainTextLabel = document.getElementById('main-text-label');
    const inputText = document.getElementById('input-text');
    let currentMode = 'general-tab';
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden', 'active'));
            tabContents.forEach(c => c.classList.remove('active'));
            // Add active class to clicked
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            currentMode = targetId;
            
            const targetContent = document.getElementById(targetId === 'general-tab' ? 'general-inputs' : 'resume-inputs');
            targetContent.classList.remove('hidden');
            targetContent.classList.add('active');
            // Update UI labels
            if (targetId === 'resume-tab') {
                mainTextLabel.innerText = "Paste Your General CV/Resume";
                inputText.placeholder = "Paste your entire resume text here...";
                downloadPdfBtn.classList.remove('hidden'); // Show button contextually (we'll hide it if no result)
            } else {
                mainTextLabel.innerText = "Input Text";
                inputText.placeholder = "Paste your text or document content here...";
                downloadPdfBtn.classList.add('hidden');
            }
            
            // Hide PDF button until there is a result
            downloadPdfBtn.style.display = 'none';
        });
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('input-text').value;
        let payload = { text: text };
        if (currentMode === 'general-tab') {
            payload.task = document.getElementById('task-select').value;
        } else {
            payload.task = 'tune_resume';
            payload.job_title = document.getElementById('job-title').value;
            payload.job_description = document.getElementById('job-description').value;
            
            if (!payload.job_title) {
                alert('Please enter a target job title.');
                return;
            }
        }
        if (!text.trim()) {
            alert('Please provide the main text/CV.');
            return;
        }
        setLoadingState(true);
        downloadPdfBtn.style.display = 'none'; // Hide download button during loading
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (response.ok) {
                resultContainer.classList.remove('result-placeholder');
                resultContainer.innerHTML = marked.parse(data.result);
                
                // Show PDF button if we are in resume mode
                if (currentMode === 'resume-tab') {
                    downloadPdfBtn.style.display = 'flex';
                }
            } else {
                showError(data.error || 'An error occurred during analysis.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showError('Failed to connect to the server. Is the Flask app running?');
        } finally {
            setLoadingState(false);
        }
    });
    // PDF Download Logic
    downloadPdfBtn.addEventListener('click', () => {
        // We temporarily style the result container for PDF export
        resultContainer.classList.add('pdf-mode');
        
        // Force desktop width so mobile phones don't squish the PDF layout
        const originalWidth = resultContainer.style.width;
        resultContainer.style.width = '800px';
        
        const jobTitle = document.getElementById('job-title').value || 'Tuned';
        const filename = `${jobTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume.pdf`;
        const opt = {
            margin:       0, // Set to 0 so our negative margins in CSS stretch to the edge
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, windowWidth: 800 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // Generate PDF
        html2pdf().set(opt).from(resultContainer).save().then(() => {
            // Remove the temporary styling after download
            resultContainer.classList.remove('pdf-mode');
            resultContainer.style.width = originalWidth; // Reset width for mobile view
        });
    });
    function setLoadingState(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            resultContainer.innerHTML = '<div class="result-placeholder">Analyzing and generating...</div>';
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
