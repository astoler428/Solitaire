//clean up code by having a move function which moves a card from one stack to another
//previously verified it can be moved and then just execute - genral for all cards behind
//change card to have a data value of location set to deck, discard, stack#, pile# rather than looking for it
const suits = ["♣", "♦", "♥", "♠"];
const colors = ["red", "black"];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

let gameOver;
let deck;
let fullDeckInIDorder;
let stackContainers;
let playContainers;
let pileStacks;
let discards;
let playStacks;

const deckPile = document.getElementById("deck-pile");
const deckPileDisplay = document.getElementById("deck-pile-display");
const discardPile = document.getElementById("discard-pile");
const restartBtn = document.getElementById("restart");
const winLabel = document.getElementById("win-label");

deckPile.addEventListener("click", flipCard);
restartBtn.addEventListener("click", restartGame);

class Card {
  constructor(rank, suit, location, id) {
    this.rank = rank;
    this.suit = suit;
    this.location = location;
    this.id = id;
    this.faceUp = false;
  }

  onTop() {
    let stack = this.location;
    return stack[stack.length - 1] === this;
  }

  //render will call this for each card in one of the piles
  //display based on face up or face down

  getHTML() {
    let cardDiv = document.createElement("div");
    cardDiv.id = this.id;
    cardDiv.addEventListener("dblclick", moveCard);

    if (this.faceUp == true) {
      cardDiv.innerHTML = this.rank;
      cardDiv.classList.add("card");
      cardDiv.classList.add(
        this.suit === suits[1] || this.suit === suits[2] ? "red" : "black"
      );
      cardDiv.setAttribute("data-value", this.suit);
    } else {
      cardDiv.classList.add("back");
    }
    return cardDiv;
  }
}

startGame();

function startGame() {
  stackContainers = [];
  playContainers = [];
  //initializes arrays containing the html elements to be rendered
  for (let i = 0; i <= 6; i++)
    stackContainers.push(document.getElementById("stack" + i));

  for (let i = 0; i <= 3; i++)
    playContainers.push(document.getElementById("play-stack" + i));

  //these array store card objects that are in the piles
  pileStacks = [[], [], [], [], [], [], []];
  discards = [];
  playStacks = [[], [], [], []];

  gameOver = false;
  buildDeck();
  shuffleDeck();
  dealGame();
  render();
}

function restartGame() {
  winLabel.innerHTML = "";
  startGame();
}

function buildDeck() {
  deck = [];
  fullDeckInIDorder = [];

  let id = 0;
  for (let rank of ranks)
    for (let suit of suits) {
      let card = new Card(rank, suit, null, id++);
      deck.push(card);
      fullDeckInIDorder.push(card); //used to location cards by ID;
    }
}

function shuffleDeck() {
  for (let idx = deck.length - 1; idx > 0; idx--) {
    let swapIdx = Math.floor(Math.random() * (idx + 1));
    let temp = deck[idx];
    deck[idx] = deck[swapIdx];
    deck[swapIdx] = temp;
  }
}

function dealGame() {
  for (let pileNum = 0; pileNum < pileStacks.length; pileNum++) {
    let card = deck.pop();
    card.faceUp = true;
    pileStacks[pileNum].push(card);
    card.location = pileStacks[pileNum];
    for (
      let pileToRight = pileNum + 1;
      pileToRight < pileStacks.length;
      pileToRight++
    ) {
      let card = deck.pop();
      pileStacks[pileToRight].push(card);
      card.location = pileStacks[pileToRight];
    }
  }
}

//flips top card off deck and puts it in discard pile
//takes cards off front of deck array and adds to back of discard array so when deck is reset to discards, it's in order
function flipCard() {
  if (deck.length == 0) {
    deck = discards;
    discards = [];
  } else {
    let card = deck.shift();
    card.faceUp = true;
    discards.push(card);
    card.location = discards;
  }
  render();
}

