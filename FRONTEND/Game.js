"use strict";
// cSpell:ignore 2vmin Leaderboard
import Grid from "/FRONTEND/Grid.js";
import Tile from "/FRONTEND/Tile.js";
import {makeRequest,editUser,initData,login,bestScores,loadGames,leaderBoard,createUser,logout,deleteUser} from "/FRONTEND/Users.js";

// const Url="http://localhost:3000";
const Url="https://fine-jade-oyster-ring.cyclic.app/";

export const gameBoard = document.getElementById("game-board");

export var grid;
export var gridCopy;



window.addEventListener("load", function(){
  if(document.firstElementChild.getAttribute("pag")=="board"){
    if(this.localStorage.token==undefined) this.window.location.href="/FRONTEND/login.html";
    this.window.newGame=newGame;
    this.window.logout = logout;
    this.window.bestScores=bestScores;
    this.window.loadGames=loadGames;
    this.window.leaderBoard=leaderBoard;
    this.window.saveGame=saveGame;
    this.window.loadGame=loadGame;
    this.window.bestScore=bestScore;
    this.window.editUser=editUser;
    this.window.deleteUser=deleteUser;
    initData();  
  }
  else{
    this.window.login=login;
    this.window.createUser=createUser;
    if(this.localStorage.token!=undefined) window.location.href = "/FRONTEND/board.html";
  }
});

window.addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
      e.preventDefault();
  }
}, false);

$("#modalSave").on("hidden.bs.modal",()=> {
  document.getElementById("saveName").value="";
});

$("#modalEdit").on("shown.bs.modal",()=>{
  document.getElementById("updateUsername").value=document.getElementById("username").innerHTML.substring(10);
  document.getElementById("updateEmail").value=document.getElementById("email").innerHTML.substring(7);
});

$("#modalCreate").on("shown.bs.modal",()=>{
  document.getElementById("newUsername").value="";
  document.getElementById("newEmail").value="";
  document.getElementById("newPassword").value="";
  document.getElementById("confPassword").value="";
});

$("#showBoard").on("hidden.bs.modal",()=>{
  grid=gridCopy;
  setupInput();
});

async function bestScore(index){
  try{
    let best= await makeRequest("GET","/api/users/bestScores?index="+index,[
    {"name":"x-auth-user","value":localStorage.token},
    {"name":"Content-Type","value":"application/json"},
  ]);
  best=JSON.parse(best);
  let board=document.getElementById("bestGame-board");
  let children=board.children;
  for(let i=children.length-1;i>=0;i--){
    board.removeChild(children[i]);
  }
  gridCopy=grid;
  grid = new Grid(board, best.board);

  document.getElementById("bestScore").innerHTML="Score: "+best.score;

  }catch(e){
    console.log(e);
    alert(e.status + ': ' + e.response);
  }
}

async function loadGame(index){
  let save= await makeRequest("GET","/api/users/saveGames?index="+index,[
    {"name":"x-auth-user","value":localStorage.token},
    {"name":"Content-Type","value":"application/json"},
    {"name": "index","value":index}
  ]);
  save=JSON.parse(save);
  document.getElementById("gameOver").style.display="none";
  gameBoard.classList.remove("over");
  let children=gameBoard.children;
  for(let i=children.length-1;i>=0;i--){
    gameBoard.removeChild(children[i]);
  }
  grid = new Grid(gameBoard, save.board);

  document.getElementById("score").innerHTML="Score: "+save.score;
  $('#loadGame').modal('hide');
  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    gameOver();
  }
  else setupInput()
}

function newGame(){
  document.getElementById("gameOver").style.display="none";
  gameBoard.classList.remove("over");
  let children=gameBoard.children;
  for(let i=children.length-1;i>=0;i--){
    gameBoard.removeChild(children[i]);
  }
  grid = new Grid(gameBoard);

  document.getElementById("score").innerHTML="Score: 0";

  grid.randomEmptyCell().tile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = new Tile(gameBoard);

  setupInput()
}

