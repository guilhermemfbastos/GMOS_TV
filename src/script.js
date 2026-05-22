// D-Pad Navigation Logic (Horizontal e Vertical)
document.addEventListener('keydown', (e) => {
    // Se o assistente virtual estiver aberto, fecha com qualquer tecla (ou Back)
    const vaOverlay = document.getElementById('va-overlay');
    if (!vaOverlay.classList.contains('hidden')) {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') {
            vaOverlay.classList.add('hidden');
        }
        e.preventDefault();
        return;
    }

    const focusable = Array.from(document.querySelectorAll('.focusable'));
    if (focusable.length === 0) return;

    let currentIndex = focusable.indexOf(document.activeElement);

    // Se nada estiver focado, foca no primeiro
    if (currentIndex === -1) {
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
            focusable[0].focus();
            e.preventDefault();
        }
        return;
    }

    const currentEl = focusable[currentIndex];
    
    // Simplificação de navegação para TV
    // Para simplificar a lógica espacial, vamos tentar focar no elemento visualmente próximo
    // Como os elementos estão em uma grade estruturada no HTML, a ordem do DOM (index) 
    // já é próxima da visual para Direita/Esquerda.
    
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
        case 'ArrowDown':
            e.preventDefault();
            // Pula da Navbar para os Posters (que estão mais no fim do DOM)
            // Lógica simples: se estiver na nav-bar, pula +6 ou +8 elementos
            const nextRowEl = focusable.find((el, idx) => idx > currentIndex && el.classList.contains('poster'));
            if (nextRowEl) {
                nextRowEl.focus();
                nextRowEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            // Se estiver nos posters, pula de volta para a nav-bar
            if (currentEl.classList.contains('poster')) {
                const prevRowEl = focusable.find(el => el.classList.contains('nav-icon') || el.classList.contains('nav-app'));
                if (prevRowEl) {
                    prevRowEl.focus();
                    prevRowEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            } else {
                // Vai para o Hero Banner
                const heroBtn = document.querySelector('.hero-button');
                if (heroBtn) heroBtn.focus();
            }
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            currentEl.click();
            break;
    }
});

// Ações de clique
document.addEventListener('click', (e) => {
    const target = e.target.closest('.focusable');
    if (!target) return;

    const action = target.getAttribute('data-action');
    
    if (action === 'assistant') {
        const vaOverlay = document.getElementById('va-overlay');
        vaOverlay.classList.remove('hidden');
        
        // Foca automaticamente no input para abrir o teclado virtual da TV
        setTimeout(() => {
            document.getElementById('chat-input').focus();
        }, 100);
    } 
    else if (action === 'launch') {
        const pkg = target.getAttribute('data-pkg');
        if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
            window.Capacitor.Plugins.AppLauncherPlugin.launchApp({ packageName: pkg });
        } else {
            alert(`Iniciando app: ${pkg}`);
        }
    }
    else if (action === 'settings') {
        if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
            window.Capacitor.Plugins.AppLauncherPlugin.openSettings();
        } else {
            alert("Abrindo configurações nativas da TV...");
        }
    }
    else {
        console.log("Ação clicada:", action);
        // Animação de clique
        target.style.transform = 'scale(0.95)';
        setTimeout(() => target.style.transform = 'scale(1.05)', 150);
    }
});

// Inicialização de Foco e Busca de Apps Nativos
window.allInstalledApps = [];

document.addEventListener('DOMContentLoaded', async () => {
    const firstIcon = document.querySelector('.nav-icon.active');
    if (firstIcon) firstIcon.focus();

    try {
        if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
            const result = await window.Capacitor.Plugins.AppLauncherPlugin.getInstalledApps();
            window.allInstalledApps = result.apps;
            renderRealApps(result.apps);
        } else {
            // Emulador para PC
            window.allInstalledApps = [
                { name: 'Netflix', packageName: 'com.netflix.ninja', icon: null },
                { name: 'YouTube', packageName: 'com.google.android.youtube.tv', icon: null },
                { name: 'Prime Video', packageName: 'com.amazon.amazonvideo.livingroom', icon: null }
            ];
            renderRealApps(window.allInstalledApps);
        }
    } catch (e) {
        console.error("Erro ao carregar apps:", e);
    }

    // Inicializa Eventos do Chat
    setupChatLogic();
});

function renderRealApps(appsList) {
    const container = document.getElementById('real-apps-container');
    container.innerHTML = ''; 

    appsList.forEach((app) => {
        const poster = document.createElement('div');
        poster.className = 'poster focusable';
        poster.tabIndex = 0;
        poster.setAttribute('data-action', 'launch');
        poster.setAttribute('data-pkg', app.packageName);

        // Se tiver ícone do Android, usa como background
        if (app.icon) {
            poster.style.backgroundImage = `url('data:image/png;base64,${app.icon}')`;
            poster.style.backgroundSize = 'contain';
            poster.style.backgroundRepeat = 'no-repeat';
            poster.style.backgroundColor = '#1a1c29';
        } else {
            poster.style.background = '#222';
            poster.style.display = 'flex';
            poster.style.alignItems = 'center';
            poster.style.justifyContent = 'center';
        }

        poster.innerHTML = `
            <div class="poster-title">${app.name}</div>
        `;

        container.appendChild(poster);
    });
}

function setupChatLogic() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messages = document.getElementById('chat-messages');

    const addMessage = (text, isUser) => {
        const div = document.createElement('div');
        div.className = `chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    };

    const handleSend = () => {
        const text = input.value.trim();
        if (!text) return;
        
        addMessage(text, true);
        input.value = '';
        
        // Simples Inteligência para processar o comando
        setTimeout(() => processCommand(text.toLowerCase()), 500);
    };

    const processCommand = (cmd) => {
        if (cmd.startsWith("abrir ") || cmd.startsWith("open ")) {
            const appName = cmd.replace("abrir ", "").replace("open ", "").trim();
            
            // Busca aplicativo
            const app = window.allInstalledApps.find(a => a.name.toLowerCase().includes(appName));
            
            if (app) {
                addMessage(`Abrindo o ${app.name} para você! 🚀`, false);
                setTimeout(() => {
                    if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
                        window.Capacitor.Plugins.AppLauncherPlugin.launchApp({ packageName: app.packageName });
                    }
                }, 1000);
            } else {
                addMessage(`Puxa, não encontrei nenhum aplicativo chamado "${appName}" na sua Mi Box.`, false);
            }
        } else if (cmd.includes("olá") || cmd.includes("oi")) {
            addMessage("Olá! Que bom falar com você. Quer que eu abra algum app?", false);
        } else if (cmd.includes("obrigado") || cmd.includes("valeu")) {
            addMessage("Por nada! Estou sempre aqui para ajudar.", false);
        } else {
            addMessage("Ainda estou aprendendo a conversar! Por enquanto, tente me pedir para 'abrir' algum app.", false);
        }
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });
}
