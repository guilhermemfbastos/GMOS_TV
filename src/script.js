let allApps = [];
let desktopApps = JSON.parse(localStorage.getItem('desktopApps')) || [];

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    // Setup Drawer Toggle
    document.getElementById('app-drawer-btn').addEventListener('click', () => {
        document.getElementById('app-drawer').classList.remove('hidden');
    });
    document.getElementById('close-drawer-btn').addEventListener('click', () => {
        document.getElementById('app-drawer').classList.add('hidden');
    });

    // Fetch Apps
    try {
        if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
            const result = await window.Capacitor.Plugins.AppLauncherPlugin.getInstalledApps();
            allApps = result.apps;
        } else {
            // Mock data for PC testing
            allApps = [
                { name: 'Configurações', packageName: 'com.android.settings', icon: null },
                { name: 'Câmera', packageName: 'com.android.camera', icon: null },
                { name: 'Galeria', packageName: 'com.android.gallery', icon: null },
                { name: 'Navegador', packageName: 'com.android.chrome', icon: null },
                { name: 'Telefone', packageName: 'com.android.dialer', icon: null }
            ];
        }
        renderDrawerApps();
        renderDesktopApps();
        renderTaskbarApps();
    } catch (e) {
        console.error(e);
        document.getElementById('all-apps-grid').innerHTML = '<div class="loading-text">Erro ao carregar apps.</div>';
    }

    setupDragAndDrop();
});

// Render functions
function createAppElement(app, context) {
    const el = document.createElement('div');
    el.className = 'app-item';
    el.setAttribute('data-pkg', app.packageName);
    el.setAttribute('data-context', context);
    
    const icon = document.createElement('div');
    icon.className = 'app-icon';
    if (app.icon) {
        icon.style.backgroundImage = `url('data:image/png;base64,${app.icon}')`;
    } else {
        icon.textContent = app.name.charAt(0).toUpperCase();
    }

    const label = document.createElement('div');
    label.className = 'app-label';
    label.textContent = app.name;

    el.appendChild(icon);
    el.appendChild(label);

    // Launch app on click
    el.addEventListener('click', (e) => {
        if(isDragging) return; // Prevent click if dragging
        if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
            window.Capacitor.Plugins.AppLauncherPlugin.launchApp({ packageName: app.packageName });
        } else {
            console.log(`Lançando: ${app.packageName}`);
        }
    });

    // Context menu for desktop items to remove them
    if (context === 'desktop') {
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, app.packageName);
        });
    }

    return el;
}

function renderDrawerApps() {
    const grid = document.getElementById('all-apps-grid');
    grid.innerHTML = '';
    allApps.forEach(app => {
        const el = createAppElement(app, 'drawer');
        grid.appendChild(el);
    });
}

function renderDesktopApps() {
    const grid = document.getElementById('desktop-grid');
    grid.innerHTML = '';
    desktopApps.forEach(pkg => {
        const app = allApps.find(a => a.packageName === pkg);
        if (app) {
            const el = createAppElement(app, 'desktop');
            grid.appendChild(el);
        }
    });
}

function renderTaskbarApps() {
    // Just a placeholder for pinned apps, could be dynamic later
    // Currently hardcoded in HTML as an example, but let's clear and re-add basic ones
    const taskbar = document.getElementById('taskbar-apps');
    taskbar.innerHTML = '';
    const pinned = allApps.slice(0, 3); // Pick first 3 as default
    pinned.forEach(app => {
        const el = document.createElement('div');
        el.className = 'app-icon';
        el.setAttribute('data-pkg', app.packageName);
        if (app.icon) el.style.backgroundImage = `url('data:image/png;base64,${app.icon}')`;
        else el.textContent = app.name.charAt(0).toUpperCase();
        
        el.addEventListener('click', () => {
            if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
                window.Capacitor.Plugins.AppLauncherPlugin.launchApp({ packageName: app.packageName });
            } else {
                console.log(`Lançando: ${app.packageName}`);
            }
        });
        taskbar.appendChild(el);
    });
}

// Drag and Drop Logic (Touch and Mouse)
let isDragging = false;
let dragElement = null;
let currentDropZone = null;
let dragGhost = null;

