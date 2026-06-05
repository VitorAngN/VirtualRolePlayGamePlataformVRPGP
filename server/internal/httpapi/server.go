package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/VitorAngN/VirtualRolePlayGamePlataformVRPGP/server/internal/domain"
	"github.com/VitorAngN/VirtualRolePlayGamePlataformVRPGP/server/internal/storage"
)

type Server struct {
	store *storage.JSONStore
}

func NewServer(store *storage.JSONStore) http.Handler {
	server := &Server{store: store}
	mux := http.NewServeMux()

	mux.HandleFunc("/health", server.handleHealth)
	mux.HandleFunc("/api/v1/worlds", server.handleWorlds)
	mux.HandleFunc("/api/v1/worlds/", server.handleWorldRoutes)
	mux.HandleFunc("/api/v1/scenes/", server.handleSceneRoutes)
	mux.HandleFunc("/api/v1/tokens/", server.handleTokenRoutes)
	mux.HandleFunc("/api/v1/assets", server.handleAssets)
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(store.AssetsDir()))))

	return withCORS(mux)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "vtt-lite-api"})
}

func (s *Server) handleWorlds(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.store.ListWorlds())
	case http.MethodPost:
		var req createWorldRequest
		if err := readJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		world, err := s.store.CreateWorld(req.Name, req.Description, req.System)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, http.StatusCreated, world)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleWorldRoutes(w http.ResponseWriter, r *http.Request) {
	parts := pathParts(strings.TrimPrefix(r.URL.Path, "/api/v1/worlds/"))
	if len(parts) < 2 {
		writeError(w, http.StatusNotFound, storage.ErrNotFound)
		return
	}

	worldID := parts[0]
	switch parts[1] {
	case "snapshot":
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		snapshot, err := s.store.Snapshot(worldID)
		if err != nil {
			writeStorageError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, snapshot)
	case "scenes":
		s.handleWorldScenes(w, r, worldID)
	default:
		writeError(w, http.StatusNotFound, storage.ErrNotFound)
	}
}

func (s *Server) handleWorldScenes(w http.ResponseWriter, r *http.Request, worldID string) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.store.ListScenes(worldID))
	case http.MethodPost:
		var req sceneRequest
		if err := readJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		scene, err := s.store.CreateScene(domain.Scene{
			WorldID:           worldID,
			Name:              req.Name,
			BackgroundAssetID: req.BackgroundAssetID,
			GridSize:          req.GridSize,
			Width:             req.Width,
			Height:            req.Height,
			Active:            req.Active,
		})
		if err != nil {
			writeStorageError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, scene)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleSceneRoutes(w http.ResponseWriter, r *http.Request) {
	parts := pathParts(strings.TrimPrefix(r.URL.Path, "/api/v1/scenes/"))
	if len(parts) == 0 {
		writeError(w, http.StatusNotFound, storage.ErrNotFound)
		return
	}

	sceneID := parts[0]
	if len(parts) == 2 && parts[1] == "tokens" {
		s.handleSceneTokens(w, r, sceneID)
		return
	}

	if len(parts) != 1 {
		writeError(w, http.StatusNotFound, storage.ErrNotFound)
		return
	}

	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req scenePatchRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	patch := domain.Scene{
		Name:              valueOrEmpty(req.Name),
		BackgroundAssetID: valueOrEmpty(req.BackgroundAssetID),
		GridSize:          valueOrZero(req.GridSize),
		Width:             valueOrZero(req.Width),
		Height:            valueOrZero(req.Height),
	}
	if req.Active != nil {
		patch.Active = *req.Active
	}

	scene, err := s.store.PatchScene(sceneID, patch)
	if err != nil {
		writeStorageError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, scene)
}

