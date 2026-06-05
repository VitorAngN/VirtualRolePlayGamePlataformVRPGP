package storage

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/VitorAngN/VirtualRolePlayGamePlataformVRPGP/server/internal/domain"
)

var ErrNotFound = errors.New("not found")

type State struct {
	Worlds   []domain.World       `json:"worlds"`
	Scenes   []domain.Scene       `json:"scenes"`
	Assets   []domain.Asset       `json:"assets"`
	Tokens   []domain.Token       `json:"tokens"`
	Players  []domain.Player      `json:"players"`
	Messages []domain.ChatMessage `json:"messages"`
}

type JSONStore struct {
	mu        sync.RWMutex
	dataDir   string
	dbPath    string
	assetsDir string
	state     State
}

func NewJSONStore(dataDir string) (*JSONStore, error) {
	store := &JSONStore{
		dataDir:   dataDir,
		dbPath:    filepath.Join(dataDir, "db.json"),
		assetsDir: filepath.Join(dataDir, "worlds"),
	}

	if err := os.MkdirAll(store.assetsDir, 0o755); err != nil {
		return nil, err
	}

	if err := store.load(); err != nil {
		return nil, err
	}

	if !store.dbExists() {
		if err := store.saveLocked(); err != nil {
			return nil, err
		}
	}

	return store, nil
}

func (s *JSONStore) AssetsDir() string {
	return s.assetsDir
}

func (s *JSONStore) PutAssetFile(asset domain.Asset, data []byte) error {
	dir := filepath.Join(s.assetsDir, worldFileScope(asset.WorldID), "assets", asset.ID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, asset.Filename), data, 0o644)
}

func (s *JSONStore) ListWorlds() []domain.World {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return cloneSlice(s.state.Worlds)
}

