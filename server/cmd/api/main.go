package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	fmt.Println("VTT Lite Server Starting...")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("VTT Lite WebSocket Hub is running!"))
	})

	log.Println("Server listening on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
