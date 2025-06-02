console.log("Script.js starting...");

// --- Start of Script: Global Constants and Variables ---
let mapContainer, modelViewer, feedbackElement, mapSelector, indicatorDotsContainer,
    repeatDisplayElement, programSequenceDisplayElement, teacherTargetMarker,
    customFeedbackMsgInput, rotateControlsDiv, rotateLeftBtn, rotateRightBtn,
    clearBtnElement, fwdBtnElement, repeatBtnElement, leftBtnElement, goBtnElement,
    rightBtnElement, recordBtnElement, bwdBtnElement, danceBtnElement,
    playRecBtnElement, clearAllProgramBtnElement;

const MAX_PROGRAM_STEPS = 8;
const CLEAR_HOLD_DURATION = 1000;
const ANIMATION_STEP_MOVE = 0.5;
const ANIMATION_STEP_TURN = 3; // Degrees per animation frame for turning

let program = [];
let botState = { x: 15, y: 88, angle: 0, isMovingAutomated: false };
let currentMap = "zoo_map.jpg";
let currentMapData;
let currentTarget;
let teacherDefinedTarget = { x: null, y: null, message: "You reached the special spot!", active: false, name: "Custom Spot", tolerance: 10 };
let repeatCount = 1;
let recordedMessage = "";
let isBotDragging = false;
let dragStartMouseX, dragStartMouseY, dragStartBotXPercent, dragStartBotYPercent;
let animationFrameId = null;
let clearButtonTimer = null;
let initialRunState = null; // To store bot state at the beginning of a "Go" press

const mapData = {
    "zoo_map.jpg": {
        imagePath: "zoo_map.jpg",
        redArrowHotspot:    { xMin: 2, yMin: 2, xMax: 15, yMax: 18 },
        yellowArrowHotspot: { xMin: 2, yMin: 28, xMax: 15, yMax: 42 },
        zooEntranceTarget:  { x: 10, y: 75, angle: 0},
        mainTarget: { name: "Lion", x: 65, y: 12, tolerance: 10 },
        tourPath: [
            { x: 30, y: 75, animal: "Elephant area", angle: 0 }, { x: 30, y: 45, animal: "Tiger spot", angle: 0 },
            { x: 65, y: 45, animal: "Ice Cream cart", angle: 90 }, { x: 65, y: 12, animal: "Lion's den", angle: 0 },
            { x: 85, y: 12, animal: "Bear's cave", angle: 180 }, { x: 85, y: 75, animal: "Panda place", angle: 270 }
        ],
        stepPercentage: 18
    },
    "plants.jpg": {
        imagePath: "plants.jpg",
        mainTarget: { name: "Adult Plant", x: 50, y: 30, tolerance: 8 },
        redArrowHotspot: null, yellowArrowHotspot: null, zooEntranceTarget: null, tourPath: [],
        stepPercentage: 15
    }
};

const commandTranslations = {
    'F': '⬆ Fwd', 'B': '⬇ Bwd', 'L': '⬅ Left', 'R': '➡ Right',
    'PLAY_REC': '🎤 Play Rec', 'DANCE': '💃 Dance'
};
console.log("Global variables declared in script.js.");
// --- End of Global Constants and Variables ---


function speak(text) { /* ... (Keep as is from previous working version) ... */ }

function updateBotVisuals() {
    if (!modelViewer) { console.error("updateBotVisuals: modelViewer is null!"); return; }
    const modelWidth = modelViewer.offsetWidth || 50;
    const modelHeight = modelViewer.offsetHeight || 50;
    modelViewer.style.left = `calc(${botState.x}% - ${modelWidth / 2}px)`;
    modelViewer.style.top = `calc(${botState.y}% - ${modelHeight / 2}px)`;
    let modelYaw = (180 - botState.angle + 360) % 360; // YOU MIGHT NEED TO TWEAK THIS for your GLB
    modelViewer.orientation = `0deg ${modelYaw}deg 0deg`;
}

function snapToGridCenter() { /* ... (Keep as is from previous working version) ... */ }

