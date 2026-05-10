// ai.js

const URL = "https://teachablemachine.withgoogle.com/models/XIn9lqkLl/";

let model, webcam, maxPredictions;
const webcamContainer = document.getElementById("webcam-container");
const webcamPlaceholder = document.getElementById("webcam-placeholder");
const webcamStatus = document.getElementById("webcam-status");

// Track distraction time
let distractionStartTime = null;

// Load the image model and setup the webcam
async function initAI() {
    if (webcamStatus) webcamStatus.textContent = "Loading Model...";
    
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // Load the model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Setup webcam
        const flip = true; // Whether to flip the webcam
        webcam = new tmImage.Webcam(320, 240, flip); // width, height, flip
        
        if (webcamStatus) webcamStatus.textContent = "Requesting Camera...";
        await webcam.setup(); // Request access to the webcam
        await webcam.play();
        
        // Append elements to the DOM
        if (webcamContainer) {
            webcamContainer.appendChild(webcam.canvas);
            // Make canvas fit the container nicely
            webcam.canvas.classList.add("w-full", "h-full", "object-cover");
            
            // Swap visibility
            if (webcamPlaceholder) webcamPlaceholder.classList.add('hidden');
            webcamContainer.classList.remove('hidden');
        }
        
        // Start the continuous prediction loop
        window.requestAnimationFrame(predictLoop);
    } catch (error) {
        console.error("Failed to initialize AI model:", error);
        if (webcamStatus) {
            webcamStatus.classList.replace('text-focus-green/60', 'text-alert-red');
            webcamStatus.textContent = "Camera Error / Denied";
        }
    }
}

async function predictLoop() {
    webcam.update(); // Update the webcam frame
    
    // Check if we have the global getter function
    if (typeof window.getCurrentState === 'function') {
        const state = window.getCurrentState();
        // Predict if we are focusing OR if we are currently alerting (for auto-reset)
        if (state === 'FOCUS_ACTIVE' || state === 'ALERT') {
            await predict();
        }
    }
    
    window.requestAnimationFrame(predictLoop);
}

// Run the webcam image through the image model
async function predict() {
    if (!model) return;
    
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    
    const state = window.getCurrentState();

    // Log the probabilities to console exactly as requested
    for (let i = 0; i < maxPredictions; i++) {
        console.log(prediction[i].className + ': ' + prediction[i].probability.toFixed(2));
    }
    
    // As instructed: prediction[0] is Focus, prediction[1] is Distracted
    let focusProb = prediction[0].probability;
    let distProb = prediction[1].probability;

    // --- DISTRACTION LOGIC ---
    if (state === 'FOCUS_ACTIVE' && distProb > 0.85) {
        if (!distractionStartTime) {
            distractionStartTime = Date.now();
        } else {
            if (Date.now() - distractionStartTime > 10000) {
                window.changeState('ALERT');
            }
        }
    } 
    // --- AUTO-RESET LOGIC ---
    else if (focusProb > 0.85) {
        distractionStartTime = null; // Reset counter
        
        if (state === 'ALERT') {
            window.changeState('FOCUS_ACTIVE');
        }
    }
}

// Start AI initialization automatically when the script loads
initAI();
