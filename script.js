const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

let firefly = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    pathIndex: 0,
    path: [],
    speed: 1,
    isGlowing: false,
    glowInterval: 2000,
    isPaused: false
};

let gameDuration = 50; // Game duration in seconds
let gameEndTime = Date.now() + gameDuration * 1000;
let gameStartTime = Date.now();
let totalTime = 0;
let trackingCount = 0;
let totalCount = 0;
let clickCount = 0;
let isGameOver = false;
let score = 0; // Score variable

let cheerCharacter = {
    message: "",
    show: false,
    duration: 2000
};

// Gaze filtering parameters
let previousGaze = { x: null, y: null };
const gazeThreshold = 20;  // Set a threshold for minimal eye movement to avoid head movement detection

function drawBackground() {
    ctx.fillStyle = '#001d3d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 100; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.closePath();
    }
}

function drawFirefly() {
    drawBackground();

    ctx.beginPath();
    ctx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2);
    ctx.fillStyle = firefly.isGlowing ? '#ffaa44' : '#ffdd44';
    ctx.shadowBlur = firefly.isGlowing ? 20 : 10;
    ctx.shadowColor = '#ffdd44';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.ellipse(firefly.x - 5, firefly.y - 10, 8, 12, Math.PI / 6, 0, Math.PI * 2);
    ctx.ellipse(firefly.x + 5, firefly.y - 10, 8, 12, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
    ctx.closePath();

    if (cheerCharacter.show) {
        ctx.font = "24px Comic Sans MS";
        ctx.fillStyle = "#00ff00";
        ctx.fillText("Great tracking!", canvas.width - 200, 100);
    }

    if (firefly.isPaused) {
        ctx.font = "20px Comic Sans MS";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Click the firefly to continue!", firefly.x - 100, firefly.y - 20);
    }

    // Display score on the canvas with appropriate spacing
    ctx.font = "20px Comic Sans MS";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Score: ${score}`, 20, 550);

    // Display the timer on the canvas
    ctx.fillText(`Time: ${Math.max(0, (gameEndTime - Date.now()) / 1000).toFixed(1)}s`, canvas.width - 150, 50);
}

function generatePath() {
    const path = [];
    for (let i = 0; i < canvas.width; i += 5) {
        path.push({
            x: i,
            y: 300 + 100 * Math.sin(i * 0.01)
        });
    }
    return path;
}

firefly.path = generatePath();

function updateFirefly() {
    if (isGameOver) return;

    if (!firefly.isPaused) {
        if (firefly.pathIndex < firefly.path.length - 1) {
            firefly.pathIndex += firefly.speed;
            firefly.x = firefly.path[firefly.pathIndex].x;
            firefly.y = firefly.path[firefly.pathIndex].y;
        } else {
            firefly.pathIndex = 0;
        }
    }

    drawFirefly();
    requestAnimationFrame(updateFirefly);
}

function handleClick(event) {
    if (isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const distance = Math.sqrt(Math.pow(clickX - firefly.x, 2) + Math.pow(clickY - firefly.y, 2));

    if (firefly.isPaused && distance < firefly.radius * 2) {
        firefly.isPaused = false;
        clickCount++;
        score += 10; // Increase score on successful click
        firefly.isGlowing = false;
        cheerCharacter.show = true;
        setTimeout(() => {
            cheerCharacter.show = false;
        }, cheerCharacter.duration);
        document.getElementById('feedback').innerText = "Great job! You clicked the firefly!";
    }
}

window.onload = function() {
    webgazer.setGazeListener((data, elapsedTime) => {
        if (isGameOver) return;

        if (data) {
            const gazeX = data.x;
            const gazeY = data.y;
            const distance = Math.sqrt(Math.pow(gazeX - firefly.x, 2) + Math.pow(gazeY - firefly.y, 2));

            // Filter out large gaze changes indicating head movement
            if (previousGaze.x !== null && previousGaze.y !== null) {
                const gazeChange = Math.sqrt(Math.pow(gazeX - previousGaze.x, 2) + Math.pow(gazeY - previousGaze.y, 2));
                if (gazeChange < gazeThreshold) {
                    totalCount++;
                    if (distance < 50) {
                        trackingCount++;
                        score += 1; // Increase score for successful tracking
                        document.getElementById('feedback').innerText = "Great job! You're tracking the firefly!";
                        firefly.radius = 12;
                    } else {
                        document.getElementById('feedback').innerText = "";
                        firefly.radius = 10;
                    }
                }
            }

            previousGaze = { x: gazeX, y: gazeY };
        }

        totalTime = (Date.now() - gameStartTime) / 1000;
        if (Date.now() > gameEndTime) {
            endGame();
        }
    }).begin();
};

function endGame() {
    isGameOver = true;
    webgazer.pause();
    const finalAccuracy = totalCount > 0 ? (trackingCount / totalCount) * 100 : 0;
    document.getElementById('feedback').innerText = "Game Over!";
    alert(`Game Over!\nTotal Time: ${gameDuration}s\nAccuracy: ${finalAccuracy.toFixed(1)}%\nTotal Clicks: ${clickCount}\nFinal Score: ${score}`);
}

setInterval(() => {
    if (!isGameOver && !firefly.isPaused) {
        firefly.isPaused = true;
        firefly.isGlowing = true;
        document.getElementById('feedback').innerText = "Firefly paused! Click to continue!";
    }
}, 7000);

canvas.addEventListener('click', handleClick);
updateFirefly();

