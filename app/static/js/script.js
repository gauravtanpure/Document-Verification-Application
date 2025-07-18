let currentDocument = '';
let uploadedFile = null;
let currentStep = 0;

// Function to format date from YYYY-MM-DD to DD/MM/YYYY
function formatDateToIndian(dateString) {
    if (!dateString) return '';
    
    // If already in DD/MM/YYYY format, return as is
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
    }
    
    // Convert from YYYY-MM-DD or other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to parse Indian date format DD/MM/YYYY to YYYY-MM-DD for backend
function parseIndianDateForBackend(indianDateString) {
    if (!indianDateString) return '';
    const parts = indianDateString.split('/');
    if (parts.length !== 3) return indianDateString; // Return original if not in expected format
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    return `${year}-${month}-${day}`;
}

// Function to validate Indian date format
function validateIndianDate(dateString) {
    if (!dateString) return false;
    
    // Check if it matches DD/MM/YYYY pattern
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Basic validation
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Create date object to validate the actual date
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
}

// Function to format date input as user types
function formatDateInput(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
        value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    
    input.value = value;
    
    // Real-time validation feedback
    if (value.length === 10) {
        if (validateIndianDate(value)) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    } else {
        input.classList.remove('valid', 'invalid');
    }
}

function selectDocument(docType) {
    currentDocument = docType;
    document.getElementById('document-selection').style.display = 'none'; // Hide selection
    document.getElementById(docType + '-form').classList.add('active'); // Show selected form
}

function goBack() {
    startOver(); // Go back to document selection
}

// startOver function now ensures document selection is displayed
function startOver() {
    document.getElementById('results').classList.remove('active'); // Hide results
    document.getElementById('loading').classList.remove('active'); // Hide loading

    // Explicitly show the document selection section as a grid
    document.getElementById('document-selection').style.display = 'grid';

    // Reset forms by removing 'active' class
    document.getElementById('aadhaar-form').classList.remove('active');
    document.getElementById('pan-form').classList.remove('active');

    // Clear form data
    document.getElementById('aadhaar-name').value = '';
    document.getElementById('aadhaar-dob').value = '';
    document.getElementById('aadhaar-gender').value = '';
    document.getElementById('pan-name').value = '';
    document.getElementById('pan-dob').value = '';
    document.getElementById('pan-gender').value = '';

    // Reset file uploads
    document.getElementById('aadhaar-file').value = '';
    document.getElementById('pan-file').value = '';
    document.getElementById('aadhaar-upload-label').classList.remove('has-file');
    document.getElementById('pan-upload-label').classList.remove('has-file');
    // Revert to Font Awesome icons
    document.getElementById('aadhaar-upload-label').innerHTML = '<div><i class="fas fa-cloud-upload-alt"></i> Click to upload Aadhaar card</div><div class="file-info">Supported formats: JPG, PNG, PDF</div>';
    document.getElementById('pan-upload-label').innerHTML = '<div><i class="fas fa-cloud-upload-alt"></i> Click to upload PAN card</div><div class="file-info">Supported formats: JPG, PNG, PDF</div>';

    uploadedFile = null;
    currentDocument = '';
    currentStep = 0;

    // Reset collapsible state
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    collapsibleHeaders.forEach(header => {
        const content = header.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        }
    });
    document.getElementById('raw-ocr-output').textContent = '';

    // Reset loading states visuals
    resetLoadingStates();
}

function resetLoadingStates() {
    document.getElementById('step1-circle').className = 'step-circle pending';
    document.getElementById('step2-circle').className = 'step-circle pending';
    document.getElementById('step1-connector').className = 'step-connector';
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('current-step-title').textContent = 'Initializing...';
    document.getElementById('current-step-description').textContent = 'Setting up verification process';
}

function updateLoadingStep(step) {
    const steps = [
        {
            title: 'Document Processing',
            description: 'Scanning and extracting text from your document using OCR technology',
            progress: 25
        },
        {
            title: 'Data Verification',
            description: 'Comparing extracted information with your provided details',
            progress: 75
        },
        {
            title: 'Finalizing Results',
            description: 'Completing verification and generating results',
            progress: 100
        }
    ];

    currentStep = step;
    const stepInfo = steps[step];

    // Update progress bar
    document.getElementById('progress-bar').style.width = stepInfo.progress + '%';

    // Update current step info
    document.getElementById('current-step-title').textContent = stepInfo.title;
    document.getElementById('current-step-description').textContent = stepInfo.description;

    // Update step circles and connectors
    if (step >= 0) {
        document.getElementById('step1-circle').className = step === 0 ? 'step-circle active' : 'step-circle completed';
        document.getElementById('step1-connector').className = step > 0 ? 'step-connector completed' : 'step-connector active';
    }

    if (step >= 1) {
        document.getElementById('step2-circle').className = step === 1 ? 'step-circle active' : 'step-circle completed';
    }
}

