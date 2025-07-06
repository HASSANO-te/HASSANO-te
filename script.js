const massSlider = document.getElementById('massSlider');
const gravitySlider = document.getElementById('gravitySlider');
const hydrogenSlider = document.getElementById('hydrogenSlider');

const massValueDisplay = document.getElementById('massValue');
const gravityValueDisplay = document.getElementById('gravityValue');
const hydrogenValueDisplay = document.getElementById('hydrogenValue');
const zoomValueDisplay = document.getElementById('zoomValueDisplay');

const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');
const starInfoDiv = document.getElementById('starInfo');

const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetZoomBtn = document.getElementById('resetZoomBtn');

let animationFrameId;
let backgroundStars = [];
const NUM_BACKGROUND_STARS = 250;

let currentZoom = 1.0;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8.0;
const ZOOM_SPEED = 0.1;

let currentStarParams = {}; // To store the determined star for drawing

const STAR_TYPES = { // Base definitions
    PROTOSTAR: { name: "Protostar Cloud", color: "rgba(150, 100, 200, 0.4)", sizeFactor: 2.0, description: "A collapsing cloud of gas and dust, not yet hot enough for fusion.", activity: 0.1 },
    RED_DWARF: { name: "Red Dwarf", color: "#ff6633", sizeFactor: 0.3, description: "A small, cool, very long-lived star.", activity: 0.2 },
    YELLOW_DWARF: { name: "Yellow Dwarf (Main Sequence)", color: "#ffeeaa", sizeFactor: 1.0, description: "A medium-sized star like our Sun.", activity: 0.5 },
    BLUE_GIANT: { name: "Blue Giant (Main Sequence)", color: "#aaddff", sizeFactor: 2.5, description: "A large, hot, and bright star, burning fuel rapidly.", activity: 1.0 },
    O_TYPE_STAR: { name: "O-Type Supergiant", color: "#ccddff", sizeFactor: 3.5, coronaColor: "rgba(200,220,255,0.6)", description: "An extremely luminous and massive star, burning incredibly hot and fast.", activity: 1.5 },
    RED_GIANT: { name: "Red Giant", color: "#ff8844", sizeFactor: 3.5, coronaColor: "rgba(255,100,0,0.3)", description: "Evolved star, expanded after exhausting core hydrogen.", activity: 0.4 },
    RED_SUPERGIANT: { name: "Red Supergiant", color: "#cc4422", sizeFactor: 5.0, coronaColor: "rgba(200,0,0,0.4)", description: "A very massive star in its late stages.", activity: 0.6 },
    WHITE_DWARF: { name: "White Dwarf", color: "#ffffff", sizeFactor: 0.1, description: "Dense remnant core of a low/medium-mass star.", activity: 0.05 },
    PLANETARY_NEBULA_PHASE: { name: "Planetary Nebula + White Dwarf", color: "#ffffff", nebulaColor: "rgba(0, 200, 180, 0.35)", sizeFactor: 0.1, nebulaSizeFactor: 4.0, description: "Expanding gas shell from an old red giant, with a White Dwarf forming.", activity: 0.3 },
    NEUTRON_STAR: { name: "Neutron Star", color: "#ddddff", sizeFactor: 0.02, pulse: true, description: "Incredibly dense collapsed core of a massive star.", activity: 2.0 },
    BLACK_HOLE: { name: "Black Hole", color: "black", sizeFactor: 0.05, accretionDisk: true, description: "Region of spacetime with inescapable gravity.", activity: 2.5 },
    SUPERNOVA_REMNANT: { name: "Supernova Event / Remnant", color: "#ffeecc", nebulaColor: "rgba(255, 200, 80, 0.6)", sizeFactor: 0.01, nebulaSizeFactor: 7.0, description: "Cataclysmic explosion of a massive star, leaving behind a nebula.", activity: 3.0 }
};

