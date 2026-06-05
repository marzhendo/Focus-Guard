// ai.js

const URL = "https://teachablemachine.withgoogle.com/models/XIn9lqkLl/";

let model, webcam, maxPredictions;
const webcamContainer = document.getElementById("webcam-container");
const webcamPlaceholder = document.getElementById("webcam-placeholder");
const webcamStatus = document.getElementById("webcam-status");

// Track distraction time
let distractionStartTime = null;

// Face Detection Variables
let faceDetection;
let lastFaceDetectTime = 0;
let faceLostStartTime = null;

const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas ? overlayCanvas.getContext("2d") : null;
const faceLostStatus = document.getElementById("faceLostStatus");

// Load the image model and setup the webcam
async function initAI() {
    if (webcamStatus) webcamStatus.textContent = "Loading Model...";
    
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // Initialize MediaPipe Face Detection
        faceDetection = new FaceDetection({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }});
        faceDetection.setOptions({
            model: 'short',
            minDetectionConfidence: 0.5
        });
        faceDetection.onResults(onFaceResults);

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
            webcamStatus.textContent = "Error: " + (error.name || error.message || "Camera Denied");
        }
    }
}

async function predictLoop() {
    webcam.update(); // Update the webcam frame
    
    // Check if we have the global getter function
    if (typeof window.getCurrentState === 'function') {
        const state = window.getCurrentState();
        // Predict if we are focusing, warning, OR if we are currently alerting (for auto-reset)
        if (state === 'FOCUS_ACTIVE' || state === 'WARNING' || state === 'ALERT') {
            await predict();
        }
    }

    // MediaPipe Face Detection (Throttled to max 10 FPS)
    const now = Date.now();
    if (now - lastFaceDetectTime >= 100 && faceDetection) {
        lastFaceDetectTime = now;
        await faceDetection.send({image: webcam.canvas});
    }
    
    window.requestAnimationFrame(predictLoop);
}

function onFaceResults(results) {
    if (!overlayCtx || !overlayCanvas) return;
    
    // Clear previous drawing
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (results.detections && results.detections.length > 0) {
        // Face is detected
        faceLostStartTime = null;
        if (faceLostStatus) faceLostStatus.classList.add('hidden');

        // Draw bounding box
        const state = typeof window.getCurrentState === 'function' ? window.getCurrentState() : 'IDLE';
        let color = 'transparent';
        if (state === 'FOCUS_ACTIVE') color = '#39FF14';
        else if (state === 'WARNING') color = '#EAB308';
        else if (state === 'ALERT') color = '#EF4444';

        if (color !== 'transparent') {
            overlayCtx.strokeStyle = color;
            overlayCtx.lineWidth = 4;
            overlayCtx.shadowColor = color;
            overlayCtx.shadowBlur = 10;
            
            for (const detection of results.detections) {
                const bbox = detection.boundingBox;
                const w = bbox.width * overlayCanvas.width;
                const h = bbox.height * overlayCanvas.height;
                // MediaPipe xCenter/yCenter represent center, but some versions use xMin/yMin
                // We'll calculate top-left assuming it provides width/height/xCenter/yCenter,
                // but handle fallback to xMin/yMin if that's what's provided.
                const x = bbox.xCenter !== undefined 
                    ? (bbox.xCenter * overlayCanvas.width - w / 2)
                    : (bbox.xMin * overlayCanvas.width);
                const y = bbox.yCenter !== undefined
                    ? (bbox.yCenter * overlayCanvas.height - h / 2)
                    : (bbox.yMin * overlayCanvas.height);

                overlayCtx.strokeRect(x, y, w, h);
            }
        }
    } else {
        // Face is NOT detected
        if (!faceLostStartTime) {
            faceLostStartTime = Date.now();
        } else {
            const lostDuration = Date.now() - faceLostStartTime;
            if (lostDuration > 1000) { // > 1 second
                if (faceLostStatus) faceLostStatus.classList.remove('hidden');
            }
        }
    }
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
    
    // Dynamically find classes based on string inclusion to avoid index mismatch
    const distracObj = prediction.find(p => p.className.toLowerCase().includes('terdistraksi'));
    const focusObj = prediction.find(p => p.className.toLowerCase().includes('fokus'));

    // Prevent errors if classes aren't named exactly as expected
    if (!distracObj || !focusObj) {
        console.warn("Class names mismatch. Please ensure model has classes containing 'fokus' and 'terdistraksi'.");
        return;
    }

    const config = window.DISTRACTION_CONFIG || { warningThreshold: 5, alertThreshold: 10 };

    // --- DISTRACTION LOGIC ---
    if ((state === 'FOCUS_ACTIVE' || state === 'WARNING' || state === 'ALERT') && distracObj.probability > 0.85) {
        if (!distractionStartTime) {
            distractionStartTime = Date.now();
        } else {
            const distractionDuration = (Date.now() - distractionStartTime) / 1000;
            
            if (distractionDuration >= config.alertThreshold && state !== 'ALERT') {
                window.changeState('ALERT');
            } else if (distractionDuration >= config.warningThreshold && state !== 'WARNING' && state !== 'ALERT') {
                window.changeState('WARNING');
            }
        }
    } 
    // --- AUTO-RESET LOGIC ---
    else if (focusObj.probability > 0.85) {
        distractionStartTime = null; // Reset counter
        
        if (state === 'ALERT' || state === 'WARNING') {
            window.changeState('FOCUS_ACTIVE');
        }
    }
}

// Start AI initialization automatically when the script loads
initAI();