function handleFileUpload(docType) {
    const fileInput = document.getElementById(docType + '-file');
    const label = document.getElementById(docType + '-upload-label');

    if (fileInput.files.length > 0) {
        uploadedFile = fileInput.files[0];
        label.classList.add('has-file');
        // Include the icon back in the label when a file is selected
        label.innerHTML = `<div>✅ ${uploadedFile.name}</div><div class="file-info">File uploaded successfully</div>`;
    } else {
        uploadedFile = null;
        label.classList.remove('has-file');
        // Ensure the icon is present when no file is selected
        label.innerHTML = `<div><i class="fas fa-cloud-upload-alt"></i> Click to upload ${docType} card</div><div class="file-info">Supported formats: JPG, PNG, PDF</div>`;
    }
}

function toggleCollapsible(button) {
    button.classList.toggle('active');
    const content = button.nextElementSibling;
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

async function verifyDocument(docType) {
    const name = document.getElementById(docType + '-name').value;
    const dob = document.getElementById(docType + '-dob').value;
    const gender = document.getElementById(docType + '-gender').value;

    if (!name || !dob || !gender || !uploadedFile) {
        alert('Please fill all fields and upload a document.');
        return;
    }

    // Validate date format
    if (!validateIndianDate(dob)) {
        alert('Please enter a valid date in DD/MM/YYYY format.');
        return;
    }

    document.getElementById(docType + '-form').classList.remove('active');
    document.getElementById('loading').classList.add('active');

    // Reset loading states
    resetLoadingStates();

    // Simulate 2-step verification process
    setTimeout(() => updateLoadingStep(0), 500);
    setTimeout(() => updateLoadingStep(1), 3000);

    const formData = new FormData();
    formData.append('document', uploadedFile);
    formData.append('docType', docType);
    formData.append('name', name);
    // Convert Indian date format to backend format if needed
    formData.append('dob', parseIndianDateForBackend(dob));
    formData.append('gender', gender);

    try {
        // Point this to your Flask endpoint
        const response = await fetch('/verify-document', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log('Backend response:', data);

        // Complete the loading process
        setTimeout(() => updateLoadingStep(2), 4500);

        // Show results after a brief delay
        setTimeout(() => {
            document.getElementById('loading').classList.remove('active');
            document.getElementById('results').classList.add('active');

            // Populate entered data with Indian date format (already in Indian format)
            const enteredDataHtml = `
                <div class="data-row">
                    <span class="data-label">Name:</span>
                    <span class="data-value">${data.entered_data.name}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Date of Birth:</span>
                    <span class="data-value">${dob}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Gender:</span>
                    <span class="data-value">${data.entered_data.gender.charAt(0).toUpperCase() + data.entered_data.gender.slice(1)}</span>
                </div>
            `;
            document.getElementById('entered-data').innerHTML = enteredDataHtml;

            // Populate extracted data with Indian date format
            let extractedDataHtml = '';
            if (data.extracted_data && !data.extracted_data.error) {
                for (const [key, value] of Object.entries(data.extracted_data)) {
                    // Skip if value is null or undefined for display purposes
                    if (value === null || value === undefined) continue;

                    // Format keys nicely (e.g., 'pan_number' -> 'PAN Number', 'aadhaar_linked' -> 'Aadhaar Linked')
                    let formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                    // Format values for display
                    let displayValue = value;
                    if (typeof value === 'boolean') {
                        displayValue = value ? 'Yes' : 'No';
                    } else if (key.toLowerCase().includes('dob') || key.toLowerCase().includes('date')) {
                        // Check if it's a date field and format it to Indian format
                        displayValue = formatDateToIndian(value);
                    }

                    extractedDataHtml += `
                        <div class="data-row">
                            <span class="data-label">${formattedKey}:</span>
                            <span class="data-value">${displayValue}</span>
                        </div>
                    `;
                }
            } else {
                extractedDataHtml = `<div class="data-row"><span class="data-value" style="color: red;">Error: ${data.extracted_data ? data.extracted_data.error : 'Unknown error during extraction'}</span></div>`;
            }
            document.getElementById('extracted-data').innerHTML = extractedDataHtml;

            // Populate Raw OCR Text
            document.getElementById('raw-ocr-output').textContent = data.raw_ocr_text || "No raw text extracted or provided.";

            // Determine verification status
            const statusDiv = document.getElementById('verification-status');
            if (data.is_verified) {
                statusDiv.className = 'verification-status verified';
                statusDiv.innerHTML = `
                    <div class="status-icon">✅</div>
                    <div>Document Successfully Verified!</div>
                    <div style="font-size: 0.9rem; margin-top: 10px;">${data.status_message}</div>
                `;
            } else {
                statusDiv.className = 'verification-status invalid';
                statusDiv.innerHTML = `
                    <div class="status-icon">❌</div>
                    <div>Document Verification Failed</div>
                    <div style="font-size: 0.9rem; margin-top: 10px;">${data.status_message}</div>
                `;
            }
        }, 5500);

    } catch (error) {
        console.error('Error during verification:', error);
        
        setTimeout(() => {
            document.getElementById('loading').classList.remove('active');
            document.getElementById('results').classList.add('active');
            document.getElementById('verification-status').className = 'verification-status invalid';
            document.getElementById('verification-status').innerHTML = `
                <div class="status-icon">❗</div>
                <div>An unexpected error occurred.</div>
                <div style="font-size: 0.9rem; margin-top: 10px;">Please check the console for details and try again.</div>
            `;
        }, 2000);
    }
}