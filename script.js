let localDeckId = null;//localStorage.getItem("deckId");

/* ---------------------------------------- */

const player = {
    name: " ",
    key: "",
    finished: 0,
    cards: []
}

let finished = 0;
let previousPlayerId = -1;

let playersCount = 2;
const players = []


let isOnDeckSameCards = false;
let previousCard = {};
const cardsOnDesk = [];

const keyUpPlayersQueue = [];

const delay = 1000;
let nIntervId = null;

/* ---------------------------------------- */

const getDeckId = async () => {
    if(!localDeckId){
        const request = await fetch(`https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1`);
        const data = await request.json();

        localDeckId = data.deck_id;
    //    localStorage.setItem('deckId', localDeckId);
    }

    return localDeckId;
}

const getCards = async (count) => {
    const deckId = await getDeckId();

    const request = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    const data = await request.json();

    return data.cards;
}

const newGame = async () => {
    previousPlayerId = -1;
    previousCard = null;

    finished = 0;
    isOnDeckSameCards = false;
    
    removePlayers();
    await load6Players();

    removeCardsOnDeck();

    start();

    document.addEventListener("keyup", keyUp);
}

/* for test */
const load6Players = async () => {
    for(let i=0; i < playersCount; ++i){
        const tempPlayer = {...player};

        tempPlayer.name = `player-${i}`;
        tempPlayer.key = `${i}`;
        tempPlayer.cards = await getCards(2);

        players.push(tempPlayer);
    }
}

const removePlayers = () => players.splice(0, players.length);

const setPlayerFinished = (player) => player.finished = ++finished;

const addCardsOnDeckToPlayer = (player) => player.cards.push(...cardsOnDesk);

const getPlayersInGame = () => players.filter(player => !player.finished);

const getCurrentPlayerId = (players, previousPlayerId) => ++previousPlayerId % players;

const getCurrentCard = (player) => player.cards.shift();

const addCardOnDeck = (card) => cardsOnDesk.push(card);

const removeCardsOnDeck = () => cardsOnDesk.splice(0, cardsOnDesk.length);

const getPlayerByKey = (players, key) => players.find((player) => !player.finished && player.key === key);

const getLastKeyUpPlayer = () => keyUpPlayersQueue[keyUpPlayersQueue.length-1];

const addKeyUpPlayersQueue = (player) => {
    if (!getPlayerByKey(keyUpPlayersQueue, player.key))
        keyUpPlayersQueue.push(player);
}

/*const addKeyUpPlayersQueue = (key) => {
    const player = getPlayerByKey(players, key);
    
    if (player)
        if(!getPlayerByKey(keyUpPlayersQueue, player.key))
            keyUpPlayersQueue.push(player);
}*/

const isLastAndPrevCardsSame = () => {
    const countCardsOnDeck = cardsOnDesk.length;

    if (countCardsOnDeck < 2) return false;
    if (cardsOnDesk[countCardsOnDeck - 1].suit === cardsOnDesk[countCardsOnDeck - 2].suit) return true;

    return false;
}

const removeKeyUpPlayersQueue = () => keyUpPlayersQueue.splice(0, keyUpPlayersQueue.length);

