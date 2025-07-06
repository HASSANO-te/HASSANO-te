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

    const prefix = nameParts.prefixes[pIdx];
    const root = nameParts.roots[rIdx];
    const suffixPart = nameParts.suffixes[sIdx];
    let numberSuffix = Math.floor(mass * 17 + hydrogen * 3 + gravity * 53) % 9000 + 1000;

    return `${prefix} ${root} ${suffixPart}-${numberSuffix}`;
}


function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    generateBackgroundStars();
    // updateSimulation will be called by listeners or init, no need here if already handled
}

function generateBackgroundStars() {
    backgroundStars = [];
    for (let i = 0; i < NUM_BACKGROUND_STARS; i++) {
        backgroundStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.2 + 0.3,
            alpha: Math.random() * 0.4 + 0.2,
            twinkleSpeed: Math.random() * 0.001 + 0.0005, // Individual twinkle speed
            twinkleOffset: Math.random() * Math.PI * 2 // Individual phase
        });
    }
}

function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const time = Date.now();
    backgroundStars.forEach(star => {
        const currentAlpha = star.alpha * (0.75 + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.25);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 220, 255, ${currentAlpha})`;
        ctx.fill();
    });
}

let pulseState = { t: 0, direction: 1 };
let generalPulse = 0; // For subtle pulsing of active stars

function drawStar(starData) {
    const starType = starData.type; // The base type from STAR_TYPES
    const { effectiveMass, hydrogenLevel, gravityInfluence } = starData; // Dynamic parameters

    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) / (12 / starType.sizeFactor) ;

    let currentRadius = baseRadius;

    // Dynamic visual adjustments based on parameters
    let activityModifier = 1.0 + (gravityInfluence -1.0) * 0.5 + (hydrogenLevel/100 - 0.5) * 0.3 + (effectiveMass/20 -0.5)*0.2;
    activityModifier = Math.max(0.5, Math.min(2.0, activityModifier)); // Clamp

    let dynamicCoronaSizeFactor = 1.5 + starType.activity * activityModifier;
    if (starType.coronaColor) dynamicCoronaSizeFactor += 0.5;

    generalPulse = Date.now() * 0.0005 * starType.activity * activityModifier; // Base for subtle animations

    // --- Apply Zoom Transform ---
    ctx.save();
    ctx.translate(canvasCenterX, canvasCenterY);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-canvasCenterX, -canvasCenterY);
    // --- End Zoom Transform ---


    // Nebula / Supernova Remnant
    if (starType.nebulaColor) {
        const nebulaRadius = baseRadius * starType.nebulaSizeFactor * (0.9 + Math.sin(generalPulse * 0.5) * 0.1) * activityModifier;
        const gradient = ctx.createRadialGradient(canvasCenterX, canvasCenterY, currentRadius * 0.8, canvasCenterX, canvasCenterY, nebulaRadius);
        gradient.addColorStop(0, starType.color);
        gradient.addColorStop(0.2 * (currentRadius/nebulaRadius) , starType.color);
        gradient.addColorStop(0.3 * (currentRadius/nebulaRadius) + 0.1 , starType.nebulaColor);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, nebulaRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    // Accretion Disk for Black Hole
    else if (starType.accretionDisk) {
        const diskOuterRadius = currentRadius * 15 * activityModifier;
        const diskInnerRadius = currentRadius * 1.5;
        const diskRotationSpeed = 0.0002 * activityModifier;

        for (let i = 0; i < 70; i++) { // Fewer, thicker for style
            const t = i / 70;
            const angleOffset = Date.now() * diskRotationSpeed * (1 + t * 1.5) * (i%2 === 0 ? 1 : -1.1); // Varied spin/direction
            const segmentAngle = (Math.PI / 15) * (1 - t * 0.7);

            const r = diskInnerRadius + (diskOuterRadius - diskInnerRadius) * Math.pow(t, 0.6);
            const jitter = 1 + Math.sin(angleOffset * 5 + t * Math.PI * 10) * 0.05 * t;

            ctx.beginPath();
            ctx.arc(canvasCenterX, canvasCenterY, r * jitter,
                    angleOffset + t * Math.PI * 7,
                    angleOffset + t * Math.PI * 7 + segmentAngle);

            const hue = 200 + t * 100 - (Math.sin(generalPulse*2)*20) ; // Shift hue over time: blue -> purple -> red -> orange
            const lightness = 50 + t * 30 + Math.sin(angleOffset*3)*10;
            ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${0.1 + Math.pow(t,0.5) * 0.4})`;
            ctx.lineWidth = (2 + (1-t)*8) * (1 + Math.sin(angleOffset*2+t)*0.1);
            ctx.stroke();
        }
        // Event horizon
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
         // Subtle lensing effect
        ctx.strokeStyle = "rgba(50,50,80,0.1)";
        ctx.lineWidth = Math.max(1, currentRadius * 0.1);
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, currentRadius * (1.1 + Math.sin(generalPulse*0.3)*0.05), 0, Math.PI*2);
        ctx.stroke();

    }
    // Regular Star / Neutron Star
    else {
        if (starType.pulse) { // Neutron Star Pulsing
            pulseState.t += pulseState.direction * 0.07 * activityModifier;
            if (pulseState.t > 1 || pulseState.t < 0) pulseState.direction *= -1;
            let pulseFactor = (0.7 + Math.abs(pulseState.t) * 0.6);

            // Beams
            const beamLength = Math.min(canvas.width, canvas.height) * 0.75 / currentZoom; // Keep beam length relative to screen, not star size
            const angle = (Date.now() * 0.003 * activityModifier) % (Math.PI * 2);
            ctx.save();
            ctx.translate(canvasCenterX, canvasCenterY);
            ctx.rotate(angle);
            // Beam 1
            let beamGrad = ctx.createLinearGradient(0,0, beamLength,0);
            beamGrad.addColorStop(0, `rgba(220, 220, 255, ${0.8 * pulseFactor})`);
            beamGrad.addColorStop(1, "rgba(200, 200, 255, 0)");
            ctx.strokeStyle = beamGrad;
            ctx.lineWidth = (3 + pulseFactor*2) * activityModifier;
            ctx.beginPath(); ctx.moveTo(currentRadius*1.2,0); ctx.lineTo(beamLength,0); ctx.stroke();
             // Beam 2 (opposite)
            beamGrad = ctx.createLinearGradient(0,0, -beamLength,0);
            beamGrad.addColorStop(0, `rgba(220, 220, 255, ${0.8 * pulseFactor})`);
            beamGrad.addColorStop(1, "rgba(200, 200, 255, 0)");
            ctx.strokeStyle = beamGrad;
            ctx.beginPath(); ctx.moveTo(-currentRadius*1.2,0); ctx.lineTo(-beamLength,0); ctx.stroke();
            ctx.restore(); // Restore from beam rotation

            currentRadius *= pulseFactor; // Pulsing star body size
        }

        // General subtle pulsation for active stars
        let subtlePulseFactor = 1.0;
        if (starType.activity > 0.4 && !starType.pulse) { // For non-neutron active stars
            subtlePulseFactor = 1.0 + Math.sin(generalPulse) * 0.02 * starType.activity * activityModifier;
            currentRadius *= subtlePulseFactor;
        }

        // Corona / Glow
        const glowRadius = currentRadius * dynamicCoronaSizeFactor * (1.0 + Math.sin(generalPulse*1.5) * 0.05 * activityModifier) ;
        const coreBrightnessFactor = 0.5 + starType.activity * 0.2 * activityModifier;

        const gradient = ctx.createRadialGradient(canvasCenterX, canvasCenterY, currentRadius * 0.3, canvasCenterX, canvasCenterY, glowRadius);
        gradient.addColorStop(0, `rgba(255,255,255, ${Math.min(1, coreBrightnessFactor)})`); // Bright core
        gradient.addColorStop(0.2, starType.color);
        gradient.addColorStop(0.6, starType.coronaColor || starType.color.replace(')', `, ${0.3 * activityModifier})`).replace('rgb', 'rgba'));
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Star Body
        ctx.fillStyle = starType.color;
        ctx.beginPath();
        ctx.arc(canvasCenterX, canvasCenterY, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Add some "flare" or "surface activity" for very active stars (e.g. Blue Giants, O-Types)
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
    const effectiveMass = mass * (1 + (gravityFactor - 1) * 0.5); // Gravity factor more subtly influences effective mass for thresholds

    const starDesignation = generateStarName(mass, hydrogen, gravityFactor);


    // More detailed logic based on hydrogen and effectiveMass
    if (hydrogen < 5) { // End of life / very low fuel
        infoHeader = "Nearing End of Life / Fuel Exhausted";
        if (effectiveMass < 0.5) { // Was Red Dwarf
            baseStarType = STAR_TYPES.RED_DWARF; // Remains RD as they burn H extremely slowly
            fateDescription = "Continues as a Red Dwarf, slowly converting remaining Hydrogen for eons. Eventually might become a (hypothetical) Blue Dwarf, then a Helium White Dwarf after trillions of years.";
        } else if (effectiveMass < 8) { // Low to medium mass
             baseStarType = STAR_TYPES.PLANETARY_NEBULA_PHASE;
             fateDescription = "Has shed its outer layers as a Planetary Nebula. The core remains as a cooling White Dwarf.";
        } else { // Massive stars
            baseStarType = STAR_TYPES.SUPERNOVA_REMNANT;
            fateDescription = "Its core has collapsed, triggering a cataclysmic Supernova explosion!";
            if (effectiveMass < 25 * (1/gravityFactor)) { // Gravity factor can push it to BH earlier
                fateDescription += " The remnant core is likely a dense Neutron Star.";
                if (hydrogen < 2) baseStarType = STAR_TYPES.NEUTRON_STAR; // Show compact object if really low H
            } else {
                fateDescription += " The immense gravity of the collapsing core forms a Black Hole.";
                 if (hydrogen < 2) baseStarType = STAR_TYPES.BLACK_HOLE;
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
        if (hydrogen < 40) { // Evolving off MS
            baseStarType = STAR_TYPES.RED_GIANT;
            infoHeader = "Evolved Medium-Mass Star";
            fateDescription = `Having consumed much of its core hydrogen (${hydrogen.toFixed(0)}%), it has expanded into a Red Giant. Future: Planetary Nebula, then White Dwarf.`;
        } else {
            baseStarType = STAR_TYPES.YELLOW_DWARF;
            infoHeader = "Medium-Mass Main Sequence Star";
            fateDescription = `A Yellow Dwarf, similar to our Sun. Fuses hydrogen into helium in its core. Stable for billions of years. Hydrogen Level: ${hydrogen.toFixed(0)}%.`;
        }
    } else if (effectiveMass < 8) { // Blue Giants that become Red Supergiants
         if (hydrogen < 30) {
            baseStarType = STAR_TYPES.RED_SUPERGIANT;
            infoHeader = "Evolved High-Mass Star";
            fateDescription = `A massive star (${mass.toFixed(1)} M☉) that has exhausted core hydrogen (${hydrogen.toFixed(0)}%) and swelled into a Red Supergiant. Will end in a Supernova.`;
         } else {
            baseStarType = STAR_TYPES.BLUE_GIANT;
            infoHeader = "High-Mass Main Sequence Star";
            fateDescription = `A hot, luminous Blue Giant. Burns through its hydrogen (${hydrogen.toFixed(0)}%) fuel rapidly compared to smaller stars.`;
         }
    } else { // Very Massive Stars (potential O-Type, direct BH)
         if (hydrogen < 20) {
            baseStarType = STAR_TYPES.RED_SUPERGIANT; // Could also be Wolf-Rayet etc.
            infoHeader = "Evolved Very High-Mass Star";
            fateDescription = `An exceptionally massive star (${mass.toFixed(1)} M☉, Eff: ${effectiveMass.toFixed(1)}) that has exhausted core hydrogen (${hydrogen.toFixed(0)}%) and entered its late Supergiant phase. Destined for a powerful Supernova.`;
         } else if (hydrogen > 70 && mass > 20 && gravityFactor > 1.2) { // Prime conditions for O-Type
            baseStarType = STAR_TYPES.O_TYPE_STAR;
            infoHeader = "Extreme O-Type Main Sequence Star";
            fateDescription = `With abundant hydrogen (${hydrogen.toFixed(0)}%), immense mass (${mass.toFixed(1)} M☉), and strong gravity (${gravityFactor.toFixed(1)}x), this is an O-Type Supergiant. It's one of the hottest, brightest, and most massive types of stars, consuming fuel at an astonishing rate. Lifespan is very short.`;
         }
         else {
            baseStarType = STAR_TYPES.BLUE_GIANT; // Default for massive, could be more specific
            infoHeader = "Very High-Mass Main Sequence Star";
            fateDescription = `An extremely massive (${mass.toFixed(1)} M☉) Blue Giant on the main sequence. Its high hydrogen content (${hydrogen.toFixed(0)}%) fuels a short but brilliant life.`;
         }
         // Add Black Hole/Neutron Star to fate based on final mass
         if (baseStarType !== STAR_TYPES.RED_SUPERGIANT || hydrogen < 5) { // Add to fate description if not already supernova state from H<5
            if (effectiveMass < 25 * (1/gravityFactor)) fateDescription += " Eventual fate: Supernova, then Neutron Star.";
            else fateDescription += " Eventual fate: Supernova, then Black Hole.";
         }
    }

    // Store current star properties for drawing function
    currentStarParams = {
        type: baseStarToype,
        effectiveMass: effectiveMass,
        hydrogenLevel: hydrogen,
        gravityInfluence: gravityFactor,
        mass: mass // Pass original mass too if needed
    };

    starInfoDiv.innerHTML = `<h2>${infoHeader}: ${baseStarType.name}</h2>
                             <h3>Designation: ${starDesignation}</h3>
                             <p>${baseStarType.description}</p>
                             <p><strong>Current Parameters:</strong> Mass: ${mass.toFixed(1)} M☉, Gravity Inf: ${gravityFactor.toFixed(1)}x, Hydrogen: ${hydrogen.toFixed(0)}%</p>
                             <p><strong>Probable Fate / Evolution:</strong> ${fateDescription}</p>`;

    // Restart animation loop
    animate();
}

function animate() {
    drawBackground();
    if (currentStarParams.type) { // Ensure star type is determined
        drawStar(currentStarParams);
    }
    animationFrameId = requestAnimationFrame(animate);
}

function handleZoom(delta) {
    const oldZoom = currentZoom;
    if (delta < 0) { // Zoom In
        currentZoom += ZOOM_SPEED * currentZoom; // Percentage based zoom feels more natural
    } else { // Zoom Out
        currentZoom -= ZOOM_SPEED * currentZoom;
    }
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom));

    if (oldZoom !== currentZoom) {
         zoomValueDisplay.textContent = `Zoom: ${currentZoom.toFixed(1)}x`;
         // No need to call updateSimulation unless parameters change, just re-render.
         // The animate loop handles re-rendering.
    }
}

// Event Listeners
massSlider.addEventListener('input', updateSimulation);
gravitySlider.addEventListener('input', updateSimulation);
hydrogenSlider.addEventListener('input', updateSimulation);

zoomInBtn.addEventListener('click', () => handleZoom(-1));
zoomOutBtn.addEventListener('click', () => handleZoom(1));
resetZoomBtn.addEventListener('click', () => {
    currentZoom = 1.0;
    zoomValueDisplay.textContent = `Zoom: ${currentZoom.toFixed(1)}x`;
});

canvas.addEventListener('wheel', (event) => {
    event.preventDefault(); // Prevent page scroll
    handleZoom(event.deltaY);
});

window.addEventListener('resize', () => {
    resizeCanvas();
    updateSimulation(); // Ensure content redraws correctly after resize
});

// Initial setup
resizeCanvas(); // Sets initial canvas size and draws background
updateSimulation(); // Sets initial star based on default slider values and starts animation