function changeMap() {
    console.log("Changing map to:", mapSelector ? mapSelector.value : "undefined selector");
    if (!mapSelector || !mapContainer) { console.error("Map selector or container not ready for changeMap."); return; }
    currentMap = mapSelector.value;
    currentMapData = mapData[currentMap];
    if (!currentMapData) { console.error("Map data missing for:", currentMap); return; }
    mapContainer.style.backgroundImage = `url('${currentMapData.imagePath}')`;
    currentTarget = currentMapData.mainTarget;
    teacherDefinedTarget.active = false;
    if (teacherTargetMarker) teacherTargetMarker.style.display = 'none';
    awaitingZooTourStart = false;
    clearProgramLogic(true);
    if(feedbackElement) feedbackElement.textContent = `Map: ${currentMap}. Target: ${currentTarget.name}! Or click map to set a custom target.`;
    console.log("Map changed. currentMapData:", currentMapData);
}

function updateIndicatorDots() { /* ... (Keep as is from previous working version) ... */ }
function updateProgramDisplay() { /* ... (Keep as is from previous working version) ... */ }
function addCommand(cmd) { /* ... (Keep as is from previous working version) ... */ }

function clearProgramLogic(isClearAll) {
    console.log("clearProgramLogic called. isClearAll:", isClearAll, "| Current isMovingAutomated:", botState.isMovingAutomated);
    if (botState.isMovingAutomated && !isClearAll) {
        console.warn("Blocked 'Delete Last' because bot is moving.");
        return;
    }
    if (botState.isMovingAutomated && isClearAll) {
        console.log("Interrupting ongoing animation for Clear All.");
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        botState.isMovingAutomated = false; // Force stop automation
    }
    hideRotateControls();
    if (isClearAll) {
        program = []; repeatCount = 1; // Ensure repeatCount is reset
        if(feedbackElement) feedbackElement.textContent = "Program cleared.";
        resetBotToDefaultPosition();
    } else if (program.length > 0) {
        const removedCmd = program.pop();
        if(feedbackElement) feedbackElement.textContent = `"${commandTranslations[removedCmd] || removedCmd}" removed.`;
    } else {
        if (repeatCount > 1) { repeatCount = 1; if(feedbackElement) feedbackElement.textContent = "Repeat count reset."; }
        else { if(feedbackElement) feedbackElement.textContent = "Program is already empty."; }
    }
    updateProgramDisplay(); // This also updates indicator dots
}

function changeRepeatCycle() { /* ... (Keep as is from previous working version) ... */ }
function recordVoice() { /* ... (Keep as is from previous working version) ... */ }
function resetBotToDefaultPosition() { /* ... (Keep as is from previous working version) ... */ }
async function autoMoveTo(targetX, targetY, targetAngle, speed = 0.5) { /* ... (Keep as is from previous working version, ensure it checks botState.isMovingAutomated for interruption) ... */ }

