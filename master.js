// Carica sessione
const urlParams = new URLSearchParams(window.location.search);
const sessionCode = urlParams.get('session');
let sessionData = JSON.parse(localStorage.getItem('sessionData')) || {};

// Inizializza sessione se non esiste
if(!sessionData.players) {
    sessionData.players = [];
}
if(!sessionData.enemies) {
    sessionData.enemies = [];
}
if(!sessionData.chat) {
    sessionData.chat = [];
}
if(!sessionData.items) {
    sessionData.items = [];
}

// Aggiorna sessione
function updateSession() {
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
    localStorage.setItem('sessionUpdate', Date.now()); // Notifica aggiornamento
    renderAll();
}

// Mostra info sessione
function renderSessionInfo() {
    document.getElementById('sessionInfo').innerHTML = `
        <p>Sessione: <strong>${sessionData.name}</strong></p>
        <p>Codice: <strong>${sessionCode}</strong></p>
        <p>Giocatori: ${sessionData.players.length}</p>
    `;
}

// Render giocatori
function renderPlayers() {
    const container = document.getElementById('playersList');
    const select = document.getElementById('targetPlayer');
    
    container.innerHTML = '';
    select.innerHTML = '<option value="all">Tutti i giocatori</option>';
    
    sessionData.players.forEach((player, index) => {
        // Card giocatore
        container.innerHTML += `
            <div class="player-card">
                <h3>${player.name} <span class="hp">${player.hp}/${player.maxHp}</span></h3>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${(player.hp/player.maxHp)*100}%"></div>
                </div>
                
                <div class="hp-controls">
                    <input type="number" id="damage${index}" placeholder="Danni" class="input">
                    <button onclick="adjustHP(${index}, -document.getElementById('damage${index}').value)" class="btn">💥 Danni</button>
                    <button onclick="adjustHP(${index}, document.getElementById('damage${index}').value)" class="btn">❤️ Cura</button>
                </div>
                
                <div class="abilities">
                    <strong>Abilità:</strong>
                    ${player.abilities ? player.abilities.map((ability, i) => `
                        <button class="ability-btn ${ability.level === 3 ? 'level-3' : ''} 
                                ${ability.cooldown ? 'cooldown' : ''}"
                                onclick="toggleAbility(${index}, ${i})"
                                ${ability.cooldown ? 'disabled' : ''}>
                            ${ability.name} ${ability.level === 3 ? '🔒' : ''}
                        </button>
                    `).join('') : ''}
                </div>
                
                <div class="inventory">
                    <strong>Inventario:</strong>
                    ${player.inventory ? player.inventory.map(item => `
                        <div class="inventory-item">
                            ${item.name}
                            <button onclick="removeItem('${player.name}', '${item.id}')">❌</button>
                        </div>
                    `).join('') : 'Vuoto'}
                </div>
            </div>
        `;
        
        // Aggiungi al select
        select.innerHTML += `<option value="${player.name}">${player.name}</option>`;
    });
}

// Render nemici
function renderEnemies() {
    const container = document.getElementById('enemiesList');
    container.innerHTML = '';
    
    sessionData.enemies.forEach((enemy, index) => {
        container.innerHTML += `
            <div class="enemy-card">
                <h3>${enemy.name} <span class="hp">${enemy.hp}/${enemy.maxHp}</span></h3>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${(enemy.hp/enemy.maxHp)*100}%"></div>
                </div>
                
                <div class="hp-controls">
                    <input type="number" id="enemyDamage${index}" placeholder="Danni" class="input">
                    <button onclick="adjustEnemyHP(${index}, -document.getElementById('enemyDamage${index}').value)" class="btn">💥 Danni</button>
                    <button onclick="adjustEnemyHP(${index}, document.getElementById('enemyDamage${index}').value)" class="btn">💀 Cura</button>
                    <button onclick="removeEnemy(${index})" class="btn btn-secondary">❌ Elimina</button>
                </div>
            </div>
        `;
    });
}

// Aggiungi nemico
function addEnemy() {
    const name = document.getElementById('newEnemyName').value;
    const hp = parseInt(document.getElementById('newEnemyHP').value);
    
    if(!name || !hp) {
        alert('Inserisci nome e HP!');
        return;
    }
    
    sessionData.enemies.push({
        name: name,
        hp: hp,
        maxHp: hp
    });
    
    updateSession();
    document.getElementById('newEnemyName').value = '';
    document.getElementById('newEnemyHP').value = '';
}