func (s *JSONStore) CreateWorld(name, description, system string) (domain.World, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	world := domain.World{
		ID:          NewID("world"),
		Name:        fallback(name, "Novo mundo"),
		Description: description,
		System:      fallback(system, "D&D 5e SRD"),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.state.Worlds = append(s.state.Worlds, world)
	if err := os.MkdirAll(filepath.Join(s.assetsDir, world.ID, "assets"), 0o755); err != nil {
		return domain.World{}, err
	}
	return world, s.saveLocked()
}

func (s *JSONStore) GetWorld(id string) (domain.World, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, world := range s.state.Worlds {
		if world.ID == id {
			return world, true
		}
	}
	return domain.World{}, false
}

func (s *JSONStore) Snapshot(worldID string) (domain.WorldSnapshot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	snapshot := domain.WorldSnapshot{
		Scenes: []domain.Scene{},
		Assets: []domain.Asset{},
		Tokens: map[string][]domain.Token{},
	}
	for _, world := range s.state.Worlds {
		if world.ID == worldID {
			snapshot.World = world
			break
		}
	}
	if snapshot.World.ID == "" {
		return snapshot, ErrNotFound
	}

	for _, scene := range s.state.Scenes {
		if scene.WorldID == worldID {
			snapshot.Scenes = append(snapshot.Scenes, scene)
			snapshot.Tokens[scene.ID] = []domain.Token{}
		}
	}
	for _, asset := range s.state.Assets {
		if asset.WorldID == worldID {
			snapshot.Assets = append(snapshot.Assets, asset)
		}
	}
	for _, token := range s.state.Tokens {
		if _, ok := snapshot.Tokens[token.SceneID]; ok {
			snapshot.Tokens[token.SceneID] = append(snapshot.Tokens[token.SceneID], token)
		}
	}

	return snapshot, nil
}

func (s *JSONStore) ListScenes(worldID string) []domain.Scene {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var scenes []domain.Scene
	for _, scene := range s.state.Scenes {
		if scene.WorldID == worldID {
			scenes = append(scenes, scene)
		}
	}
	return scenes
}

func (s *JSONStore) CreateScene(scene domain.Scene) (domain.Scene, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.worldExistsLocked(scene.WorldID) {
		return domain.Scene{}, ErrNotFound
	}

	now := time.Now().UTC()
	scene.ID = NewID("scene")
	scene.Name = fallback(scene.Name, "Nova cena")
	if scene.GridSize <= 0 {
		scene.GridSize = 40
	}
	if scene.Width <= 0 {
		scene.Width = 40
	}
	if scene.Height <= 0 {
		scene.Height = 30
	}
	scene.CreatedAt = now
	scene.UpdatedAt = now

	if !s.worldHasScenesLocked(scene.WorldID) {
		scene.Active = true
	}

	if scene.Active {
		for idx := range s.state.Scenes {
			if s.state.Scenes[idx].WorldID == scene.WorldID {
				s.state.Scenes[idx].Active = false
				s.state.Scenes[idx].UpdatedAt = now
			}
		}
	}

	s.state.Scenes = append(s.state.Scenes, scene)
	return scene, s.saveLocked()
}

func (s *JSONStore) PatchScene(id string, patch domain.Scene) (domain.Scene, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	for idx, scene := range s.state.Scenes {
		if scene.ID != id {
			continue
		}

		if patch.Name != "" {
			scene.Name = patch.Name
		}
		if patch.BackgroundAssetID != "" {
			scene.BackgroundAssetID = patch.BackgroundAssetID
		}
		if patch.GridSize > 0 {
			scene.GridSize = patch.GridSize
		}
		if patch.Width > 0 {
			scene.Width = patch.Width
		}
		if patch.Height > 0 {
			scene.Height = patch.Height
		}
		if patch.Active {
			for otherIdx := range s.state.Scenes {
				if s.state.Scenes[otherIdx].WorldID == scene.WorldID {
					s.state.Scenes[otherIdx].Active = false
					s.state.Scenes[otherIdx].UpdatedAt = now
				}
			}
			scene.Active = true
		}
		scene.UpdatedAt = now
		s.state.Scenes[idx] = scene
		return scene, s.saveLocked()
	}

	return domain.Scene{}, ErrNotFound
}

func (s *JSONStore) ListTokens(sceneID string) []domain.Token {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var tokens []domain.Token
	for _, token := range s.state.Tokens {
		if token.SceneID == sceneID {
			tokens = append(tokens, token)
		}
	}
	return tokens
}

func (s *JSONStore) GetToken(id string) (domain.Token, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, token := range s.state.Tokens {
		if token.ID == id {
			return token, true
		}
	}
	return domain.Token{}, false
}

func (s *JSONStore) CreateToken(token domain.Token) (domain.Token, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.sceneExistsLocked(token.SceneID) {
		return domain.Token{}, ErrNotFound
	}

	now := time.Now().UTC()
	token.ID = NewID("token")
	token.Name = fallback(token.Name, "Novo token")
	if token.MaxHP <= 0 {
		token.MaxHP = 10
	}
	if token.HP <= 0 {
		token.HP = token.MaxHP
	}
	if token.AC <= 0 {
		token.AC = 10
	}
	token.CreatedAt = now
	token.UpdatedAt = now
	s.state.Tokens = append(s.state.Tokens, token)
	return token, s.saveLocked()
}

func (s *JSONStore) PatchToken(id string, patch domain.Token) (domain.Token, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	for idx, token := range s.state.Tokens {
		if token.ID != id {
			continue
		}
		if patch.Name != "" {
			token.Name = patch.Name
		}
		if patch.AssetID != "" {
			token.AssetID = patch.AssetID
		}
		token.X = patch.X
		token.Y = patch.Y
		if patch.MaxHP > 0 {
			token.MaxHP = patch.MaxHP
		}
		if patch.HP >= 0 {
			token.HP = patch.HP
		}
		if patch.AC > 0 {
			token.AC = patch.AC
		}
		token.Hidden = patch.Hidden
		token.UpdatedAt = now
		s.state.Tokens[idx] = token
		return token, s.saveLocked()
	}

	return domain.Token{}, ErrNotFound
}

func (s *JSONStore) DeleteToken(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for idx, token := range s.state.Tokens {
		if token.ID == id {
			s.state.Tokens = append(s.state.Tokens[:idx], s.state.Tokens[idx+1:]...)
			return s.saveLocked()
		}
	}
	return ErrNotFound
}

func (s *JSONStore) ListAssets(worldID, sceneID string) []domain.Asset {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var assets []domain.Asset
	for _, asset := range s.state.Assets {
		if worldID != "" && asset.WorldID != worldID {
			continue
		}
		if sceneID != "" && asset.SceneID != sceneID {
			continue
		}
		assets = append(assets, asset)
	}
	return assets
}

func (s *JSONStore) CreateAsset(asset domain.Asset) (domain.Asset, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if asset.WorldID != "" && !s.worldExistsLocked(asset.WorldID) {
		return domain.Asset{}, ErrNotFound
	}
	if asset.SceneID != "" && !s.sceneExistsLocked(asset.SceneID) {
		return domain.Asset{}, ErrNotFound
	}

	asset.ID = NewID("asset")
	asset.Kind = normalizeAssetKind(asset.Kind)
	asset.Name = fallback(asset.Name, strings.TrimSuffix(asset.Filename, filepath.Ext(asset.Filename)))
	asset.Filename = SanitizeFilename(asset.Filename)
	asset.URL = fmt.Sprintf("/assets/%s/assets/%s/%s", worldFileScope(asset.WorldID), asset.ID, asset.Filename)
	asset.CreatedAt = time.Now().UTC()
	s.state.Assets = append(s.state.Assets, asset)
	return asset, s.saveLocked()
}

func (s *JSONStore) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, err := os.Stat(s.dbPath); errors.Is(err, os.ErrNotExist) {
		s.state = State{}
		return nil
	}

	data, err := os.ReadFile(s.dbPath)
	if err != nil {
		return err
	}
	if len(data) == 0 {
		s.state = State{}
		return nil
	}

	return json.Unmarshal(data, &s.state)
}