async function runProgram() {
    console.log("Run program initiated. Current isMovingAutomated:", botState.isMovingAutomated, "Program length:", program.length);
    if (botState.isMovingAutomated || (program.length === 0 && !awaitingZooTourStart)) {
        if(program.length === 0 && !awaitingZooTourStart) feedbackElement.textContent = "Program is empty!";
        console.warn("runProgram blocked or program empty. isMovingAutomated:", botState.isMovingAutomated);
        return;
    }
    hideRotateControls();
    botState.isMovingAutomated = true;
    console.log("runProgram: isMovingAutomated set to TRUE.");

    try {
        if (awaitingZooTourStart && currentMap === "zoo_map.jpg" && currentMapData.tourPath) {
            // ... (Zoo Tour logic as before) ...
            // At the end of tour, before returning:
            // botState.isMovingAutomated = false; // This will be handled by the finally block
            return; // Exit after tour
        }

        feedbackElement.textContent = "Running program...";
        // CAPTURE initial state for THIS run (could be from drag)
        initialRunState = { x: botState.x, y: botState.y, angle: botState.angle };
        console.log("Initial run state captured:", JSON.stringify(initialRunState));

        for (let r = 0; r < repeatCount; r++) {
            if (!botState.isMovingAutomated) { console.log("Loop interrupted before iteration", r); break;}
            if (repeatCount > 1) feedbackElement.textContent = `Running iteration ${r + 1} of ${repeatCount}...`;
            
            // RESET to the captured initial state for EACH full program iteration
            botState.x = initialRunState.x; 
            botState.y = initialRunState.y; 
            botState.angle = initialRunState.angle;
            updateBotVisuals();
            if (r > 0) await new Promise(resolve => setTimeout(resolve, 300)); // Small pause if repeating

            for (let i = 0; i < program.length; i++) {
                if (!botState.isMovingAutomated) { console.log(`Command ${program[i]} interrupted at step ${i+1}.`); break; }
                console.log(`Executing cmd ${i+1} of ${program.length}: ${program[i]} (Iteration ${r+1})`);
                await executeCommand(program[i]);
                console.log(`Finished awaiting cmd ${program[i]}`);
            }
            if (!botState.isMovingAutomated && r < repeatCount -1) { break; } // Interrupted during a repeat loop
            if (botState.isMovingAutomated) { // Only snap if iteration completed
                snapToGridCenter(); 
                updateBotVisuals(); // Update visuals after snap
            }
        }

        if (botState.isMovingAutomated){ // Only check target if not interrupted
            let finalTargetToCheck = teacherDefinedTarget.active ? teacherDefinedTarget : currentTarget;
            let successMsg = teacherDefinedTarget.active ? (teacherDefinedTarget.message || "You reached the custom spot!") : `Success! Reached the ${currentTarget.name}!`;
            // FIX: Ensure targetTolerance is defined
            const targetTolerance = finalTargetToCheck.tolerance || (currentMapData.mainTarget && currentMapData.mainTarget.tolerance) || 10; 

            console.log("Checking final target:", finalTargetToCheck.name, "at X:", finalTargetToCheck.x, "Y:",finalTargetToCheck.y, "Current pos X:", botState.x, "Y:", botState.y, "Tolerance:", targetTolerance);
            const dx = botState.x - finalTargetToCheck.x;
            const dy = botState.y - finalTargetToCheck.y;
            if (finalTargetToCheck.x !== null && Math.sqrt(dx*dx + dy*dy) < targetTolerance) {
                speak(successMsg); await executeCommand('DANCE');
            } else {
                speak(`Oops! Didn't reach the ${finalTargetToCheck.name || "target"}.`);
            }
        }
    } catch (error) {
        console.error("Error during runProgram:", error);
    } finally {
        botState.isMovingAutomated = false;
        console.log("runProgram FINISHED (or errored/interrupted). isMovingAutomated set to FALSE.");
    }
}

