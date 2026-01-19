const urlParams = new URLSearchParams(window.location.search);
const sessionCode = urlParams.get('session');
const playerData = JSON.parse(localStorage.getItem('playerData'));
let sessionData = JSON.parse(localStorage.getItem('sessionData')) || {};

// Trova il personaggio del giocatore
function findMyCharacter() {
    if(!sessionData.players) return null;
    return sessionData.players.find(p => p.name === playerData.name);
}

// Render personaggio
function renderCharacter() {
    const character = findMyCharacter();
    if(!character) {
        document.getElementById('characterInfo').innerHTML = `
            <p>Il Master non ti ha ancora aggiunto alla sessione!</p>
            <p>Attendi che il Master ti aggiunga come personaggio.</p>
        `;
        return;
    }
    
    document.getElementById('playerName').textContent = character.name;
    
    document.getElementById('characterInfo').innerHTML = `
        <div class="hp-display">
            <h3>HP: ${character.hp}/${character.maxHp}</h3>
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${(character.hp/character.maxHp)*100}%"></div>
            </div>
        </div>
    `;
    
    // Abilità
    const abilitiesDiv = document.getElementById('abilitiesList');
    abilitiesDiv.innerHTML = '';
    
    if(character.abilities) {
        character.abilities.forEach((ability, index) => {
            const btn = document.createElement('button');
            btn.className = `ability-btn ${ability.level === 3 ? 'level-3' : ''}`;
            btn.textContent = `${ability.name} (Lvl ${ability.level})`;
            
            if(ability.level === 3 && ability.locked) {
                btn.disabled = true;
                btn.title = "Richiedi autorizzazione al Master";
            }
            
            if(ability.cooldown > 0) {
                btn.disabled = true;
                btn.textContent += ` ⏳${ability.cooldown}`;
            }
            
            btn.onclick = () => useAbility(index);
            abilitiesDiv.appendChild(btn);
        });
    }
    
    // Inventario
    const inventoryDiv = document.getElementById('inventoryList');
    inventoryDiv.innerHTML = '';
    
    if(character.inventory && character.inventory.length > 0) {
        character.inventory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <strong>${item.name}</strong>
                <span>${item.description || ''}</span>
            `;
            inventoryDiv.appendChild(div);
        });
    } else {
        inventoryDiv.innerHTML = '<p>L\'inventario è vuoto</p>';
    }
}

// Usa abilità
function useAbility(abilityIndex) {
    const character = findMyCharacter();
    if(!character || !character.abilities) return;
    
    const ability = character.abilities[abilityIndex];
    
    if(ability.level === 3) {
        if(ability.locked) {
            requestAbility(abilityIndex);
            return;
        }
        if(ability.cooldown > 0) {
            alert(`Abilità in cooldown! Rimangono ${ability.cooldown} turni`);
            return;
        }
    }
    
    // Aggiungi alla chat
    if(!sessionData.chat) sessionData.chat = [];
    sessionData.chat.push({
        type: 'ability',
        from: character.name,
        ability: ability.name,
        timestamp: Date.now(),
        message: `⚡ ${character.name} usa ${ability.name}!`
    });
    
    // Imposta cooldown per abilità livello 3
    if(ability.level === 3) {
        ability.cooldown = 3; // 3 turni di cooldown
    }
    
    // Salva
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
    renderCharacter();
    renderChat();
}

// Richiedi abilità livello 3
function requestAbility(abilityIndex) {
    const character = findMyCharacter();
    if(!character) return;
    
    // Aggiungi richiesta alla chat
    sessionData.chat.push({
        type: 'request',
        from: character.name,
        request: 'ability',
        abilityIndex: abilityIndex,
        timestamp: Date.now(),
        message: `🔓 ${character.name} richiede di usare un'abilità di livello 3!`
    });
    
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
    
    document.getElementById('requestStatus').innerHTML = `
        <p class="success">✅ Richiesta inviata al Master!</p>
    `;
    
    setTimeout(() => {
        document.getElementById('requestStatus').innerHTML = '';
    }, 3000);
}

// Render chat
function renderChat() {
    const container = document.getElementById('playerChat');
    container.innerHTML = '';
    
    if(!sessionData.chat) return;
    
    sessionData.chat.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.from === 'Master' ? 'master-message' : ''}`;
        
        if(msg.type === 'item') {
            div.innerHTML = `<strong>🎁 ${msg.message}</strong>`;
        } else if(msg.type === 'ability') {
            div.innerHTML = `<strong>⚡ ${msg.message}</strong>`;
        } else if(msg.type === 'request') {
            div.innerHTML = `<strong>🔓 ${msg.message}</strong>`;
        } else {
            div.innerHTML = `<strong>${msg.from}:</strong> ${msg.message}`;
        }
        
        container.appendChild(div);
    });
    
    container.scrollTop = container.scrollHeight;
}

// Invia messaggio
function sendPlayerMessage() {
    const input = document.getElementById('playerMessage');
    const message = input.value.trim();
    
    if(!message) return;
    
    if(!sessionData.chat) sessionData.chat = [];
    sessionData.chat.push({
        type: 'message',
        from: playerData.name,
        message: message,
        timestamp: Date.now()
    });
    
    input.value = '';
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
    renderChat();
}

// Auto-aggiornamento
setInterval(() => {
    const storedData = JSON.parse(localStorage.getItem('sessionData'));
    if(storedData && JSON.stringify(storedData) !== JSON.stringify(sessionData)) {
        sessionData = storedData;
        renderCharacter();
        renderChat();
    }
}, 2000);

// Inizializza
window.onload = function() {
    if(!sessionCode || !playerData) {
        alert('Sessione non valida!');
        window.location.href = 'index.html';
        return;
    }
    
    renderCharacter();
    renderChat();
};