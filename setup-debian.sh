#!/bin/bash
# ==========================================
# GMOS - Script de Instalação no Debian Minimal
# Execute como root após instalar o Debian Base (sem interface)
# ==========================================

# 1. Atualizar sistema
echo "Atualizando o sistema..."
apt-get update && apt-get upgrade -y

# 2. Instalar dependências essenciais
# xserver-xorg-core: Servidor gráfico X11 minimalista
# xinit: Para iniciar o X
# nodejs & npm: Para rodar o Electron
# libnss3, libasound2, etc: Dependências típicas do Electron
echo "Instalando servidor X minimalista e dependências..."
apt-get install -y xserver-xorg-core xserver-xorg-video-all xserver-xorg-input-all \
    xinit libnss3 libatk-bridge2.0-0 libdrm2 libgtk-3-0 libgbm1 libasound2 \
    curl git unzip

# 3. Instalar Node.js moderno (opcional, Debian pode ter versão antiga)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 4. Criar usuário kiosk para segurança (opcional, pode ser o seu usuário)
# useradd -m gmos-user

# 5. Configurar auto-login e auto-start do X11
echo "Configurando inicialização automática..."

# Modificar o TTY1 para fazer login automático
mkdir -p /etc/systemd/system/getty@tty1.service.d/
cat <<EOF > /etc/systemd/system/getty@tty1.service.d/override.conf
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin root --noclear %I $TERM
EOF

# Ao logar, iniciar o X11 automaticamente
cat <<EOF >> /root/.bash_profile
if [ -z "\$DISPLAY" ] && [ "\$(tty)" = "/dev/tty1" ]; then
    startx
fi
EOF

# 6. Configurar o arquivo .xinitrc (O que o X11 vai rodar)
# Aqui é onde a mágica acontece. Não iniciamos um Window Manager,
# iniciamos o Electron DIRETAMENTE.
cat <<EOF > /root/.xinitrc
#!/bin/sh
# Desativar screen blanking/screensaver
xset s off
xset s noblank
xset -dpms

# Navegar até a pasta do projeto (Ajuste o caminho conforme necessário)
cd /opt/gmos

# Executar o Electron
# A flag --no-sandbox pode ser necessária dependendo das permissões do root
exec npm start -- --no-sandbox
EOF

echo "Instalação concluída! Coloque os arquivos do seu projeto em /opt/gmos, rode 'npm install' lá dentro e reinicie o sistema."
