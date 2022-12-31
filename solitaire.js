const suits = ["♣", "♦", "♥", "♠"];
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

const CARD_OVERLAP = 35;
let z = 10;
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

deckPile.addEventListener("click", drawFromDeck);
restartBtn.addEventListener("click", restartGame);

class Card {
  constructor(rank, suit, location, id) {
    this.rank = rank;
    this.suit = suit;
    this.location = location;
    this.id = id;
    this.faceUp = false;
    this.justFlipped = false;
    this.justMoved = null;
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
    cardDiv.addEventListener("dblclick", tryToMoveCard);

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
  //bug where the deck isn't getting displayed beacuse I need to reappend child of deck display
  winLabel.innerHTML = "";
  deckPile.innerHTML = "";
  deckPile.appendChild(deckPileDisplay);
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
function drawFromDeck() {
  if (deck.length == 0) {
    deck = discards;
    discards = [];
    if (deck.length != 0) animateDeckReset();
  } else {
    let card = deck.shift();
    card.faceUp = true;
    discards.push(card);
    card.location = discards;
    animateDeckFlip();
  }
  //render();
}

function tryToMoveCard(event) {
  if (gameOver) return;
  let card = fullDeckInIDorder[event.target.id];

  //conditionally checking tryToMoveToStack only if tryToPlay is false
  if (
    tryToPlay(card, event.target) ||
    tryToMoveToStack(card, event.target) ||
    tryToTurnOver(card)
  ) {
    render();
    checkWin();
  }
}

function tryToPlay(card, containerDiv) {
  //first check that it's a faceup card and on top of it's stack, otherwise can't be played
  if (!card.faceUp || !card.onTop()) return;

  let playStack = playStacks[suits.indexOf(card.suit)];

  if (playStack.length == 0) {
    //special case
    if (card.rank == "A") {
      move(card, playStack, containerDiv);
      return true;
    }
  } else {
    let stackCard = playStack[playStack.length - 1];
    let cardRankSpot = ranks.indexOf(card.rank);
    let stackRankSpot = ranks.indexOf(stackCard.rank);
    if (cardRankSpot == stackRankSpot + 1) {
      move(card, playStack, containerDiv);
      return true;
    }
  }
  return false;
}

function tryToMoveToStack(card, containerDiv) {
  if (!card.faceUp) return false;

  for (let stack of pileStacks) {
    if (stack.length == 0 && card.rank == "K") {
      move(card, stack, containerDiv);
      return true;
    } else if (stack.length != 0) {
      let cardInStack = stack[stack.length - 1];
      if (
        cardInStack.faceUp &&
        ranks.indexOf(card.rank) == ranks.indexOf(cardInStack.rank) - 1 &&
        !sameColor(card, cardInStack)
      ) {
        move(card, stack, containerDiv);
        return true;
      }
    }
  }
}

function move(card, to, containerDiv) {
  let stackContainingCard = card.location;

  let cardPosition = stackContainingCard.indexOf(card);
  let toMove = stackContainingCard.slice(cardPosition);
  for (index = 0; index < toMove.length; index++) {
    let card = toMove[index];
    to.push(card);
    card.location = to;
    let rect = containerDiv.getBoundingClientRect();
    card.justMoved = {
      x: rect.left,
      y: rect.top + index * CARD_OVERLAP,
    };
  }
  // for (let card of toMove) {
  //   to.push(card);
  //   card.location = to;
  //   card.justMoved = true;
  // }
  for (
    let index = stackContainingCard.length - 1;
    index >= cardPosition;
    index--
  ) {
    stackContainingCard.pop();
  }
}

function tryToTurnOver(card) {
  if (!card.faceUp && card.onTop()) {
    card.justFlipped = true;
    return true;
  }
  return false;
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
  renderPlayStacks();
  renderPileStacks();
  renderDiscard();
}

function renderPileStacks() {
  for (let stackNum = 0; stackNum < pileStacks.length; stackNum++) {
    stackContainers[stackNum].innerHTML = "";
    for (let cardNum = 0; cardNum < pileStacks[stackNum].length; cardNum++) {
      let card = pileStacks[stackNum][cardNum];
      let cardHTML = card.getHTML();
      let endTop = CARD_OVERLAP * cardNum;
      if (card.justMoved != null)
        animateCardMove(card, cardHTML, stackContainers[stackNum], endTop);
      else {
        cardHTML.style.top = endTop + "px";
        stackContainers[stackNum].appendChild(cardHTML);
        if (card.justFlipped) animateCardFlip(card, cardHTML);
      }
    }
  }
}

function renderPlayStacks() {
  for (let i = 0; i < playStacks.length; i++) {
    let stack = playStacks[i];
    if (stack.length != 0) {
      let card = stack[stack.length - 1];
      let cardHTML = card.getHTML();
      if (card.justMoved != null)
        animateCardMove(card, cardHTML, playContainers[i], 0);
      else playContainers[i].appendChild(stack[stack.length - 1].getHTML());
    } else {
      playContainers[i].innerHTML = suits[i];
    }
  }
}

function animateCardMove(card, cardHTML, containerDiv, endTop) {
  let newLocation = containerDiv.getBoundingClientRect();
  let deltaX = newLocation.left - card.justMoved.x;
  let deltaY = newLocation.top - card.justMoved.y;
  card.justMoved = null;

  containerDiv.style.zIndex = z++;

  let currentLeft = -1 * deltaX;
  let currentTop = -1 * deltaY;

  cardHTML.style.left = currentLeft + "px";
  cardHTML.style.top = currentTop + "px";

  containerDiv.appendChild(cardHTML);

  let numberOfSlides = 50;

  let leftSlide = deltaX / numberOfSlides;
  let topSlide = (endTop + deltaY) / numberOfSlides;

  let intervalID = setInterval(slide, 1);
  let steps = 0;
  function slide() {
    if (steps++ == numberOfSlides) clearInterval(intervalID);
    else {
      currentLeft += leftSlide;
      currentTop += topSlide;
      cardHTML.style.left = currentLeft + "px";
      cardHTML.style.top = currentTop + "px";
    }
  }
}

//need this for when I move a card from the discard...
function renderDiscard() {
  if (discards.length == 0) discardPile.innerHTML = "";
  else discardPile.appendChild(discards[discards.length - 1].getHTML());
}

//make more efficient by creating a slide function that takes in the necesssary conditions
//also move in to be inner functions
function animateDeckReset() {
  discardPile.innerHTML = "";

  //adjusting z index bc discard card is on top of deck before it slides
  discardPile.style.zIndex = "1";
  deckPile.style.zIndex = "2";

  let left = 110; //card width + column gap
  let intervalID = setInterval(slide, 1);
  deckPileDisplay.style.left = left + "px";
  deckPile.appendChild(deckPileDisplay);

  function slide() {
    if (left < 0) clearInterval(intervalID);
    else {
      deckPileDisplay.style.left = left + "px";
      left -= 1;
    }
  }
}

function animateDeckFlip() {
  if (deck.length == 0) {
    deckPile.innerHTML = "Click";
  }
  let discardCardHTML = discards[discards.length - 1].getHTML();

  discardPile.style.zIndex = "2";
  deckPile.style.zIndex = "1";

  let left = -110;
  let intervalID = setInterval(slide, 1);
  discardCardHTML.style.left = left + "px";
  discardPile.appendChild(discardCardHTML);

  function slide() {
    if (left > 0) clearInterval(intervalID);
    else {
      discardCardHTML.style.left = left + "px";
      left += 1;
    }
  }
}

function animateCardFlip(card, cardDiv) {
  let degrees = 0;
  rotate();

  function rotate() {
    if (degrees > 360) return;
    if (degrees == 90) {
      degrees = 270;
      card.faceUp = true;
      card.justFlipped = false; //can i move this earlier?
      let newCardDiv = card.getHTML();
      newCardDiv.style.top = cardDiv.style.top;
      newCardDiv.style.transform = "RotateY(" + degrees++ + "deg)";
      cardDiv.parentNode.replaceChild(newCardDiv, cardDiv);
      cardDiv = newCardDiv;
    } else cardDiv.style.transform = "RotateY(" + degrees++ + "deg)";
    setTimeout(() => rotate(), 1);
  }
}

/*
strange glitch where the bouding rect dimension are off by 1 px or so
clean up code
*/