async function gameOver(){
  gameBoard.classList.add("over");
  document.getElementById("gameOver").style.display="flex";
  let bestSave = {
    "board": grid.grid,
    "score": parseInt(document.getElementById("score").innerHTML.substring(7))
  }

  try {
    await makeRequest("PUT", "/api/users/bestScores", [
      { "name": "x-auth-user", "value": localStorage.token },
      { "name": "Content-Type", "value": "application/json" }
    ], bestSave);

  } catch (e) {
    console.log(e);
    alert(e.status + ': ' + e.response);
  }
}

async function saveGame(save=false){
  let flag=true;
  let children=document.getElementById("loads").children;
  for(let i=0; i<children.length;i++){
    if(children[i].getAttribute("saveName")==document.getElementById("saveName").value){
      flag=false;
      break;
    }
  }
  save=save? true: document.getElementById("loads").children.length<5 && flag;
  if(save){
    let gameSave={
      "name": document.getElementById("saveName").value,
      "board": grid.grid,
      "score": parseInt(document.getElementById("score").innerHTML.substring(7))
    }
    try {
      let action= await makeRequest("PUT","/api/users/saveGames",[
        {"name":"x-auth-user","value":localStorage.token},
        {"name":"Content-Type","value":"application/json"}
      ], gameSave);
      alert(action);
      $('#modalSave').modal('hide');
    } catch (e) {
      console.log(e);
      alert(e.status + ': ' + e.response);
    }
  }else{
    if(!flag) document.getElementById("warningMessage1").innerHTML="Are you sure you want to replace "+document.getElementById("saveName").value;
    else {
      document.getElementById("warningMessage1").innerHTML="Are you sure you want to delete your oldest save game? (" + children[0].getAttribute("saveName")+")";
    }
    $('#modalWarning').modal({ show:true });
  }
}

function setupInput() {
  window.addEventListener("keydown", handleInput, { once: true });
}

async function handleInput(e) {
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      await moveUp();
      break;
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      await moveDown();
      break;
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      await moveLeft();
      break;
    case "ArrowRight":
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      await moveRight();
      break;
    default:
      setupInput();
      return;
  }

  grid.cells.forEach(cellArr => cellArr.forEach(cell=>cell.mergeTiles()));

  let newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;

  if(parseInt(document.getElementById("score").innerHTML.substring(7))> parseInt(document.getElementById("best").innerHTML.substring(6))){
    document.getElementById("best").innerHTML="Best: "+parseInt(document.getElementById("score").innerHTML.substring(7))
  }
  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransition(true).then(() => {
      gameOver();
    })
    return;
  }

  setupInput();
}

function moveUp() {
  return slideTiles(grid.cellsByColumn);
}

function moveDown() {
  return slideTiles(grid.cellsByColumn.map(column => [...column].reverse()));
}

function moveLeft() {
  return slideTiles(grid.cellsByRow);
}

function moveRight() {
  return slideTiles(grid.cellsByRow.map(row => [...row].reverse()));
}

function slideTiles(cells) {
  return Promise.all(
    cells.flatMap(group => {
      let promises = [];
      for (let i = 1; i < group.length; i++) {
        let cell = group[i];
        if (cell.tile == null) continue;
        let lastValidCell;
        for (let j = i - 1; j >= 0; j--) {
          let moveToCell = group[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }

        if (lastValidCell != null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile != null) {
            lastValidCell.mergeTile = cell.tile;
          } else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }
      return promises;
    })
  )
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsByColumn.map(column => [...column].reverse()));
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByRow.map(row => [...row].reverse()));
}

function canMove(cells) {
  for(let i=0; i<cells.length; i++){
    for(let j=0; j<cells[i].length; j++){
      if (j == 0) continue;
      if (cells[i][j].tile == null) continue;
      let moveToCell = cells[i][j-1];
      if(moveToCell.canAccept(cells[i][j].tile)) return true;
    }
  }
  return false;
}