func (s *JSONStore) saveLocked() error {
	if err := os.MkdirAll(s.dataDir, 0o755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(s.state, "", "  ")
	if err != nil {
		return err
	}

	tmpPath := s.dbPath + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmpPath, s.dbPath)
}

func (s *JSONStore) dbExists() bool {
	_, err := os.Stat(s.dbPath)
	return err == nil
}

func (s *JSONStore) worldExistsLocked(id string) bool {
	for _, world := range s.state.Worlds {
		if world.ID == id {
			return true
		}
	}
	return false
}

func (s *JSONStore) worldHasScenesLocked(id string) bool {
	for _, scene := range s.state.Scenes {
		if scene.WorldID == id {
			return true
		}
	}
	return false
}

func (s *JSONStore) sceneExistsLocked(id string) bool {
	for _, scene := range s.state.Scenes {
		if scene.ID == id {
			return true
		}
	}
	return false
}

func NewID(prefix string) string {
	var bytes [8]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
	}
	return fmt.Sprintf("%s_%s", prefix, hex.EncodeToString(bytes[:]))
}

func SanitizeFilename(name string) string {
	name = filepath.Base(strings.TrimSpace(name))
	if name == "." || name == "" {
		return "asset.bin"
	}

	replacer := strings.NewReplacer("\\", "-", "/", "-", ":", "-", "*", "-", "?", "-", "\"", "-", "<", "-", ">", "-", "|", "-")
	name = replacer.Replace(name)
	name = strings.Join(strings.Fields(name), "-")
	return name
}

func fallback(value, fallbackValue string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallbackValue
	}
	return value
}

func worldFileScope(worldID string) string {
	return fallback(worldID, "_global")
}

func normalizeAssetKind(kind domain.AssetKind) domain.AssetKind {
	switch kind {
	case domain.AssetKindMap, domain.AssetKindToken, domain.AssetKindPortrait:
		return kind
	default:
		return domain.AssetKindMap
	}
}

func cloneSlice[T any](items []T) []T {
	out := make([]T, len(items))
	copy(out, items)
	return out
}
