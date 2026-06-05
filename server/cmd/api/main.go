package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/VitorAngN/VirtualRolePlayGamePlataformVRPGP/server/internal/httpapi"
	"github.com/VitorAngN/VirtualRolePlayGamePlataformVRPGP/server/internal/storage"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	host := os.Getenv("HOST")
	if host == "" {
		host = "127.0.0.1"
	}

	dataDir := os.Getenv("VTT_DATA_DIR")
	if dataDir == "" {
		dataDir = defaultDataDir()
	}

	store, err := storage.NewJSONStore(dataDir)
	if err != nil {
		log.Fatalf("failed to initialize store: %v", err)
	}

	addr := host + ":" + port
	log.Printf("VTT Lite API listening on %s", addr)
	log.Printf("Data directory: %s", dataDir)

	if err := http.ListenAndServe(addr, httpapi.NewServer(store)); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func defaultDataDir() string {
	exePath, err := os.Executable()
	if err != nil {
		return "saves"
	}

	normalized := strings.ToLower(filepath.ToSlash(exePath))
	if strings.Contains(normalized, "/go-build") {
		if cwd, cwdErr := os.Getwd(); cwdErr == nil && filepath.Base(cwd) == "server" {
			return filepath.Join(filepath.Dir(cwd), "saves")
		}
		return "saves"
	}

	return filepath.Join(filepath.Dir(exePath), "saves")
}
