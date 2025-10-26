import { state, checkRostersComplete } from './state.js';
import { render } from './ui.js';
import { openStatsModal, openServeModal, openLineupModal } from './modals.js';

// Exporta la función para usarla en main.js
export { checkRostersComplete };

/**
 * Devuelve un array con los objetos de los 6 jugadores que están en la cancha para un equipo.
 * Si la formación inicial no está cargada, devuelve un array vacío.
 * @param {object} team - El objeto del equipo (teamA o teamB del estado).
 * @returns {Array<object>} - Array de objetos de jugador o array vacío.
 */
export function getPlayersOnCourt(team) { 
    if (!team || !team.startingSix || team.startingSix.includes(-1)) {
        return []; // Devuelve vacío si no hay equipo o la formación no está cargada
    }
    return team.startingSix.map(rosterIndex => team.roster[rosterIndex]); 
}

/**
 * Realiza la rotación de un equipo. Mueve el primer jugador de la formación al final.
 * Importante: No llama a render() directamente, eso lo hace la función que la invoca.
 * @param {string} teamId - El ID del equipo ('A' o 'B').
 */
export function rotateTeam(teamId) { 
    const team = state[`team${teamId}`];
    // Asegura que la formación esté cargada antes de rotar
    if (!team || !team.startingSix || team.startingSix.includes(-1)) return; 
    const firstPlayerIndex = team.startingSix.shift(); 
    team.startingSix.push(firstPlayerIndex); 
}

/**
 * Inicia el proceso de sumar o restar un punto a un equipo.
 * Valida si se puede iniciar el partido (saque inicial definido).
 * Abre el modal de estadísticas si se suma un punto.
 * @param {string} teamId - El ID del equipo ('A' o 'B').
 * @param {number} points - El número de puntos a cambiar (normalmente 1 o -1).
 */
export function applyScoreChange(teamId, points) { 
    // Verifica si el saque inicial ya fue seleccionado para el primer set.
    if (!state.initialServeTeamId && state.setScores.length === 0) {
        alert("Presiona el botón de la pelota para seleccionar qué equipo saca primero.");
        return;
    }
    // Verifica si la formación inicial ya se cargó
    if (state.teamA.startingSix.includes(-1) || state.teamB.startingSix.includes(-1)){
        alert("Por favor, carga la formación inicial de ambos equipos para comenzar el set.");
        openLineupModal(); // Abre el modal de formación si falta
        return;
    }

    const team = state[`team${teamId}`];
    if (team.score + points < 0) return; // Evita puntuaciones negativas.

    if (points > 0) {
        openStatsModal(teamId); // Abre modal para registrar la estadística.
    } else {
        team.score += points; // Resta el punto (corrección).
        render(); // Actualiza la UI.
    }
}

/**
 * Actualiza el marcador, el estado del saque y comprueba si el set terminó,
 * después de que se ha registrado una estadística de punto.
 * @param {string} teamId - El ID del equipo que anotó el punto.
 */
export function updateScoreAfterStat(teamId) { 
    const team = state[`team${teamId}`];
    const otherTeamId = teamId === 'A' ? 'B' : 'A';
    const otherTeam = state[`team${otherTeamId}`];
    const recoveredServe = otherTeam.serving; // Comprueba si el equipo que anotó recuperó el saque.
    
    team.score++; // Suma el punto.

    if (recoveredServe) {
        rotateTeam(teamId); // Si recuperó el saque, rota.
    }
    // Asigna el saque al equipo que anotó.
    team.serving = true;
    otherTeam.serving = false;
    
    const setWasWon = checkSetWin(); // Comprueba si el set o partido terminó con este punto.
    if (!setWasWon) {
        render(); // Si el set no terminó, simplemente actualiza la UI.
    }
}

/**
 * Comprueba si algún equipo ha alcanzado la puntuación para ganar el set.
 * @returns {boolean} - True si un equipo ganó el set, de lo contrario False.
 */