// Aggiungi giocatore (NPC)
function addPlayer() {
    const name = prompt("Nome del NPC:");
    if(!name) return;
    
    sessionData.players.push({
        name: name,
        hp: 30,
        maxHp: 30,
        abilities: [
            { name: "Attacco Base", level: 1 },
            { name: "Abilità Speciale", level: 2 }
        ],
        inventory: []
    });
    
    updateSession();
}

// Modifica HP giocatore
function adjustHP(playerIndex, amount) {
    if(!amount) return;
    
    sessionData.players[playerIndex].hp += parseInt(amount);
    
    // Controlla non superi max
    if(sessionData.players[playerIndex].hp > sessionData.players[playerIndex].maxHp) {
        sessionData.players[playerIndex].hp = sessionData.players[playerIndex].maxHp;
    }
    
    // Controlla non scenda sotto 0
    if(sessionData.players[playerIndex].hp < 0) {
        sessionData.players[playerIndex].hp = 0;
    }
    
    updateSession();
}

// Modifica HP nemico
function adjustEnemyHP(enemyIndex, amount) {
    if(!amount) return;
    
    sessionData.enemies[enemyIndex].hp += parseInt(amount);
    
    if(sessionData.enemies[enemyIndex].hp > sessionData.enemies[enemyIndex].maxHp) {
        sessionData.enemies[enemyIndex].hp = sessionData.enemies[enemyIndex].maxHp;
    }
    
    if(sessionData.enemies[enemyIndex].hp < 0) {
        sessionData.enemies[enemyIndex].hp = 0;
    }
    
    updateSession();
}

// Invia oggetto
function sendItem() {
    const target = document.getElementById('targetPlayer').value;
    const name = document.getElementById('itemName').value;
    const desc = document.getElementById('itemDesc').value;
    
    if(!name) {
        alert('Inserisci nome oggetto!');
        return;
    }
    
    const item = {
        id: Date.now().toString(),
        name: name,
        description: desc,
        timestamp: Date.now()
    };
    
    // Aggiungi alla chat
    sessionData.chat.push({
        type: 'item',
        from: 'Master',
        item: item,
        timestamp: Date.now(),
        message: `📦 ${target === 'all' ? 'A tutti' : 'A ' + target}: ${name}`
    });
    
    // Aggiungi agli inventari
    if(target === 'all') {
        sessionData.players.forEach(player => {
            if(!player.inventory) player.inventory = [];
            player.inventory.push(item);
        });
    } else {
        const player = sessionData.players.find(p => p.name === target);
        if(player) {
            if(!player.inventory) player.inventory = [];
            player.inventory.push(item);
        }
    }
    
    updateSession();
    document.getElementById('itemName').value = '';
    document.getElementById('itemDesc').value = '';
}

// Rimuovi oggetto
function removeItem(playerName, itemId) {
    const player = sessionData.players.find(p => p.name === playerName);
    if(player && player.inventory) {
        player.inventory = player.inventory.filter(item => item.id !== itemId);
        updateSession();
    }
}

// Render chat
function renderChat() {
    const container = document.getElementById('masterChat');
    container.innerHTML = '';
    
    sessionData.chat.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.from === 'Master' ? 'master-message' : ''}`;
        
        if(msg.type === 'item') {
            div.innerHTML = `<strong>🎁 ${msg.message}</strong>`;
        } else {
            div.innerHTML = `<strong>${msg.from}:</strong> ${msg.message}`;
        }
        
        container.appendChild(div);
    });
    
    // Scroll automatico
    container.scrollTop = container.scrollHeight;
}

// Invia messaggio
function sendMasterMessage() {
    const input = document.getElementById('masterMessage');
    const message = input.value.trim();
    
    if(!message) return;
    
    sessionData.chat.push({
        type: 'message',
        from: 'Master',
        message: message,
        timestamp: Date.now()
    });
    
    input.value = '';
    updateSession();
}

// Render tutto
function renderAll() {
    renderSessionInfo();
    renderPlayers();
    renderEnemies();
    renderChat();
}

// Auto-aggiornamento ogni 2 secondi
setInterval(() => {
    const lastUpdate = localStorage.getItem('sessionUpdate');
    if(lastUpdate && lastUpdate > sessionData.lastUpdate) {
        sessionData = JSON.parse(localStorage.getItem('sessionData'));
        renderAll();
    }
}, 2000);

// Inizializza
window.onload = function() {
    if(!sessionCode) {
        alert('Sessione non valida!');
        window.location.href = 'index.html';
        return;
    }
    
    renderAll();
};