const nameParts = {
    prefixes: ["Alpha", "Beta", "Gamma", "Delta", "Omega", "Cygnus", "Orion", "Sirius", "Proxima", "Kepler", "Trappist", "Gliese", "HD", "NGC", "Messier"],
    roots: ["Majoris", "Minoris", "Prime", "Centauri", "Nebulae", "Core", "Cluster", "Point", "Sector", "Nova", "Stellaris", "Luminos", "Draconis", "Ignis", "Caeli"],
    suffixes: ["A", "B", "X", "Prime", "System", "Star", "Object", "Entity", "Anomaly", "Designate", "7", "42", "101", "3000", "IX", "IV", "VI"]
};

function generateStarName(mass, hydrogen, gravity) {
    const pIdx = Math.floor((mass / 100) * nameParts.prefixes.length) % nameParts.prefixes.length;
    const rIdx = Math.floor((hydrogen / 100) * nameParts.roots.length) % nameParts.roots.length;
    const sIdx = Math.floor((gravity / 2) * nameParts.suffixes.length) % nameParts.suffixes.length;
    
    const prefix = nameParts.prefixes[pIdx] || nameParts.prefixes[0]; // Fallback if index out of bounds
    const root = nameParts.roots[rIdx] || nameParts.roots[0];
    const suffixPart = nameParts.suffixes[sIdx] || nameParts.suffixes[0];
    let numberSuffix = Math.floor(mass * 17 + hydrogen * 3 + gravity * 53) % 9000 + 1000;

    return `${prefix} ${root} ${suffixPart}-${numberSuffix}`;
}


function resizeCanvas() {
    // Ensure canvas parent has its dimensions set before trying to read clientWidth/Height
    if (canvas.parentElement && canvas.parentElement.clientWidth > 0 && canvas.parentElement.clientHeight > 0) {
        canvas.width = canvas.clientWidth; // Use current CSS display size to set canvas drawing buffer
        canvas.height = canvas.clientHeight;
    } else {
        // Fallback if parent not sized (e.g. during initial load storms) - may need adjustment
        const maxWidth = 700; 
        canvas.width = Math.min(window.innerWidth * 0.9, maxWidth); // Max width for canvas
        canvas.height = canvas.width * (9/16); // Aspect ratio
    }
    generateBackgroundStars();
    // updateSimulation will be called by listeners or init, no need to call explicitly if handled
}

function generateBackgroundStars() {
    backgroundStars = [];
    for (let i = 0; i < NUM_BACKGROUND_STARS; i++) {
        backgroundStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.2 + 0.3,
            alpha: Math.random() * 0.4 + 0.2,
            twinkleSpeed: Math.random() * 0.001 + 0.0005,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
}

function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const time = Date.now();
    backgroundStars.forEach(star => {
        if (!canvas.width || !canvas.height) return; // Don't draw if canvas not ready
        const currentAlpha = star.alpha * (0.75 + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.25);
        ctx.beginPath();
        ctx.arc(star.x % canvas.width, star.y % canvas.height, star.radius, 0, Math.PI * 2); // Use modulo to keep stars on canvas if resized small
        ctx.fillStyle = `rgba(220, 220, 255, ${currentAlpha})`;
        ctx.fill();
    });
}

let pulseState = { t: 0, direction: 1 };
let generalPulse = 0;

