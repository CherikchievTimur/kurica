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
        tempPlayer.cards = await getCards(6);

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

    console.log(`countCardsOnDeck - ${countCardsOnDeck}`);

    if (countCardsOnDeck < 2) return false;
    if (cardsOnDesk[countCardsOnDeck - 1].suit === cardsOnDesk[countCardsOnDeck - 2].suit) return true;

    return false;
}

const removeKeyUpPlayersQueue = () => keyUpPlayersQueue.splice(0, keyUpPlayersQueue.length);

const gameTick = () => {
    console.log("Next Step");
    
    const playersInGame = getPlayersInGame();
    const currentPlayerId = getCurrentPlayerId(playersInGame.length, previousPlayerId);

    if (playersInGame.length <= 1){
        //один игрок остался
        stop();
        console.log('stop game');
    }
    else if (!isOnDeckSameCards) {
        const currentCard = getCurrentCard(playersInGame[currentPlayerId]);

        if(currentCard){
            addCardOnDeck(currentCard);

            isOnDeckSameCards = isLastAndPrevCardsSame();

            if (isOnDeckSameCards)
            {
                console.log("Same cards");
                //stop();
            }
            else{
                previousPlayerId = currentPlayerId;
                previousCard = currentCard;
            }
        }/* у игрока закончились карты */
        else{
            setPlayerFinished(players[currentPlayerId]);   
            console.log('setPlayerFinished', currentPlayerId);
        }

        console.log('players in game', playersInGame);
        console.log('current player id', currentPlayerId);
        //console.log('current card', currentCard);
        //console.log('cards on deck', cardsOnDesk);        
    }
}

const start = () => {
    if (!nIntervId)
        nIntervId = setInterval(gameTick, delay);
}

const stop = () => {
    clearInterval(nIntervId);
    nIntervId = null;
}

/* ---------------------------------------- */

const keyUp = (e) => {

    const player = getPlayerByKey(players, e.key);

    if(player){
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
        else{        
            addCardsOnDeckToPlayer(player);
            removeCardsOnDeck();
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