function setupDragAndDrop() {
    let pressTimer = null;
    let startX = 0, startY = 0;
    
    // Attach to body to catch events via delegation
    document.body.addEventListener('touchstart', handleStart, {passive: false});
    document.body.addEventListener('mousedown', handleStart);
    
    document.body.addEventListener('touchmove', handleMove, {passive: false});
    document.body.addEventListener('mousemove', handleMove);
    
    document.body.addEventListener('touchend', handleEnd);
    document.body.addEventListener('mouseup', handleEnd);

    function getAppItemFromEvent(e) {
        return e.target.closest('.app-item');
    }

    function handleStart(e) {
        const appItem = getAppItemFromEvent(e);
        if (!appItem) return;
        
        if(e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }

        // Long press detection for drag
        pressTimer = setTimeout(() => {
            startDrag(appItem, startX, startY);
        }, 500); // 500ms long press to start dragging
    }

    function handleMove(e) {
        let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        // If moved too much before long press triggers, cancel it
        if (!isDragging && pressTimer) {
            if (Math.abs(clientX - startX) > 10 || Math.abs(clientY - startY) > 10) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        }

        if (isDragging && dragGhost) {
            e.preventDefault(); // Prevent scrolling while dragging
            dragGhost.style.left = (clientX - dragGhost.offsetWidth / 2) + 'px';
            dragGhost.style.top = (clientY - dragGhost.offsetHeight / 2) + 'px';
            
            // Check drop zone
            const elementsUnder = document.elementsFromPoint(clientX, clientY);
            const desktop = elementsUnder.find(el => el.id === 'desktop-grid' || el.id === 'desktop');
            
            if (desktop) {
                document.getElementById('desktop-grid').classList.add('drag-over');
                currentDropZone = 'desktop';
            } else {
                document.getElementById('desktop-grid').classList.remove('drag-over');
                currentDropZone = null;
            }
        }
    }

    function handleEnd(e) {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }

        if (isDragging) {
            isDragging = false;
            if (dragGhost) dragGhost.remove();
            dragGhost = null;
            document.getElementById('desktop-grid').classList.remove('drag-over');
            
            if (dragElement) {
                dragElement.style.opacity = '1';
                
                // If dropped on desktop
                if (currentDropZone === 'desktop') {
                    const pkg = dragElement.getAttribute('data-pkg');
                    if (!desktopApps.includes(pkg)) {
                        desktopApps.push(pkg);
                        localStorage.setItem('desktopApps', JSON.stringify(desktopApps));
                        renderDesktopApps();
                    }
                    // Close drawer if it was open
                    document.getElementById('app-drawer').classList.add('hidden');
                }
                dragElement = null;
            }
        }
    }

    function startDrag(element, x, y) {
        isDragging = true;
        dragElement = element;
        dragElement.style.opacity = '0.5';

        // Create ghost element
        dragGhost = element.cloneNode(true);
        dragGhost.style.position = 'fixed';
        dragGhost.style.pointerEvents = 'none'; // so we can detect elements underneath
        dragGhost.style.zIndex = '1000';
        dragGhost.style.opacity = '0.8';
        dragGhost.style.left = (x - element.offsetWidth / 2) + 'px';
        dragGhost.style.top = (y - element.offsetHeight / 2) + 'px';
        document.body.appendChild(dragGhost);
        
        // Vibrate to indicate drag started
        if (navigator.vibrate) navigator.vibrate(50);
    }
}

// Context Menu Logic
const contextMenu = document.getElementById('context-menu');
let contextTargetPkg = null;

function showContextMenu(x, y, pkg) {
    contextTargetPkg = pkg;
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.classList.remove('hidden');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#context-menu')) {
        contextMenu.classList.add('hidden');
    }
});

document.getElementById('context-remove').addEventListener('click', () => {
    if (contextTargetPkg) {
        desktopApps = desktopApps.filter(p => p !== contextTargetPkg);
        localStorage.setItem('desktopApps', JSON.stringify(desktopApps));
        renderDesktopApps();
    }
    contextMenu.classList.add('hidden');
});
