// ai.js

const URL = "https://teachablemachine.withgoogle.com/models/XIn9lqkLl/";

let model, webcam, maxPredictions;
const webcamContainer = document.getElementById("webcam-container");
const webcamPlaceholder = document.getElementById("webcam-placeholder");
const webcamStatus = document.getElementById("webcam-status");

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
    
    // Only predict if currentState is FOCUS_ACTIVE (from pomodoro.js)
    if (typeof currentState !== 'undefined' && currentState === 'FOCUS_ACTIVE') {
        await predict();
    }
    
    window.requestAnimationFrame(predictLoop);
}

// Run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    
    // Log the probabilities to console
    let logStr = "AI Predict -> ";
    for (let i = 0; i < maxPredictions; i++) {
        logStr += `${prediction[i].className}: ${(prediction[i].probability * 100).toFixed(1)}% | `;
    }
    console.log(logStr);
}

// Start AI initialization automatically when the script loads
initAI();