function drawStar(starData) {
    const starType = starData.type;
    const { effectiveMass, hydrogenLevel, gravityInfluence } = starData;

    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    // Make baseRadius dependent on the smaller dimension of canvas for better consistency
    const baseDimension = Math.min(canvas.width, canvas.height);
    const baseRadius = baseDimension / (12 / starType.sizeFactor) ; 

    let currentRadius = baseRadius;
    
    let activityModifier = 1.0 + (gravityInfluence -1.0) * 0.5 + (hydrogenLevel/100 - 0.5) * 0.3 + (effectiveMass/20 -0.5)*0.2;
    activityModifier = Math.max(0.5, Math.min(2.0, activityModifier));

    let dynamicCoronaSizeFactor = 1.5 + starType.activity * activityModifier;
    if (starType.coronaColor) dynamicCoronaSizeFactor += 0.5;
    
    generalPulse = Date.now() * 0.0005 * starType.activity * activityModifier;

    ctx.save();
    ctx.translate(canvasCenterX, canvasCenterY);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-canvasCenterX, -canvasCenterY);

    if (starType.nebulaColor) {
        const nebulaRadius = baseRadius * starType.nebulaSizeFactor * (0.9 + Math.sin(generalPulse * 0.5) * 0.1) * activityModifier;
        const gradient = ctx.createRadialGradient(canvasCenterX, canvasCenterY, currentRadius * 0.8, canvasCenterX, canvasCenterY, nebulaRadius);
        gradient.addColorStop(0, starType.color);
        gradient.addColorStop(Math.max(0, 0.2 * (currentRadius/nebulaRadius)) , starType.color); // Ensure stop is >= 0
        gradient.addColorStop(Math.min(1, Math.max(0, 0.3 * (currentRadius/nebulaRadius) + 0.1)) , starType.nebulaColor); // Clamp stop
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, nebulaRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (starType.accretionDisk) {
        const diskOuterRadius = currentRadius * 15 * activityModifier;
        const diskInnerRadius = currentRadius * 1.5;
        const diskRotationSpeed = 0.0002 * activityModifier;

        for (let i = 0; i < 70; i++) {
            const t = i / 70;
            const angleOffset = Date.now() * diskRotationSpeed * (1 + t * 1.5) * (i%2 === 0 ? 1 : -1.1);
            const segmentAngle = (Math.PI / 15) * (1 - t * 0.7);
            
            const r = diskInnerRadius + (diskOuterRadius - diskInnerRadius) * Math.pow(t, 0.6);
            const jitter = 1 + Math.sin(angleOffset * 5 + t * Math.PI * 10) * 0.05 * t;

            ctx.beginPath();
            ctx.arc(canvasCenterX, canvasCenterY, r * jitter, 
                    angleOffset + t * Math.PI * 7, 
                    angleOffset + t * Math.PI * 7 + segmentAngle);
            
            const hue = (200 + t * 100 - (Math.sin(generalPulse*2)*20) + 360) % 360; // Ensure positive hue
            const lightness = 50 + t * 30 + Math.sin(angleOffset*3)*10;
            ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${0.1 + Math.pow(t,0.5) * 0.4})`;
            ctx.lineWidth = (2 + (1-t)*8) * (1 + Math.sin(angleOffset*2+t)*0.1);
            ctx.stroke();
        }
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(50,50,80,0.1)";
        ctx.lineWidth = Math.max(1, currentRadius * 0.1);
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, currentRadius * (1.1 + Math.sin(generalPulse*0.3)*0.05), 0, Math.PI*2);
        ctx.stroke();
    }
    else {
        if (starType.pulse) {
            pulseState.t += pulseState.direction * 0.07 * activityModifier;
            if (pulseState.t > 1 || pulseState.t < 0) pulseState.direction *= -1;
            let pulseFactor = (0.7 + Math.abs(pulseState.t) * 0.6);
            
            const beamLength = baseDimension * 0.75 / currentZoom; // Base on smaller canvas dimension
            const angle = (Date.now() * 0.003 * activityModifier) % (Math.PI * 2);
            
            ctx.save(); // Save before beam translate/rotate
            ctx.translate(canvasCenterX, canvasCenterY);
            ctx.rotate(angle);
            
            let beamGrad1 = ctx.createLinearGradient(0,0, beamLength,0);
            beamGrad1.addColorStop(0, `rgba(220, 220, 255, ${0.8 * pulseFactor})`);
            beamGrad1.addColorStop(1, "rgba(200, 200, 255, 0)");
            ctx.strokeStyle = beamGrad1;
            ctx.lineWidth = (3 + pulseFactor*2) * activityModifier;
            ctx.beginPath(); ctx.moveTo(currentRadius*1.2,0); ctx.lineTo(beamLength,0); ctx.stroke();
            
            let beamGrad2 = ctx.createLinearGradient(0,0, -beamLength,0);
            beamGrad2.addColorStop(0, `rgba(220, 220, 255, ${0.8 * pulseFactor})`);
            beamGrad2.addColorStop(1, "rgba(200, 200, 255, 0)");
            ctx.strokeStyle = beamGrad2; // Apply second gradient
            ctx.beginPath(); ctx.moveTo(-currentRadius*1.2,0); ctx.lineTo(-beamLength,0); ctx.stroke();
            
            ctx.restore(); // Restore from beam translate/rotate

            currentRadius *= pulseFactor;
        }

        let subtlePulseFactor = 1.0;
        if (starType.activity > 0.4 && !starType.pulse) {
            subtlePulseFactor = 1.0 + Math.sin(generalPulse) * 0.02 * starType.activity * activityModifier;
            currentRadius *= subtlePulseFactor;
        }

        const glowRadius = currentRadius * dynamicCoronaSizeFactor * (1.0 + Math.sin(generalPulse*1.5) * 0.05 * activityModifier) ;
        const coreBrightnessFactor = 0.5 + starType.activity * 0.2 * activityModifier;

        const gradient = ctx.createRadialGradient(canvasCenterX, canvasCenterY, currentRadius * 0.3, canvasCenterX, canvasCenterY, glowRadius);
        gradient.addColorStop(0, `rgba(255,255,255, ${Math.min(1, coreBrightnessFactor)})`);
        gradient.addColorStop(0.2, starType.color);
        gradient.addColorStop(0.6, starType.coronaColor || starType.color.replace(')', `, ${Math.max(0, 0.3 * activityModifier).toFixed(2)})`).replace('rgb', 'rgba'));
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = starType.color;
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        if (starType.activity > 0.8 && !starType.pulse) {
            const numFlares = Math.floor(starType.activity * 5 * activityModifier);
            for (let i=0; i<numFlares; i++) {
                const angle = Math.random() * Math.PI * 2 + generalPulse * (i%2 == 0 ? 1 : -1) * 0.5;
                const flareLength = currentRadius * (0.1 + Math.random()*0.3) * activityModifier;
                const flareStart = currentRadius * (0.9 + Math.random()*0.1);
                ctx.strokeStyle = `rgba(255,255,230, ${0.3 + Math.random()*0.3})`;
                ctx.lineWidth = 1 + Math.random()*2;
                ctx.beginPath();
                ctx.moveTo(canvasCenterX + Math.cos(angle) * flareStart, canvasCenterY + Math.sin(angle) * flareStart);
                ctx.lineTo(canvasCenterX + Math.cos(angle) * (flareStart + flareLength), canvasCenterY + Math.sin(angle) * (flareStart + flareLength));
                ctx.stroke();
            }
        }
    }
    ctx.restore(); // Restore from zoom transform
}


function updateSimulation() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    const mass = parseFloat(massSlider.value);
    const gravityFactor = parseFloat(gravitySlider.value);
    const hydrogen = parseFloat(hydrogenSlider.value);

    massValueDisplay.textContent = mass.toFixed(1);
    gravityValueDisplay.textContent = gravityFactor.toFixed(2);
    hydrogenValueDisplay.textContent = hydrogen.toFixed(0);
    zoomValueDisplay.textContent = `Zoom: ${currentZoom.toFixed(1)}x`;


    let baseStarType = STAR_TYPES.PROTOSTAR;
    let fateDescription = "";
    let infoHeader = "";
    const effectiveMass = mass * (1 + (gravityFactor - 1) * 0.5); 

    const starDesignation = generateStarName(mass, hydrogen, gravityFactor);

    if (hydrogen < 5) {
        infoHeader = "Nearing End of Life / Fuel Exhausted";
        if (effectiveMass < 0.5) {
            baseStarType = STAR_TYPES.RED_DWARF; 
            fateDescription = "Continues as a Red Dwarf, slowly converting remaining Hydrogen for eons. Eventually might become a (hypothetical) Blue Dwarf, then a Helium White Dwarf after trillions of years.";
        } else if (effectiveMass < 8) {
             baseStarType = STAR_TYPES.PLANETARY_NEBULA_PHASE;
             fateDescription = "Has shed its outer layers as a Planetary Nebula. The core remains as a cooling White Dwarf.";
        } else { 
            baseStarType = STAR_TYPES.SUPERNOVA_REMNANT;
            fateDescription = "Its core has collapsed, triggering a cataclysmic Supernova explosion!";
            if (effectiveMass < 25 * (1/gravityFactor)) { 
                fateDescription += " The remnant core is likely a dense Neutron Star.";
                if (hydrogen < 2 && STAR_TYPES.NEUTRON_STAR) baseStarType = STAR_TYPES.NEUTRON_STAR; 
            } else {
                fateDescription += " The immense gravity of the collapsing core forms a Black Hole.";
                 if (hydrogen < 2 && STAR_TYPES.BLACK_HOLE) baseStarType = STAR_TYPES.BLACK_HOLE;
            }
        }
    } else if (effectiveMass < 0.08) {
        baseStarType = STAR_TYPES.PROTOSTAR;
        infoHeader = "Failed Star";
        fateDescription = "This mass is too low to sustain nuclear fusion. It will likely become a Brown Dwarf, slowly cooling over billions of years.";
    } else if (effectiveMass < 0.5) {
        baseStarType = STAR_TYPES.RED_DWARF;
        infoHeader = "Low-Mass Main Sequence Star";
        fateDescription = `A Red Dwarf, characterized by its low mass and slow hydrogen fusion. It will have an incredibly long lifespan, potentially trillions of years. Hydrogen Level: ${hydrogen.toFixed(0)}%.`;
    } else if (effectiveMass < 1.5) {
        if (hydrogen < 40) { 
            baseStarType = STAR_TYPES.RED_GIANT;
            infoHeader = "Evolved Medium-Mass Star";
            fateDescription = `Having consumed much of its core hydrogen (${hydrogen.toFixed(0)}%), it has expanded into a Red Giant. Future: Planetary Nebula, then White Dwarf.`;
        } else {
            baseStarType = STAR_TYPES.YELLOW_DWARF;
            infoHeader = "Medium-Mass Main Sequence Star";
            fateDescription = `A Yellow Dwarf, similar to our Sun. Fuses hydrogen into helium in its core. Stable for billions of years. Hydrogen Level: ${hydrogen.toFixed(0)}%.`;
        }
    } else if (effectiveMass < 8) { 
         if (hydrogen < 30) {
            baseStarType = STAR_TYPES.RED_SUPERGIANT;
            infoHeader = "Evolved High-Mass Star";
            fateDescription = `A massive star (${mass.toFixed(1)} M☉) that has exhausted core hydrogen (${hydrogen.toFixed(0)}%) and swelled into a Red Supergiant. Will end in a Supernova.`;
         } else {
            baseStarType = STAR_TYPES.BLUE_GIANT;
            infoHeader = "High-Mass Main Sequence Star";
            fateDescription = `A hot, luminous Blue Giant. Burns through its hydrogen (${hydrogen.toFixed(0)}%) fuel rapidly compared to smaller stars.`;
         }
    } else { 
         if (hydrogen < 20) {
            baseStarType = STAR_TYPES.RED_SUPERGIANT; 
            infoHeader = "Evolved Very High-Mass Star";
            fateDescription = `An exceptionally massive star (${mass.toFixed(1)} M☉, Eff: ${effectiveMass.toFixed(1)}) that has exhausted core hydrogen (${hydrogen.toFixed(0)}%) and entered its late Supergiant phase. Destined for a powerful Supernova.`;
         } else if (hydrogen > 70 && mass > 20 && gravityFactor > 1.2) { 
            baseStarType = STAR_TYPES.O_TYPE_STAR;
            infoHeader = "Extreme O-Type Main Sequence Star";
            fateDescription = `With abundant hydrogen (${hydrogen.toFixed(0)}%), immense mass (${mass.toFixed(1)} M☉), and strong gravity (${gravityFactor.toFixed(1)}x), this is an O-Type Supergiant. It's one of the hottest, brightest, and most massive types of stars, consuming fuel at an astonishing rate. Lifespan is very short.`;
         }
         else {
            baseStarType = STAR_TYPES.BLUE_GIANT; 
            infoHeader = "Very High-Mass Main Sequence Star";
            fateDescription = `An extremely massive (${mass.toFixed(1)} M☉) Blue Giant on the main sequence. Its high hydrogen content (${hydrogen.toFixed(0)}%) fuels a short but brilliant life.`;
         }
         if (baseStarType !== STAR_TYPES.RED_SUPERGIANT || hydrogen < 5) { 
            if (effectiveMass < 25 * (1/gravityFactor)) fateDescription += " Eventual fate: Supernova, then Neutron Star.";
            else fateDescription += " Eventual fate: Supernova, then Black Hole.";
         }
    }
    
    currentStarParams = {
        type: baseStarType,
        effectiveMass: effectiveMass,
        hydrogenLevel: hydrogen,
        gravityInfluence: gravityFactor,
        mass: mass 
    };

    // Update Star Information Div, ensuring it exists
    if (starInfoDiv) {
        starInfoDiv.innerHTML = `<h2>${infoHeader}: ${baseStarType.name}</h2>
                                 <h3>Designation: ${starDesignation}</h3>
                                 <p>${baseStarType.description || "Description not available."}</p>
                                 <p><strong>Current Parameters:</strong> Mass: ${mass.toFixed(1)} M☉, Gravity Inf: ${gravityFactor.toFixed(1)}x, Hydrogen: ${hydrogen.toFixed(0)}%</p>
                                 <p><strong>Probable Fate / Evolution:</strong> ${fateDescription}</p>`;
    } else {
        console.error("starInfoDiv not found!");
    }
            
    animate();
}

