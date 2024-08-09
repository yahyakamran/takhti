package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/rs/cors"
)

type Board struct {
    Board [][]int `json:"board"`
}

type User struct {
    Id int `json:"id"`
    IsAdmin bool `json:"isAdmin"`
}

type Room struct{
    Id string `json:"id"`
    Name string `json:"name"`
    Board [][]int `json:"board"`
    Users map[int]User `json:"users"`
}

var userIds = 0;
var Rooms = make(map[int]Room)

func main() {
    mux := http.NewServeMux();

    mux.HandleFunc("POST /room", createRoom);

    mux.HandleFunc("PUT /user/{roomId}", joinRoom);

    mux.HandleFunc("GET /room/{roomId}", fetchRoom)

    mux.HandleFunc("GET /room/{roomId}/user/{userId}", fetchUser)

    mux.HandleFunc("DELETE /room/{roomId}", deleteRoom)

    mux.HandleFunc("PUT /room/{roomId}/updateBoard", updateBoard)

    mux.HandleFunc("/room/{roomId}/boardEvent", boardSSE)

    c  := cors.New(cors.Options{
        AllowedOrigins:   []string{"*"},
        AllowedMethods:   []string{
				http.MethodGet, http.MethodPost,
				http.MethodDelete , http.MethodPut,
			    },
        AllowCredentials: true,
    })

    handler := c.Handler(mux)

    fmt.Println("Listening to Port 42069");
    log.Fatal(http.ListenAndServe(":42069", handler))
}

func boardSSE(w http.ResponseWriter , r *http.Request){

    w.Header().Set("Content-type","text/event-stream")
    w.Header().Set("Cache-Control","no-cache")
    w.Header().Set("Connection","keep-alive")

    f , ok := w.(http.Flusher);
    if !ok{
	http.Error( w , "SSE not supported , IE6 bruh" ,
		http.StatusBadRequest)
	return;
    }

    id , err := strconv.Atoi(r.PathValue("roomId"))

    if err != nil {
	http.Error( w , err.Error() , http.StatusBadRequest)
	return;
    }

    room , ok := Rooms[id];

    if !ok {
        http.Error(w,"Room:Notfound",http.StatusNotFound);
        return;
    }

    j , err := json.Marshal(room.Board);

    if err != nil {
        http.Error( w , err.Error() ,http.StatusBadRequest)
        return
    }

    res := string(j);
    fmt.Fprintln(w,"retry:16");
    fmt.Fprintf(w,"data:%v\n\n", res);
    f.Flush();
}

func updateBoard(w http.ResponseWriter , r * http.Request){

    id , err := strconv.Atoi(r.PathValue("roomId"))
    var board Board;

    if err != nil {
	http.Error( w , "parameter issue", http.StatusBadRequest)
	return;
    }

    err = json.NewDecoder(r.Body).Decode(&board);

    if err != nil {
	http.Error( w , "decoding issue" , http.StatusBadRequest)
	return;
    }

    if entry , ok := Rooms[id]; !ok {
	http.Error( w ,"room not found", http.StatusNotFound);
	return;
    } else {
	entry.Board = board.Board;
	Rooms[id] = entry;
    }


    w.WriteHeader(http.StatusNoContent);

}

func deleteRoom(w http.ResponseWriter , r * http.Request){
    id , err := strconv.Atoi(r.PathValue("roomId"))

    if err != nil {
	http.Error( w , err.Error() , http.StatusBadRequest)
	return;
    }

    if _ , ok := Rooms[id]; !ok {
	http.Error( w ,"room not found", http.StatusNotFound);
	return;
    }

    delete(Rooms , id);
    w.WriteHeader(http.StatusNoContent)
}

func joinRoom( w http.ResponseWriter , r *http.Request){
    id , err := strconv.Atoi(r.PathValue("roomId"))

    if err != nil {
	http.Error( w , err.Error() , http.StatusBadRequest)
	return;
    }

    room , ok := Rooms[id];

    if !ok {
	http.Error( w , "room not found" , http.StatusNotFound)
	return;
    }

    userIds++;
    user := User{Id: userIds , IsAdmin: false};

    room.Users[userIds] = user;

    j , err := json.Marshal(user);

    Rooms[id] = room;

    w.WriteHeader(http.StatusOK);
    w.Write(j);
}

func fetchUser( w http.ResponseWriter , r *http.Request){
    roomId , err := strconv.Atoi(r.PathValue("roomId"));

    if err != nil {
	fmt.Println("roomId");
	http.Error(w , err.Error() , http.StatusBadRequest);
	return;
    }

    userId , err := strconv.Atoi(r.PathValue("userId"));

    if err != nil {
	fmt.Println("userId");
	http.Error(w , err.Error() , http.StatusBadRequest);
	return;
    }

    if _ , ok := Rooms[roomId] ; !ok {
	fmt.Println("room");
	http.Error(w , "Room can't found" , http.StatusBadRequest);
	return;
    }

    user  , ok := Rooms[roomId].Users[userId];

    if !ok {
	fmt.Println("user");
	http.Error(w , "User can found" , http.StatusBadRequest);
	return;
    }

    j , err := json.Marshal(user)

    if err != nil {
	fmt.Println("json")
	http.Error(w , err.Error() , http.StatusBadRequest);
	return;
    }

    w.WriteHeader(http.StatusOK)
    w.Write(j);
}

func fetchRoom( w http.ResponseWriter , r *http.Request){
    id , err := strconv.Atoi(r.PathValue("roomId"))

    if err != nil {
	http.Error( w , err.Error() , http.StatusBadRequest)
	return;
    }

    room , ok := Rooms[id];

    if !ok {
	http.Error( w , "room not found" , http.StatusNotFound)
	return;
    }


    j , err := json.Marshal(room);

    if err != nil {
	http.Error(w , err.Error() , http.StatusInternalServerError);
	return;
    }

    w.WriteHeader(http.StatusOK)
    w.Write(j)
}

func createRoom(w http.ResponseWriter , r *http.Request){

    var room Room;
    var users = make(map[int]User);

    err := json.NewDecoder(r.Body).Decode(&room);

    if err != nil {
	http.Error(w , "Why you cant decode it" , http.StatusBadRequest);
	return;
    }

    if room.Name == "" {
	http.Error(w , "Name is required" , http.StatusBadRequest);
	return;
    }


    id , err := strconv.Atoi(room.Id)

    if err != nil {
	http.Error(w , "Invalid ID" , http.StatusBadRequest);
	return;
    }

    userIds++;
    users[userIds] = User{
	Id: userIds,
	IsAdmin: true,
    }

    room.Users = users;

    if _ , ok := Rooms[id]; ok {
	http.Error(w , "Room already exits" , http.StatusBadRequest);
	return;
    }

    j , err := json.Marshal(users[userIds]);

    if err != nil{
	http.Error(w , "Failed to parse json" , http.StatusBadRequest);
	return;
    }

    Rooms[id] = room;

    w.WriteHeader(http.StatusOK);
    w.Write(j);
}
