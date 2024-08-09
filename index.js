let createRoomBtn = document.getElementById("createBtn");
let joinRoomBtn = document.getElementById("joinBtn");

const ROWS = 20;
const COLS = ROWS;
const CANVAS_WIDTH = 200;

const URL = "http://localhost:6969/"


function createEmptyBoard( rows , cols ){
    let board = new Array(rows);
    for( let i = 0 ; i < rows ; ++i ){
	board[i] = new Array(cols).fill(0);
    }
    return board;
}

function renderBoard(ctx , board , CELL_WIDTH , CELL_HEIGHT){
    for(let i = 0 ; i < ROWS ; ++i){
        for(let j = 0 ; j < COLS ; ++j){
            if(board[i][j] === 1){
        	ctx.beginPath();
        	ctx.fillStyle = "red";
    		ctx.fillRect(i*CELL_WIDTH , j*CELL_HEIGHT ,
        	    CELL_WIDTH, CELL_HEIGHT);
    		ctx.fill();
            }
        }
    }
}

function updateBoard(board , roomId){
    fetch(`http://localhost:42069/room/${roomId}/updateBoard`,{
        method: "put",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
	   board: board
        }),
    })
    .catch(err => {
	console.log(err);
	return;
    })
}

(()=>{

joinRoomBtn?.addEventListener("click", async()=>{
    const roomId = document.getElementById("joinRoomId").value;
    let data = undefined;

    if(!roomId){
	alert("Room id is required");
	throw new Error("Room id is required");
    }

    try{
	const res = await fetch(`http://localhost:42069/user/${roomId}`,{
    	    method: "put",
	    headers: {
    	      'Accept': 'application/json',
    	      'Content-Type': 'application/json'
    	    },
    })
	if(!res.ok){
	    console.error("response was not ok");
	    return;
	}
	data = await res.json()
    }catch(err){
	return;
    }


    localStorage.setItem("id" , data?.id);

    window.location = URL + `room.html?roomId=${roomId}&userId=${data?.id}`;
    return;
    document.getElementById("canvasSection").style.display =
        "block"
    document.getElementById("heading").innerText
        += " :  "  + data.id ;

    const canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");

    canvas.width = CANVAS_WIDTH;
    canvas.height = canvas.width;

    ctx.fillStyle = "grey";
    ctx.fillRect(0 , 0 , canvas.width , canvas.height);
    ctx.fill();

    const CELL_WIDTH = canvas.width / COLS;
    const CELL_HEIGHT = canvas.height / ROWS;

    const event = new EventSource(`http://localhost:42069/room/${roomId}/boardEvent`);

    event.onmessage = (e) => {
        let board = JSON.parse(e.data);
        renderBoard( ctx , board , CELL_WIDTH , CELL_HEIGHT);
    }
})

createRoomBtn?.addEventListener("click" ,async()=>{
    const roomId = document.getElementById("hostRoomId").value;
    const roomName = document.getElementById("hostRoomName").value;
    const emptyBoard = createEmptyBoard(ROWS , COLS);
    let data = undefined;

    if(!roomName || ! roomId){
	alert("Room Id and Room Name is required");
	throw new Error("Room Id and Room Name is required");
    }

    try{
	const res = await fetch("http://localhost:42069/room", {
    	    method: "post",
    		headers: {
    		  'Accept': 'application/json',
    		  'Content-Type': 'application/json'
    		},

    		body: JSON.stringify({
		    id : roomId,
		    name : roomName,
    	            board : emptyBoard
    		})
    	})
    	if(!res.ok){
	    console.error("response was not ok");
	    return;
    	}
	data = await res.json()
    }catch(err){
	console.error("ERROR : " , err);
	return;
    }

    localStorage.setItem("id" , data?.id);

    window.location = URL + `room.html?roomId=${roomId}&userId=${data?.id}`;

    });
})()