const gameTick = () => {
    console.log("Next Step");
    
    let playersInGame = getPlayersInGame();

    console.log('players in game', playersInGame);

    /* есть игроки - игра продолжается */
    if (playersInGame.length > 0) {
        /* проверяем было ли совпадение карт на предыдущем шаге, если да то ждем нажатий кнопок от пользователей*/
        /* либо убрать условие и полностью останавливать ? */
        if (!isOnDeckSameCards){

            const currentPlayerId = getCurrentPlayerId(playersInGame.length, previousPlayerId);
            const currentCard = getCurrentCard(playersInGame[currentPlayerId]);

            /* проверяем есть ли карта у текущего игрока, если есть то кладем на стол */
            if(currentCard){
                /* кладем карту на стол */
                addCardOnDeck(currentCard);

                isOnDeckSameCards = isLastAndPrevCardsSame();

                /* проверяем на совпадение карты */
                if (isOnDeckSameCards) {
                    console.log("Same cards");
                    //stop();
                }
                else {
                    previousPlayerId = currentPlayerId;
                    previousCard = currentCard;
                }

                console.log('current player id', currentPlayerId);
                console.log('current card', currentCard);
                console.log('cards on deck', cardsOnDesk); 
            }
            /* у игрока больше нет карт - выводим игрока из игры */
            else {
                setPlayerFinished(playersInGame[currentPlayerId]);
                console.log('setPlayerFinished', currentPlayerId);

                playersInGame = getPlayersInGame();

                /*проверяем кол-во игроков в игре, если остался 1 игрок, останавливаем игру */
                if (playersInGame.length === 1) {
                    /* проверяем есть ли карты у игрока */
                    /* если есть, игрок проиграл */
                    
                    if(playersInGame[0].cards.length > 0){
                        console.log('game over - ', playersInGame[0]);
                    }
                    /* если карт нет - то ничья */
                    else {
                        console.log(`game draw`);
                    }

                    //stop();
                    setPlayerFinished(playersInGame[0]);
                }
            }            
        }
    }
    /* все игроки скинули карты, нет совпадений == ничья */
    else{
        console.log(`game draw`);
        //stop();
    }    
}

const start = () => {
    //if (!nIntervId)
    //    nIntervId = setInterval(gameTick, delay);
}

const stop = () => {
    //clearInterval(nIntervId);
    //nIntervId = null;
}

/* ---------------------------------------- */

const keyUp = (e) => {

    const player = getPlayerByKey(players, e.key);

    /* проверяем нажатую кнопку, принадлежит ли игроку */
    if(player){
        /* если на столе одинаковые масти карт */
        if (isOnDeckSameCards){
            addKeyUpPlayersQueue(player);

            const playersInGame = getPlayersInGame().length;
            const keysUpPlayers = keyUpPlayersQueue.length;

            if(playersInGame === keysUpPlayers){
                const lastPlayer = getLastKeyUpPlayer();
                
                addCardsOnDeckToPlayer(lastPlayer);
                removeCardsOnDeck();
                removeKeyUpPlayersQueue();                

                isOnDeckSameCards = false;

                console.log(players);
            }
        }
        /* игрок случайно нажал на кнопку, забирает все карты */
        else{        
            addCardsOnDeckToPlayer(player);
            removeCardsOnDeck();

            /* лог, убрать после отладки */
            console.log('players in game', getPlayersInGame());
        }
    }

    if (e.code == "ArrowRight") {
        gameTick();
    }

    console.log(keyUpPlayersQueue);
};

const onChangeCount = (e) => playersCount = e.target.value;

const onClickNewGame = () => {
    console.log("New Game");

    newGame();

    console.log(players);
}

const onClickNextStep = () => {
    console.log("Next Step");

    //console.log(nextStep());
    gameTick();
}






document.getElementById("addPlayer").addEventListener("click", function () {
    const playersDiv = document.getElementById("players");
    const numPlayers = playersDiv.children.length;

    const newPlayerDiv = document.createElement("div");
    const label = document.createElement("label");
    label.setAttribute("for", `player${numPlayers + 1}`);
    label.textContent = `Player ${numPlayers + 1}:`;

    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("id", `player${numPlayers + 1}`);
    input.setAttribute("placeholder", "Enter name");

    newPlayerDiv.appendChild(label);
    newPlayerDiv.appendChild(input);
    playersDiv.appendChild(newPlayerDiv);

    if (numPlayers >= 2) {
        const minusButton = document.createElement("button");
        minusButton.classList.add("minusButton");
        minusButton.textContent = "-";
        minusButton.addEventListener("click", function () {
            playersDiv.removeChild(newPlayerDiv);
        });
        newPlayerDiv.appendChild(minusButton);
    }
});