function checkSetWin() { 
    const { teamA, teamB, config } = state;
    // Condiciones para ganar: alcanzar el umbral Y tener al menos 2 puntos de diferencia.
    const aWins = teamA.score >= config.winThreshold && teamA.score >= teamB.score + 2;
    const bWins = teamB.score >= config.winThreshold && bWins.score >= teamA.score + 2;

    if (aWins) { 
        teamA.sets++; // Incrementa los sets ganados.
        logEvent(`Fin del Set ${teamA.sets + teamB.sets}. Resultado: ${teamA.score}-${teamB.score}`);
        resetScoresForNewSet(teamA, teamB); // Prepara el estado para el siguiente set.
        return true; // Indica que el set terminó.
    }
    if (bWins) { 
        teamB.sets++;
        logEvent(`Fin del Set ${teamA.sets + teamB.sets}. Resultado: ${teamB.score}-${teamA.score}`);
        resetScoresForNewSet(teamB, teamA);
        return true;
    }
    return false; // El set continúa.
}

/**
 * Registra el uso de un tiempo muerto por parte de un equipo.
 * @param {string} teamId - ID del equipo ('A' o 'B').
 * @param {string} type - Tipo de control (actualmente solo 'timeout').
 */
export function useControl(teamId, type) { 
    const team = state[`team${teamId}`];
    // Verifica si es un tiempo muerto y si aún quedan disponibles.
    if (type === 'timeout' && team.timeouts < state.config.maxTimeouts) {
        team.timeouts++; // Incrementa el contador.
        logEvent(`Tiempo solicitado por ${team.name}.`); // Registra el evento.
    }
    render(); // Actualiza la UI.
}

/**
 * Cambia la variable 'sidesSwapped' en el estado, lo que invierte
 * qué equipo se muestra a la izquierda y cuál a la derecha en la UI.
 */
export function swapSides() { 
    state.sidesSwapped = !state.sidesSwapped;
    render();
}

/**
 * Prepara el estado para el inicio de un nuevo set.
 * Guarda el resultado del set anterior, resetea marcadores y contadores,
 * determina quién saca y cambia de lado (si no es set decisivo).
 * Finalmente, abre el modal para cargar la formación inicial del nuevo set.
 * @param {object} winner - El objeto del equipo que ganó el set.
 * @param {object} loser - El objeto del equipo que perdió el set.
 */
function resetScoresForNewSet(winner, loser) { 
    state.setScores.push({ winner: winner.id, score: `${winner.score}-${loser.score}` });
    ['teamA', 'teamB'].forEach(key => {
        const team = state[key];
        team.score = 0;
        team.timeouts = 0;
        team.subs = 0;
        team.liberoState = { activeLiberoRosterIndices: [] };
        team.roster.forEach(p => p.subPartnerRosterIndex = null);
        team.startingSix = [-1,-1,-1,-1,-1,-1];
    });
    const nextServer = state.firstServeOfSetId === 'A' ? 'B' : 'A';
    state.firstServeOfSetId = nextServer;
    state.teamA.serving = nextServer === 'A';
    state.teamB.serving = nextServer === 'B';
    
    const isDecidingSet = (state.teamA.sets + state.teamB.sets) === (state.config.setsToWin * 2 - 2); 
    if (!isDecidingSet) {
        swapSides();
    }
    
    openLineupModal();
}

/**
 * Reinicia el estado del set actual sin sumar puntos de set.
 * Útil si hubo un error y se necesita empezar el set de nuevo.
 */
export function resetCurrentSet() { 
    const currentSetIndex = state.teamA.sets + state.teamB.sets;
    state.teamA.score = 0;
    state.teamB.score = 0;
    state.teamA.timeouts = 0;
    state.teamB.timeouts = 0;
    state.teamA.subs = 0;
    state.teamB.subs = 0;
    state.teamA.liberoState = { activeLiberoRosterIndices: [] };
    state.teamB.liberoState = { activeLiberoRosterIndices: [] };
    state.teamA.statsBySet[currentSetIndex] = [];
    state.teamB.statsBySet[currentSetIndex] = [];
    ['teamA', 'teamB'].forEach(key => { 
        state[key].roster.forEach(p => p.subPartnerRosterIndex = null); 
    });
    state.teamA.serving = state.firstServeOfSetId === 'A';
    state.teamB.serving = state.firstServeOfSetId === 'B';
    render(); 
}

// --- LÓGICA DE REGISTRO Y EXPORTACIÓN ---

/**
 * Añade un mensaje al registro de eventos del partido (matchLog).
 * @param {string} message - El mensaje descriptivo del evento.
 */