func (s *Server) handleSceneTokens(w http.ResponseWriter, r *http.Request, sceneID string) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.store.ListTokens(sceneID))
	case http.MethodPost:
		var req tokenRequest
		if err := readJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		token, err := s.store.CreateToken(domain.Token{
			SceneID: sceneID,
			AssetID: req.AssetID,
			Name:    req.Name,
			X:       req.X,
			Y:       req.Y,
			HP:      req.HP,
			MaxHP:   req.MaxHP,
			AC:      req.AC,
			Hidden:  req.Hidden,
		})
		if err != nil {
			writeStorageError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, token)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleTokenRoutes(w http.ResponseWriter, r *http.Request) {
	tokenID := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/tokens/"), "/")
	if tokenID == "" || strings.Contains(tokenID, "/") {
		writeError(w, http.StatusNotFound, storage.ErrNotFound)
		return
	}

	switch r.Method {
	case http.MethodPatch:
		current, ok := s.store.GetToken(tokenID)
		if !ok {
			writeStorageError(w, storage.ErrNotFound)
			return
		}

		var req tokenPatchRequest
		if err := readJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}

		if req.AssetID != nil {
			current.AssetID = *req.AssetID
		}
		if req.Name != nil {
			current.Name = *req.Name
		}
		if req.X != nil {
			current.X = *req.X
		}
		if req.Y != nil {
			current.Y = *req.Y
		}
		if req.HP != nil {
			current.HP = *req.HP
		}
		if req.MaxHP != nil {
			current.MaxHP = *req.MaxHP
		}
		if req.AC != nil {
			current.AC = *req.AC
		}
		if req.Hidden != nil {
			current.Hidden = *req.Hidden
		}

		token, err := s.store.PatchToken(tokenID, current)
		if err != nil {
			writeStorageError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, token)
	case http.MethodDelete:
		if err := s.store.DeleteToken(tokenID); err != nil {
			writeStorageError(w, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleAssets(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.store.ListAssets(r.URL.Query().Get("worldId"), r.URL.Query().Get("sceneId")))
	case http.MethodPost:
		s.handleAssetUpload(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleAssetUpload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, fmt.Errorf("campo file e obrigatorio"))
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, 32<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if len(data) == 0 {
		writeError(w, http.StatusBadRequest, fmt.Errorf("arquivo vazio"))
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}

	asset, err := s.store.CreateAsset(domain.Asset{
		WorldID:     r.FormValue("worldId"),
		SceneID:     r.FormValue("sceneId"),
		Kind:        domain.AssetKind(r.FormValue("kind")),
		Name:        r.FormValue("name"),
		Filename:    header.Filename,
		ContentType: contentType,
		SizeBytes:   int64(len(data)),
	})
	if err != nil {
		writeStorageError(w, err)
		return
	}

	if err := s.store.PutAssetFile(asset, data); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusCreated, asset)
}

type createWorldRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	System      string `json:"system"`
}

type sceneRequest struct {
	Name              string `json:"name"`
	BackgroundAssetID string `json:"background_asset_id"`
	GridSize          int    `json:"grid_size"`
	Width             int    `json:"width"`
	Height            int    `json:"height"`
	Active            bool   `json:"active"`
}

type scenePatchRequest struct {
	Name              *string `json:"name"`
	BackgroundAssetID *string `json:"background_asset_id"`
	GridSize          *int    `json:"grid_size"`
	Width             *int    `json:"width"`
	Height            *int    `json:"height"`
	Active            *bool   `json:"active"`
}

type tokenRequest struct {
	AssetID string `json:"asset_id"`
	Name    string `json:"name"`
	X       int    `json:"x"`
	Y       int    `json:"y"`
	HP      int    `json:"hp"`
	MaxHP   int    `json:"max_hp"`
	AC      int    `json:"ac"`
	Hidden  bool   `json:"hidden"`
}

type tokenPatchRequest struct {
	AssetID *string `json:"asset_id"`
	Name    *string `json:"name"`
	X       *int    `json:"x"`
	Y       *int    `json:"y"`
	HP      *int    `json:"hp"`
	MaxHP   *int    `json:"max_hp"`
	AC      *int    `json:"ac"`
	Hidden  *bool   `json:"hidden"`
}

func readJSON(r *http.Request, target any) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

func writeStorageError(w http.ResponseWriter, err error) {
	if errors.Is(err, storage.ErrNotFound) {
		writeError(w, http.StatusNotFound, err)
		return
	}
	writeError(w, http.StatusInternalServerError, err)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func pathParts(path string) []string {
	var parts []string
	for _, part := range strings.Split(strings.Trim(path, "/"), "/") {
		if part != "" {
			parts = append(parts, part)
		}
	}
	return parts
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func valueOrZero(value *int) int {
	if value == nil {
		return 0
	}
	return *value
}
