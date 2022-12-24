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
let deck = [];
let stackContainers = [];
let playContainers = [];
let pileStacks = [[], [], [], [], [], [], []];
let discards = [];
let playStacks = [[], [], [], []];

const deckPile = document.getElementById("deck-pile");
const deckPileDisplay = document.getElementById("deck-pile-display");
const discardPile = document.getElementById("discard-pile");

deckPile.addEventListener("click", flipCard);

for (let i = 0; i <= 6; i++)
  stackContainers.push(document.getElementById("stack" + i));

for (let i = 0; i <= 3; i++)
  playContainers.push(document.getElementById("play-stack" + i));

class Card {
  constructor(rank, suit, id) {
    this.rank = rank;
    this.suit = suit;
    this.id = id;
    this.faceUp = false;
  }

  in(array) {
    return array.indexOf(this) != -1;
  }

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
  gameOver = false;
  buildDeck();
  shuffleDeck();
  dealGame();
  render();
}

function restartGame() {}

function buildDeck() {
  let id = 0;
  for (let rank of ranks)
    for (let suit of suits) deck.push(new Card(rank, suit, id++));
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
  for (let pile = 0; pile < pileStacks.length; pile++) {
    let card = deck.pop();
    card.faceUp = true;
    pileStacks[pile].push(card);
    for (
      let pileToRight = pile + 1;
      pileToRight < pileStacks.length;
      pileToRight++
    ) {
      let card = deck.pop();
      pileStacks[pileToRight].push(card);
    }
  }
}

function flipCard() {
  if (deck.length == 0) {
    deck = discards;
    discards = [];
  } else {
    let card = deck.shift();
    card.faceUp = true;
    discards.push(card);
  }
  render();
}

function moveCard(event) {
  if (gameOver) return;
  let cardID = event.target.id;
  let card;
  let stackContainingCard;

  if (discards.length != 0 && discards[discards.length - 1].id == cardID) {
    card = discards[discards.length - 1];
    stackContainingCard = discards;
  }
  for (let stack of playStacks)
    if (stack.length !== 0 && stack[stack.length - 1].id == cardID) {
      card = stack[stack.length - 1];
      stackContainingCard = stack;
    }
  for (let pile of pileStacks)
    for (let currentCard of pile)
      if (currentCard.id == cardID) {
        card = currentCard;
        stackContainingCard = pile;
      }

  tryToPlay(card, stackContainingCard);
  tryToMoveToStack(card, stackContainingCard);
  tryToTurnOver(card, stackContainingCard);
  render();
  checkWin();
}

function tryToPlay(card, stackContainingCard) {
  //first check that it's a faceup card and on top of it's stack, otherwise can't be played
  if (!card.faceUp || !onTop(card, stackContainingCard)) return;

  let playStack = playStacks[suits.indexOf(card.suit)];

  if (playStack.length == 0) {
    //special case
    if (card.rank == "A") {
      playStack.push(card);
      stackContainingCard.pop();
    }
  } else {
    let stackCard = playStack[playStack.length - 1];
    let cardRankSpot = ranks.indexOf(card.rank);
    let stackRankSpot = ranks.indexOf(stackCard.rank);
    if (cardRankSpot == stackRankSpot + 1) {
      playStack.push(card);
      stackContainingCard.pop();
    }
  }
}

function tryToMoveToStack(card, stackContainingCard) {
  if (!card.faceUp || !card.in(stackContainingCard)) return;

  //fix king shouldn't be separate...

  for (let stack of pileStacks) {
    if (stack.length == 0 && card.rank == "K") {
      moveStack(stack);
      return;
    } else if (stack.length != 0) {
      let cardInStack = stack[stack.length - 1];
      if (
        cardInStack.faceUp &&
        ranks.indexOf(card.rank) == ranks.indexOf(cardInStack.rank) - 1 &&
        !sameColor(card, cardInStack)
      ) {
        moveStack(stack);
        return;
      }
    }
  }

  function moveStack(stack) {
    {
      let cardPosition = stackContainingCard.indexOf(card);
      let toMove = stackContainingCard.slice(cardPosition);
      for (let card of toMove) stack.push(card);
      for (
        let index = stackContainingCard.length - 1;
        index >= cardPosition;
        index--
      ) {
        stackContainingCard.pop();
      }
      return;
    }
  }
}

function tryToTurnOver(card, stackContainingCard) {
  if (!card.faceUp && onTop(card, stackContainingCard)) card.faceUp = true;
}

function onTop(card, stack) {
  return stack.length != 0 && stack[stack.length - 1] == card;
}

function sameColor(card1, card2) {
  return (
    card1.suit == card2.suit ||
    suits.indexOf(card1.suit) + suits.indexOf(card2.suit) == 3
  ); //suit indeces are 0, 1, 2, 3, so 0 and 3 or 1 and 2
}

function checkWin() {
  if (
    playStacks.reduce((accumulator, stack) => accumulator + stack.length, 0) ==
    52
  ) {
    console.log("you win!");
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

//create a reset button, test for win

//improvements: sound, animation, drag / drop, etc.