export function logEvent(message) {
    state.matchLog.push(message);
}

/**
 * Genera un mensaje descriptivo para una estadística de punto y lo añade al log.
 * @param {object} stat - El objeto de estadística guardado en commitStat.
 */
export function logStat(stat) {
    // Determina el equipo que anotó y el equipo/jugador responsable.
    const scoringTeam = state[stat.teamId === 'A' ? 'teamA' : 'teamB'];
    const responsibleTeam = state[stat.responsibleTeamId === 'A' ? 'teamA' : 'teamB'];
    // Asegura que el índice del jugador sea válido antes de acceder al roster.
    if (stat.playerRosterIndex === null || stat.playerRosterIndex < 0 || stat.playerRosterIndex >= responsibleTeam.roster.length) {
        console.error("Índice de jugador inválido en logStat:", stat);
        return; 
    }
    const player = responsibleTeam.roster[stat.playerRosterIndex];
    if (!player) {
        console.error("Jugador no encontrado en logStat:", stat);
        return;
    }
    
    // Mapea la clave de la acción a un texto descriptivo.
    const actionText = {
        saque: 'Saque', 
        ataque: 'Ataque', 
        bloqueo: 'Bloqueo', 
        recepcion: 'Recepción', 
        defensa: 'Defensa'
    }[stat.action] || 'Acción desconocida'; // Añade fallback

    const pointDescription = `${stat.type === 'acierto' ? 'Acierto' : 'Error'} de ${actionText} de #${player.number} ${player.name}.`;
    logEvent(`Punto ${scoringTeam.name} (${stat.score}). ${pointDescription}`);
}


/**
 * Genera y descarga el resumen del partido en formato PDF.
 * Utiliza la librería jsPDF.
 */
export function exportPDF() {
    // Asegura que jsPDF esté disponible (cargado desde el CDN).
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert("Error: No se pudo cargar la librería para generar PDF (jsPDF).");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); // Crea un nuevo documento PDF.

    // Determina quién ganó y quién perdió el partido.
    const winner = state.teamA.sets > state.teamB.sets ? state.teamA : state.teamB;
    const loser = winner.id === 'A' ? state.teamB : state.teamA;

    // --- Encabezado del PDF ---
    doc.setFontSize(22);
    doc.text(`${winner.name} vs ${loser.name}`, 105, 20, { align: 'center' }); 

    doc.setFontSize(16);
    doc.text(`Resultado Final: ${winner.sets} - ${loser.sets}`, 105, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Ganador: ${winner.name}`, 105, 40, { align: 'center' });

    // --- Resultados Parciales ---
    doc.setFontSize(14);
    doc.text('Resultados Parciales', 20, 60);
    doc.setFontSize(10);
    state.setScores.forEach((s, i) => {
        // Asegura que 'score' exista y sea un string antes de dividirlo.
        const scoreString = typeof s.score === 'string' ? s.score : '0-0'; 
        // Ajusta el orden del marcador si es necesario.
        const score = s.winner === winner.id ? scoreString : scoreString.split('-').reverse().join('-');
        doc.text(`Set ${i+1}: ${score}`, 20, 70 + (i * 7)); // Añade cada resultado de set.
    });

    // --- Registro de Eventos ---
    let y = 100; // Posición vertical inicial para el log.
    doc.setFontSize(14);
    doc.text('Registro de Eventos', 20, y);
    doc.setFontSize(8); // Fuente más pequeña para el detalle.
    y += 10;

    state.matchLog.forEach(event => {
        // Divide el texto largo en múltiples líneas si excede el ancho de la página.
        const splitEvent = doc.splitTextToSize(event, 170); // 170 es el ancho aproximado en mm.
        
        splitEvent.forEach(line => {
             if (y > 280) { // Si el texto supera el margen inferior, crea una nueva página.
                doc.addPage();
                y = 20; // Resetea la posición vertical en la nueva página.
            }
            doc.text(line, 20, y); // Añade la línea al PDF.
            y += 4; // Incrementa la posición vertical (ajustado para fuente 8).
        });
    });

    // Guarda el archivo PDF con un nombre descriptivo.
    doc.save(`Partido-${winner.name}-vs-${loser.name}.pdf`);
}

