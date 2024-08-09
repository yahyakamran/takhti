
const ROWS = 20;
const COLS = ROWS;
const CANVAS_WIDTH = 200;

const URL = "http://localhost:6969/";

function createEmptyBoard( rows , cols ){
    let board = new Array(rows);
    for( let i = 0 ; i < rows ; ++i ){
	board[i] = new Array(cols).fill(0);
    }
    return board;
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


(async()=>{

    const url = window.location.href;
    let splitedUrlArray = url.split('?');
    splitedUrlArray.shift();
    const urlParamString = splitedUrlArray[0];

    const urlParams = new URLSearchParams(urlParamString);

    if(
	urlParams.size > 2 ||
	!(urlParams.has("roomId") && urlParams.has("userId"))
    ){
	console.error("invalid url");
	alert("invalid url");
	return;
    }

    const roomId = urlParams.get("roomId");
    const userId = urlParams.get("userId");

    if(localStorage.getItem("id") !== userId){
	console.log("invalid user id");
	alert("invalid user id");
	return;
    }

    document.getElementById("heading").innerText
	+= "   "  + roomId;

    let user  = undefined;
    try{
	let res  = await fetch(`http://localhost:42069/room/${roomId}/user/${userId}`,{
    	    method: "get",
	    headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	    }
	});
	if(!res.ok){
	    console.error("ERROR : response was not ok");
	    return;
	}
	user = await res.json()
    }catch(err){
	console.error(err);
	return;
    }

    const canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");

    let room = undefined;
    let board = createEmptyBoard(ROWS , COLS);


    canvas.width = CANVAS_WIDTH;
    canvas.height = canvas.width;

    const CELL_WIDTH = canvas.width / COLS;
    const CELL_HEIGHT = canvas.height / ROWS;

    ctx.fillStyle = "grey";
    ctx.fillRect(0 , 0 , canvas.width , canvas.height);
    ctx.fill();


    try {
	let data = await fetch(`http://localhost:42069/room/${roomId}`,{
    	    method: "get",
	    headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	    }
	})

	if(!data.ok){
	    console.error("Failed to fetch room");
	    return;
	}

	room = await data.json();

    }catch(err){
	console.error(err);
	return;
    }

    if(user.isAdmin){
	canvas.addEventListener("mousedown",(e)=>{

    	    const X = Math.floor(e.offsetX/CELL_WIDTH);
    	    const Y = Math.floor(e.offsetY/CELL_HEIGHT);
    	    board[X][Y] = 1;

    	    renderBoard(ctx , board ,CELL_WIDTH,CELL_HEIGHT);
    	    updateBoard(board , roomId);
    	})
    }else{
	const event= new EventSource(`http://localhost:42069/room/${roomId}/boardEvent`);

    	event.onmessage = (e) => {
    	    let board = JSON.parse(e.data);
    	    renderBoard( ctx , board , CELL_WIDTH , CELL_HEIGHT);
    	}
    }

    renderBoard(ctx , board , CELL_WIDTH,CELL_HEIGHT);

})();
