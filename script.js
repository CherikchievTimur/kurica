let localDeckId = null;//localStorage.getItem("deckId");

/* ---------------------------------------- */

const keys = ["0", "1", "2", "3", "4", "5" ,"6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H"];

let isMusic = true;
let isGame = false;

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

const newGame1 = async () => {
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

/* удалить всех играковв */

const removePlayers = () => players.splice(0, players.length);

/* вышедший игрок */

const setPlayerFinished = (player) => player.finished = ++finished;

/* передать карты игроку */
const addCardsOnDeckToPlayer = (player) => player.cards.push(...cardsOnDesk);

/* jkjjk */
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

const onClickNewGame1 = () => {
    console.log("New Game");

    newGame1();

    console.log(players);
}

const onClickNextStep = () => {
    console.log("Next Step");

    //console.log(nextStep());
    gameTick();
}


const test = () => alert("hello")

/* ---------------------------------------- */


const onClickNewGame = () => {
    newGameWindow();
}

const createElement = (tag, properties = {} ) => {
    const element = document.createElement(tag);

    for (let property in properties)
        element[property] = properties[property];

    return element;
}

const onClickAddPlayer = () => {
    const playerItem = createElementPlayerItem();
    const playersList = document.querySelector(".players-list");

    playersList.append(playerItem);
}

const newGameWindow = () => {

    /* созаем кнопки */
    const addPlayer = createElement("a", properties = { 
        className: "menu-link add-player", 
        href: "#",
        innerHTML: "<i class='fa-solid fa-plus'></i> Add player",
        onclick: onClickAddPlayer
     });
    
    /*const addPlayer = document.createElement("a");
    addPlayer.href = "#";
    addPlayer.className = "menu-link add-player";
    addPlayer.innerHTML = "<i class='fa-solid fa-plus'></i> Add player";
    addPlayer.onclick = onClickAddPlayer;*/

    const startGame = document.createElement("a");
    startGame.href = "#";
    startGame.className = "menu-link start";
    startGame.innerHTML = "<i class='fa-solid fa-play'></i> Start game";
    startGame.onclick = test;

    // /* создаем игроков по умолчанию */
    const players = createElementPlayersList();

    /* добавляем элимениты на div */
    const divButtons = document.createElement("div");
    divButtons.append(addPlayer, startGame);

    const windowPlayers = document.createElement("div");
    windowPlayers.className = "window-players";
    windowPlayers.append(divButtons, players);

    const windowNewGame = document.createElement("div");
    windowNewGame.className = "window-new-game";
    windowNewGame.append(windowPlayers);

    const window = document.createElement("div");
    window.className = "window";
    window.append(windowNewGame);

    const main = document.querySelector(".main");
    main.append(window);
}

const getRandPlayerIco = () => {
    const randInt = (~~(Math.random() * 100)) % 29;

    return `img/${randInt}.png`;
}

const onClickPlayerIco = (e) => {
    const img = getRandPlayerIco();

    console.log(img);

    e.img = img;
}

const isUseKey = (key) => players.find((player) => player.key === key);

const getRandPlayerKey = () => {
    let key = ``;

    do {
        const randInt = (~~(Math.random() * 100)) % (keys.length - 1);
        key = keys[randInt];
    } while (isUseKey(key));

    return key;
}

const createElementPlayersList = () => {
    const players = document.createElement("ul");
    players.className = "players-list";

    for (let i = 0; i < playersCount; ++i) {
        const playerItem = createElementPlayerItem();
        players.append(playerItem);
    }

    return players;
}

const createElementPlayerItem = () =>{
    const player = createElementPlayer();

    const playerItem = document.createElement("li");
    playerItem.className = "player-item";
    playerItem.append(player);

    return playerItem;
}

const createElementPlayer = () => {
    const playerIco = createElementPlayerIco();
    const playerName = createElementPlayerName();
    const playerKey = createElementPlayerKey();

    const player = document.createElement("div");
    player.className = "player";
    player.append(playerIco, playerName, playerKey);

    return player;
}

const createElementPlayerIco = () => {
    const playerIco = document.createElement("img");
    
    playerIco.className = "player-ico";
    playerIco.src = getRandPlayerIco();
    playerIco.alt = "Player";
    playerIco.onclick = onClickPlayerIco;

    return playerIco;
}

const createElementPlayerName = () => {
    const playerName = document.createElement("input");

    playerName.type = "text";
    playerName.className = "player-name";
    playerName.name = `player-name-${players.length}`;
    playerName.id = `player-name-${players.length}`;
    playerName.placeholder = "Enter key...";
    playerName.value = `Player${players.length}`;
    //playerkey.oninput = onInputKey;

    const playerKeyItem = document.createElement("div");
    playerKeyItem.className = "player-name-item";
    playerKeyItem.append(playerName);

    return playerKeyItem;
}

const createElementPlayerKey = () => {
    const playerKey = document.createElement("input");

    playerKey.type = "text";
    playerKey.className = "player-key";
    playerKey.name = `player-key-${players.length}`;
    playerKey.id = `player-key-${players.length}`;
    playerKey.placeholder = "Enter key...";
    playerKey.value = getRandPlayerKey();
    playerKey.maxLength = 1;

    const playerKeyItem = document.createElement("div");
    playerKeyItem.className = "player-key-item";
    playerKeyItem.append(playerKey);

    return playerKeyItem;
}


/* ---------------------------------------- */

const onClickMusic = () =>{
    const aMusic = document.querySelector(".a-volume");

    if(isMusic)
        aMusic.className = 'fa-solid fa-volume-xmark a-volume';
    else
        aMusic.className = 'fa-solid fa-volume-high a-volume';

    isMusic = !isMusic;
}