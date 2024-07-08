let creatRoomBtn = document.getElementById("createBtn");
let joinRoomBtn = document.getElementById("joinBtn");


const ROWS = 20;
const COLS = ROWS;
const CANVAS_WIDTH = 200;

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

joinRoomBtn?.addEventListener("click", ()=>{
    const roomId = document.getElementById("joinRoomId").value;

    if(!roomId){
	alert("Room id is required");
	throw new Error("Room id is required");
    }

    fetch(`http://localhost:42069/room/${roomId}`,{
	method: "get",
    	headers: {
    	  'Accept': 'application/json',
    	  'Content-Type': 'application/json'
    	},
    })
    .then(res => res.json())
    .then(data => {
	document.getElementById("joiningSection").style.display =
    	    "none"
    	document.getElementById("canvasSection").style.display =
    	    "block"
	document.getElementById("heading").innerText
   	    += " :  "  + data.id ;

    	const canvas = document.getElementById("canvas");
    	let ctx = canvas.getContext("2d");

	let board = data.board;

    	canvas.width = CANVAS_WIDTH;
    	canvas.height = canvas.width;

    	ctx.fillStyle = "grey";
    	ctx.fillRect(0 , 0 , canvas.width , canvas.height);
    	ctx.fill();
	
	const CELL_WIDTH = canvas.width / COLS;
	const CELL_HEIGHT = canvas.height / ROWS;

	const event = new EventSource(`http://localhost:42069/room/${roomId}/boardEvent`);

	event.onmessage = (e) => {
	    let roomObj = JSON.parse(e.data);
	    renderBoard( ctx , roomObj , CELL_WIDTH , CELL_HEIGHT);
	}

    })
    .catch(err => console.error(err))

})

creatRoomBtn?.addEventListener("click" ,()=>{
    const roomId = document.getElementById("hostRoomId").value;
    const roomName = document.getElementById("hostRoomName").value;
    const emptyBoard = createEmptyBoard(ROWS , COLS);

    if(!roomName || ! roomId){
	alert("Room Id and Room Name is required");
	throw new Error("Room Id and Room Name is required");
    }

    fetch("http://localhost:42069/room", {
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
    .then((res) => {
	if(res.ok){
	    document.getElementById("joiningSection").style.display =
		"none"
	    document.getElementById("heading").innerText
		+= "   "  + roomId;
	    document.getElementById("canvasSection").style.display =
		"block"

	    const canvas = document.getElementById("canvas");
	    let ctx = canvas.getContext("2d");

	    let current_board = emptyBoard;

	    canvas.width = CANVAS_WIDTH;
	    canvas.height = canvas.width;

	    const CELL_WIDTH = canvas.width / COLS;
	    const CELL_HEIGHT = canvas.height / ROWS;

	    ctx.fillStyle = "grey";
	    ctx.fillRect(0 , 0 , canvas.width , canvas.height);
	    ctx.fill();

	    canvas.addEventListener("mousedown",(e)=>{
		const X = Math.floor(e.offsetX/CELL_WIDTH);
		const Y = Math.floor(e.offsetY/CELL_HEIGHT);
		current_board[X][Y] = 1;
		renderBoard(ctx,current_board,CELL_WIDTH,CELL_HEIGHT);
		fetch(`http://localhost:42069/room/${roomId}/updateBoard`,{
		    method: "put",
    		    headers: {
    		      'Accept': 'application/json',
    		      'Content-Type': 'application/json'
    		    },
		    body: JSON.stringify({
			board: current_board
		    }),
		})
		.catch(err => console.log(err))
	    })
	    renderBoard(ctx,current_board,CELL_WIDTH,CELL_HEIGHT);
	}
    })
    .catch((err) => console.log(err.response))

});