function moveCard(event) {
  if (gameOver) return;
  let card = fullDeckInIDorder[event.target.id];
  console.log(card);

  //conditionally checking tryToMoveToStack only if tryToPlay is false
  !tryToPlay(card) && tryToMoveToStack(card);
  tryToTurnOver(card);
  render();
  checkWin();
}

function move(card, to) {
  let stackContainingCard = card.location;

  let cardPosition = stackContainingCard.indexOf(card);
  let toMove = stackContainingCard.slice(cardPosition);
  for (let card of toMove) {
    to.push(card);
    card.location = to;
  }
  for (
    let index = stackContainingCard.length - 1;
    index >= cardPosition;
    index--
  ) {
    stackContainingCard.pop();
  }
}

function tryToPlay(card) {
  //first check that it's a faceup card and on top of it's stack, otherwise can't be played
  if (!card.faceUp || !card.onTop()) return;

  let playStack = playStacks[suits.indexOf(card.suit)];

  if (playStack.length == 0) {
    //special case
    if (card.rank == "A") {
      move(card, playStack);
      return true;
    }
  } else {
    let stackCard = playStack[playStack.length - 1];
    let cardRankSpot = ranks.indexOf(card.rank);
    let stackRankSpot = ranks.indexOf(stackCard.rank);
    if (cardRankSpot == stackRankSpot + 1) {
      move(card, playStack);
      return true;
    }
  }
  return false;
}

function tryToMoveToStack(card) {
  if (!card.faceUp) return;

  for (let stack of pileStacks) {
    if (stack.length == 0 && card.rank == "K") {
      move(card, stack);
      return;
    } else if (stack.length != 0) {
      let cardInStack = stack[stack.length - 1];
      if (
        cardInStack.faceUp &&
        ranks.indexOf(card.rank) == ranks.indexOf(cardInStack.rank) - 1 &&
        !sameColor(card, cardInStack)
      ) {
        move(card, stack);
        return;
      }
    }
  }
}

function tryToTurnOver(card) {
  if (!card.faceUp && card.onTop()) card.faceUp = true;
}

function sameColor(card1, card2) {
  return (
    card1.suit == card2.suit ||
    suits.indexOf(card1.suit) + suits.indexOf(card2.suit) == 3
  ); //suit indeces are 0, 1, 2, 3, so 0 and 3 or 1 and 2 are same
}

function checkWin() {
  if (
    playStacks.reduce((accumulator, stack) => accumulator + stack.length, 0) ==
    52
  ) {
    winLabel.innerHTML = "You win!"; //change to variable and have render set label to variable
    gameOver = true;
  }
}
function render() {
  renderDeckAndDiscard();
  renderPlayStacks();
  renderPileStacks();
}

function renderPileStacks() {
  for (let stackNum = 0; stackNum < pileStacks.length; stackNum++) {
    stackContainers[stackNum].innerHTML = "";
    for (let cardNum = 0; cardNum < pileStacks[stackNum].length; cardNum++) {
      let cardHTML = pileStacks[stackNum][cardNum].getHTML();
      cardHTML.style.top = 35 * cardNum + "px";
      stackContainers[stackNum].appendChild(cardHTML);
    }
  }
}

function renderDeckAndDiscard() {
  if (deck.length == 0) {
    deckPile.innerHTML = "Click";
  }
  if (deck.length > 0 && deckPile.querySelector("deck-pile-display") == null)
    deckPile.appendChild(deckPileDisplay);
  if (discards.length == 0) discardPile.innerHTML = "";
  else discardPile.appendChild(discards[discards.length - 1].getHTML());
}

function renderPlayStacks() {
  for (let i = 0; i < playStacks.length; i++) {
    let stack = playStacks[i];
    if (stack.length != 0)
      playContainers[i].appendChild(stack[stack.length - 1].getHTML());
    else {
      playContainers[i].innerHTML = suits[i];
    }
  }
}

//comment the code - as this will be a project and I plan to keep improving it

//improvements: sound, animation, drag / drop, undo??? etc.