function animate() {
    if(!canvas.width || !canvas.height) { // If canvas isn't sized, try to resize then re-call or wait
        console.warn("Canvas not sized, attempting resize for animation frame.");
        resizeCanvas(); // Try to resize
        if(!canvas.width || !canvas.height) { // If still not sized, defer
            animationFrameId = requestAnimationFrame(animate); // Try again next frame
            return;
        }
    }
    drawBackground();
    if (currentStarParams.type) {
        drawStar(currentStarParams);
    }
    animationFrameId = requestAnimationFrame(animate);
}

function handleZoom(deltaY) { // Changed parameter name for clarity with wheel event
    const oldZoom = currentZoom;
    if (deltaY < 0) { 
        currentZoom += ZOOM_SPEED * currentZoom;
    } else { 
        currentZoom -= ZOOM_SPEED * currentZoom;
    }
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom));
    
    if (oldZoom !== currentZoom) {
         zoomValueDisplay.textContent = `Zoom: ${currentZoom.toFixed(1)}x`;
    }
}

// Initial setup and event listeners
// Make sure to run initial setup *after* DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
    // Query DOM elements again inside DOMContentLoaded in case script runs before full parsing
    // (Though placing script at end of body usually prevents this)
    // For safety:
    if (!massSlider) console.error("massSlider not found post-DOM load!");
    // ... similar checks for other critical elements if needed

    if (massSlider) massSlider.addEventListener('input', updateSimulation);
    if (gravitySlider) gravitySlider.addEventListener('input', updateSimulation);
    if (hydrogenSlider) hydrogenSlider.addEventListener('input', updateSimulation);
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => handleZoom(-1)); // -1 for zoom in
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => handleZoom(1));  // 1 for zoom out
    if (resetZoomBtn) resetZoomBtn.addEventListener('click', () => {
        currentZoom = 1.0;
        if(zoomValueDisplay) zoomValueDisplay.textContent = `Zoom: ${currentZoom.toFixed(1)}x`;
    });

    if (canvas) {
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault(); 
            handleZoom(event.deltaY);
        });
    } else {
        console.error("Canvas element not found for wheel listener!");
    }
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        // Call updateSimulation() only if necessary, e.g., if simulation parameters depend on canvas size
        // or to ensure redraw if animate() might have stopped
        if (currentStarParams.type) { // Check if a star is being displayed
             updateSimulation(); //This will re-evaluate and re-trigger animation
        } else {
            animate(); // If no star yet, just ensure background animates
        }
    });

    // Initial calls
    resizeCanvas(); 
    updateSimulation(); 
});