async function executeCommand(cmd) {
    console.log(`executeCommand START: ${cmd}. isMovingAutomated: ${botState.isMovingAutomated}`);
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }

    return new Promise(async (resolveExecution) => {
        if (!botState.isMovingAutomated && cmd !== 'DANCE' && cmd !== 'PLAY_REC') {
             console.warn(`executeCommand for ${cmd} aborted: isMovingAutomated is false.`);
             resolveExecution(); return;
        }

        let targetX = botState.x, targetY = botState.y; let targetAngle = botState.angle;
        if (!currentMapData || typeof currentMapData.stepPercentage === 'undefined') {
            console.error("executeCommand: currentMapData or stepPercentage is undefined. Using default step.");
            currentMapData = { stepPercentage: 18 }; // Fallback
        }
        const step = currentMapData.stepPercentage;

        switch (cmd) {
            case 'F': if (botState.angle === 0) targetY -= step; else if (botState.angle === 90) targetX += step; else if (botState.angle === 180) targetY += step; else if (botState.angle === 270) targetX -= step; break;
            case 'B': if (botState.angle === 0) targetY += step; else if (botState.angle === 90) targetX -= step; else if (botState.angle === 180) targetY -= step; else if (botState.angle === 270) targetX += step; break;
            case 'L': targetAngle = (botState.angle - 90 + 360) % 360; break;
            case 'R': targetAngle = (botState.angle + 90 + 360) % 360; break;
            case 'PLAY_REC': speak(recordedMessage || "Nothing recorded."); await new Promise(r => setTimeout(r, (recordedMessage||"").length * 60 + 500)); console.log(`executeCommand FINISHED: ${cmd}`); resolveExecution(); return;
            case 'DANCE':
                speak("Dancing!"); const originalAngleDance = botState.angle;
                for (let i=0; i<4; i++) {
                    if (!botState.isMovingAutomated) { console.log("Dance interrupted."); break; }
                    botState.angle = (botState.angle + 90) % 360; updateBotVisuals(); await new Promise(r => setTimeout(r, 150));
                }
                if (botState.isMovingAutomated) botState.angle = originalAngleDance; // Restore only if not interrupted
                updateBotVisuals(); console.log(`executeCommand FINISHED: ${cmd}`); resolveExecution(); return;
        }
        targetX = Math.max(5, Math.min(95, targetX)); targetY = Math.max(5, Math.min(95, targetY));
        console.log(`Cmd: ${cmd}, Start:(${botState.x.toFixed(1)},${botState.y.toFixed(1)},${botState.angle}), Target:(${targetX.toFixed(1)},${targetY.toFixed(1)},${targetAngle})`);

        const animate = () => {
            if (!botState.isMovingAutomated) {
                console.log("Animation loop INTERRUPTED for cmd:", cmd);
                if(animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null;
                resolveExecution(); return;
            }
            let isStillAnimating = false;
            // Turn animation
            if (botState.angle !== targetAngle) {
                let angleDiff = targetAngle - botState.angle;
                if (angleDiff > 180) angleDiff -= 360; if (angleDiff < -180) angleDiff += 360;
                if (Math.abs(angleDiff) <= ANIMATION_STEP_TURN) { botState.angle = targetAngle; }
                else { botState.angle = (botState.angle + Math.sign(angleDiff) * ANIMATION_STEP_TURN + 360) % 360; isStillAnimating = true; }
            }
            // Move animation (only if the command was a move command AND target position is different)
            if ((cmd === 'F' || cmd === 'B') && (Math.abs(targetX - botState.x) > 0.01 || Math.abs(targetY - botState.y) > 0.01) ) {
                const dx_move = targetX - botState.x; const dy_move = targetY - botState.y;
                const dist_move = Math.sqrt(dx_move*dx_move + dy_move*dy_move);
                if (dist_move > ANIMATION_STEP_MOVE) {
                    botState.x += (dx_move / dist_move) * ANIMATION_STEP_MOVE;
                    botState.y += (dy_move / dist_move) * ANIMATION_STEP_MOVE;
                    isStillAnimating = true;
                } else if (dist_move > 0) { // Snap if close enough
                     botState.x = targetX; botState.y = targetY;
                     // If it was only a move, and now we've reached, isStillAnimating might be false unless a turn is also pending
                     // Ensure one last update if we snapped
                     if (!isStillAnimating && (botState.angle === targetAngle)) isStillAnimating = false; else isStillAnimating = true;
                }
            }

            if (isStillAnimating) { updateBotVisuals(); animationFrameId = requestAnimationFrame(animate); }
            else {
                botState.x = targetX; botState.y = targetY; botState.angle = targetAngle; // Final snap for this step
                updateBotVisuals(); animationFrameId = null;
                console.log(`executeCommand FINISHED (animation complete): ${cmd}`);
                resolveExecution();
            }
        };
        animationFrameId = requestAnimationFrame(animate);
    });
}

// --- Bot Dragging Logic --- (Keep as is)
function onBotPointerDown(e) { /* ... */ }
function onDocumentPointerMove(e) { /* ... */ }
function onDocumentPointerUp() { /* ... */ }

// --- Teacher Target Setting --- (Keep as is)
function onMapClick(e) { /* ... */ }
function onCustomFeedbackChange() { /* ... */ }

// --- Post-Drag Rotate Controls --- (Keep as is)
function showRotateControls() { /* ... */ }
function hideRotateControls() { /* ... */ }
function onRotateLeftClick() { /* ... */ }
function onRotateRightClick() { /* ... */ }
function checkHotspotInteraction() { /* ... */ }


// --- Event Listener Attachments ---
function attachEventListeners() { /* ... (Keep as is, ensure all querySelectors are correct) ... */ }

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => { /* ... (Keep as is, ensure attachEventListeners and changeMap are called) ... */ });
console.log("Script.js fully parsed.");