// Relógio
function updateClock() {
    const now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}`;
}
setInterval(updateClock, 1000);
updateClock();

// D-Pad Navigation Logic
document.addEventListener('keydown', (e) => {
    const focusable = Array.from(document.querySelectorAll('.app-card'));
    if (focusable.length === 0) return;

    const currentIndex = focusable.indexOf(document.activeElement);

    switch(e.key) {
        case 'ArrowRight':
            e.preventDefault();
            if (currentIndex < focusable.length - 1) {
                focusable[currentIndex + 1].focus();
                focusable[currentIndex + 1].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (currentIndex > 0) {
                focusable[currentIndex - 1].focus();
                focusable[currentIndex - 1].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            if (currentIndex !== -1) {
                focusable[currentIndex].click();
            }
            break;
    }
});

// Renderizar apps
function renderApps(appsList) {
    const container = document.getElementById('apps-container');
    container.innerHTML = ''; // Limpa placeholders

    appsList.forEach((app, index) => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.tabIndex = 0; // Torna focável pelo controle remoto

        // Verifica se tem ícone base64
        const iconHtml = app.icon 
            ? `<img src="data:image/png;base64,${app.icon}" alt="${app.name}">` 
            : `<div style="background: linear-gradient(135deg, #4facfe, #00f2fe); width: 100%; height: 100%;"></div>`;

        card.innerHTML = `
            <div class="app-icon">
                ${iconHtml}
            </div>
            <span>${app.name}</span>
        `;

        card.addEventListener('click', () => {
            console.log("Abrindo pacote:", app.packageName);
            if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
                window.Capacitor.Plugins.AppLauncherPlugin.launchApp({ packageName: app.packageName });
            } else {
                alert(`Lançando: ${app.name}\nPacote: ${app.packageName}\n\nIsso funcionará na TV!`);
            }
        });

        card.addEventListener('focus', () => {
            document.getElementById('hero-title').textContent = app.name;
            document.getElementById('hero-desc').textContent = app.packageName;
        });

        container.appendChild(card);
    });

    // Focar no primeiro app automaticamente
    if (container.firstChild) {
        container.firstChild.focus();
    }
}

// Inicialização: Tenta buscar os apps do plugin nativo, ou mocka se estiver no navegador
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
            const result = await window.Capacitor.Plugins.AppLauncherPlugin.getInstalledApps();
            renderApps(result.apps);
        } else {
            // Fallback para teste no navegador do PC
            const mockApps = [
                { name: 'Netflix', packageName: 'com.netflix.ninja', icon: null },
                { name: 'YouTube', packageName: 'com.google.android.youtube.tv', icon: null },
                { name: 'Prime Video', packageName: 'com.amazon.amazonvideo.livingroom', icon: null },
                { name: 'Play Store', packageName: 'com.android.vending', icon: null },
                { name: 'Spotify', packageName: 'com.spotify.tv.android', icon: null }
            ];
            renderApps(mockApps);
        }
    } catch (e) {
        console.error("Erro ao carregar apps:", e);
    }
});
