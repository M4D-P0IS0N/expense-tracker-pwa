// --- Neural Border Canvas Animation ---
// Renders an animated neural-network-style border using HTML5 Canvas.
// No external dependencies — only requires a canvas element with id="neural-border-canvas".

export function initNeuralBorder() {
    const canvas = document.getElementById('neural-border-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.parentElement.offsetWidth;
        height = canvas.parentElement.offsetHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    // Nodes around the perimeter
    const colors = ['#00ff80', '#00f2ff', '#b300ff']; // Green, Cyan, Purple
    const nodes = [];
    for (let i = 0; i < 8; i++) {
        nodes.push({
            progress: i / 8 + (Math.random() * 0.05),
            speed: 0.001 + Math.random() * 0.0015,
            color: colors[i % colors.length]
        });
    }

    const sparkles = [];
    let time = 0;

    function hexToRgb(h) {
        return {
            r: parseInt(h.substring(1, 3), 16),
            g: parseInt(h.substring(3, 5), 16),
            b: parseInt(h.substring(5, 7), 16)
        };
    }

    function interpolateColor(c1, c2, factor) {
        const c1Rgb = hexToRgb(c1);
        const c2Rgb = hexToRgb(c2);
        const r = Math.round(c1Rgb.r + factor * (c2Rgb.r - c1Rgb.r));
        const g = Math.round(c1Rgb.g + factor * (c2Rgb.g - c1Rgb.g));
        const b = Math.round(c1Rgb.b + factor * (c2Rgb.b - c1Rgb.b));
        return `rgb(${r}, ${g}, ${b})`;
    }
    function getPoint(p) {
        p = p % 1;
        if (p < 0) p += 1;
        const total = width * 2 + height * 2;
        let d = p * total;
        if (d < width) return { x: d, y: 0, nx: 0, ny: 1 };
        d -= width;
        if (d < height) return { x: width, y: d, nx: -1, ny: 0 };
        d -= height;
        if (d < width) return { x: width - d, y: height, nx: 0, ny: -1 };
        d -= width;
        return { x: 0, y: height - d, nx: 1, ny: 0 };
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        time += 0.006; // Slowed down significantly for hypnotic effect

        nodes.forEach(n => { n.progress += n.speed * 0.15; }); // Slowed movement on perimeter
        nodes.sort((a, b) => (a.progress % 1) - (b.progress % 1));

        // Spawn random sparkles
        if (Math.random() < 0.15) {
            sparkles.push({
                progress: Math.random(),
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                color: colors[Math.floor(Math.random() * colors.length)],
                offset: (Math.random() - 0.5) * 4 // slight deviation from line
            });
        }

        ctx.lineWidth = 1.5;

        for (let i = 0; i < nodes.length; i++) {
            const n1 = nodes[i];
            const n2 = nodes[(i + 1) % nodes.length];

            let d1 = n1.progress % 1;
            let d2 = n2.progress % 1;
            if (d2 < d1) d2 += 1; // Wrap around for interpolation

            const dist1D = (d2 - d1) * (width * 2 + height * 2);
            const steps = Math.floor(dist1D / 5) || 1;

            let prevX, prevY;
            for (let j = 0; j <= steps; j++) {
                const prog = j / steps;
                const curr1D = d1 + (d2 - d1) * prog;
                const pt = getPoint(curr1D);

                // Sin wave amplitude only in the middle of the segment
                const amp = 4 * Math.sin(prog * Math.PI);
                const waveOffset = amp * Math.sin((j * 0.5) - time * 2);

                // Inset to prevent clipping/bleeding 
                const inset = 3;
                // Apply offset along normal vector
                const finalX = pt.x + pt.nx * waveOffset + pt.nx * inset;
                const finalY = pt.y + pt.ny * waveOffset + pt.ny * inset;

                if (j > 0) {
                    ctx.beginPath();
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(finalX, finalY);

                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    const color = interpolateColor(n1.color, n2.color, prog);
                    ctx.strokeStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                    ctx.stroke();
                }
                prevX = finalX;
                prevY = finalY;
            }
            ctx.shadowBlur = 0; // reset
        }

        // Draw sparkles
        for (let i = sparkles.length - 1; i >= 0; i--) {
            const s = sparkles[i];
            s.life -= s.decay;
            if (s.life <= 0) {
                sparkles.splice(i, 1);
                continue;
            }

            const pt = getPoint(s.progress);
            const inset = 3;
            const sX = pt.x + pt.nx * (inset + s.offset);
            const sY = pt.y + pt.ny * (inset + s.offset);

            ctx.beginPath();
            ctx.arc(sX, sY, 1.0 + Math.random() * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 8;
            ctx.globalAlpha = Math.max(0, s.life);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }
    }

    // Throttle animation to ~30fps for better mobile performance
    let lastFrameTime = 0;
    function loop(timestamp) {
        requestAnimationFrame(loop);
        // Limit to 30 FPS -> ~33ms per frame
        if (timestamp - lastFrameTime < 33) return;
        lastFrameTime = timestamp;
        draw();
    }

    requestAnimationFrame(loop);
}
