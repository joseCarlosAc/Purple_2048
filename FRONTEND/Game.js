"use strict";
// cSpell:ignore 2vmin
import Grid from "./Grid.js";
import Tile from "./Tile.js";

const gameBoard = document.getElementById("game-board");

var grid;
function logout(){
  delete localStorage.token;
  delete localStorage.id;
  window.location.href ="login.html";
}

window.addEventListener("load", function(){
  if(this.localStorage.token==undefined) this.window.location.href="login.html";
  if(document.firstElementChild.getAttribute("pag")=="board"){
    this.window.newGame=newGame;
    this.window.logout = logout;
    this.window.bestScores=bestScores;
    this.window.loadGames=loadGames;
    this.window.leaderBoard=leaderBoard;
    this.window.saveGame=saveGame;
    this.window.loadGame=loadGame;
    this.window.bestScore=bestScore;
    initData();  
  }
});

window.addEventListener("keydown", function(e) {
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
      e.preventDefault();
  }
}, false);

function makeRequest(method, url, headers=undefined, body=undefined) {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if(headers!=undefined){
      headers.forEach(item=>{
        xhr.setRequestHeader(item.name,item.value);
      });
    }
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          response: xhr.response
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        response: xhr.response
      });
    };
    if(body==undefined) xhr.send();
    else {
      xhr.send(JSON.stringify(body));
    }
  });
}

async function initData(){
  try{
    let user= await makeRequest("GET","http://localhost:3000/api/users",[
      {"name":"x-auth-user","value":localStorage.token},
      {"name":"Content-Type","value":"application/json"}
    ]);
    user=JSON.parse(user);
    document.getElementById("username").innerHTML=("Username: "+ user.username);
    document.getElementById("email").innerHTML=("Email: "+ user.email);
    if(user.bests.length==0){
      document.getElementById("best").innerHTML="Best: 0";
    }
    else{
      document.getElementById("best").innerHTML=("Best: "+user.bests[0].score);
    }
    document.getElementById("updateUsername").value=user.username;
    document.getElementById("updateEmail").value=user.email;
    newGame();
  }catch(e){
    console.log(e);
    alert(e.status + ': ' + e.response);
  }
}

async function bestScores(){
  try{
    let bestScores= await makeRequest("GET","http://localhost:3000/api/users/bestScores",[
      {"name":"x-auth-user","value":localStorage.token},
      {"name":"Content-Type","value":"application/json"}
    ]);
    bestScores=JSON.parse(bestScores).bests;
    if(bestScores.length==0){
      document.getElementById("score1").disabled = true;
      document.getElementById("score2").disabled = true;
      document.getElementById("score3").disabled = true;
      document.getElementById("score4").disabled = true;
      document.getElementById("score5").disabled = true;

      document.getElementById("score1").innerHTML="Score: 0";
      document.getElementById("score2").innerHTML="Score: 0";
      document.getElementById("score3").innerHTML="Score: 0";
      document.getElementById("score4").innerHTML="Score: 0";
      document.getElementById("score5").innerHTML="Score: 0";
    }
    else{
      let cnt=0;
      bestScores.forEach((item,index)=>{
        document.getElementById("score"+(index+1)).innerHTML="Score: "+item.score;
        document.getElementById("score"+(index+1)).disabled=false;
        cnt++;
      });
      for(let i=cnt;i<5;i++){
        document.getElementById("score"+(i+1)).disabled=true;
      }
    }

  }catch(e){
    console.log(e);
    alert(e.status + ': ' + e.response);
  }
}

async function bestScore(index){
  try{
    let best= await makeRequest("GET","http://localhost:3000/api/users/bestScore",[
    {"name":"x-auth-user","value":localStorage.token},
    {"name":"Content-Type","value":"application/json"},
    {"name": "index","value":index}
  ]);
  best=JSON.parse(best);
  let board=document.getElementById("bestGame-board");
  let children=board.children;
  for(let i=children.length-1;i>=0;i--){
    board.removeChild(children[i]);
  }
  grid = new Grid(board, best.board);

  document.getElementById("bestScore").innerHTML="Score: "+best.score;

  }catch(e){
    console.log(e);
    alert(e.status + ': ' + e.response);
  }
}

async function loadGames(){
  try{
    let saves= await makeRequest("GET","http://localhost:3000/api/users/loadGames",[
      {"name":"x-auth-user","value":localStorage.token},
      {"name":"Content-Type","value":"application/json"}
    ]);
    let children=document.getElementById("loads").children;
    for(let i=children.length-1;i>=0;i--){
      document.getElementById("loads").removeChild(children[i]);
    }
    saves=JSON.parse(saves);
    if(saves.saveBoards==null) return;
    saves.saveBoards.forEach((item,index)=>{
      document.getElementById("loads").insertAdjacentHTML("beforeend","<button class=\"btn btn-primary\" style=\"margin: 2vmin\" href=\"#\" onclick=\"loadGame("+index+")\">"+item.name+" - score: "+item.score+"</button>");
    })
  }catch(e){
    console.log(e);
    alert(e.status + ': ' + e.response);
  }
}

async function loadGame(index){
  let save= await makeRequest("GET","http://localhost:3000/api/users/loadGame",[
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
  setupInput()
}

async function leaderBoard(){
  try{
    let bestScores= await makeRequest("GET","http://localhost:3000/api/users/leaders",[
      {"name":"x-auth-user","value":localStorage.token},
      {"name":"Content-Type","value":"application/json"}
    ]);
    bestScores=JSON.parse(bestScores);
    if(bestScores.length==0) return;
    bestScores.forEach((item, index)=>{
      document.getElementById("bestUser"+(index+1)).innerHTML=item.username;
      document.getElementById("bestScore"+(index+1)).innerHTML=item.score;
    });
  }catch(e){
    console.log(e);
    alert(e.status + ': ' + e.response);
  }
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
    await makeRequest("PUT", "http://localhost:3000/api/users/bestScores", [
      { "name": "x-auth-user", "value": localStorage.token },
      { "name": "Content-Type", "value": "application/json" }
    ], bestSave);

  } catch (e) {
    console.log(e);
    alert(e.status + ': ' + e.response);
  }
}

async function saveGame(save=false){
  save=save? true: document.getElementById("loads").children.length<5;
  if(save){
    let gameSave={
      "name": document.getElementById("saveName").value,
      "board": grid.grid,
      "score": parseInt(document.getElementById("score").innerHTML.substring(7))
    }
    try {
      let action= await makeRequest("PUT","http://localhost:3000/api/users/saveGames",[
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
