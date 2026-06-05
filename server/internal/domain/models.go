package domain

import "time"

type AssetKind string

const (
	AssetKindMap      AssetKind = "map"
	AssetKindToken    AssetKind = "token"
	AssetKindPortrait AssetKind = "portrait"
)

type World struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	System      string    `json:"system"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Scene struct {
	ID                string    `json:"id"`
	WorldID           string    `json:"world_id"`
	Name              string    `json:"name"`
	BackgroundAssetID string    `json:"background_asset_id,omitempty"`
	GridSize          int       `json:"grid_size"`
	Width             int       `json:"width"`
	Height            int       `json:"height"`
	Active            bool      `json:"active"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type Asset struct {
	ID          string    `json:"id"`
	WorldID     string    `json:"world_id,omitempty"`
	SceneID     string    `json:"scene_id,omitempty"`
	Kind        AssetKind `json:"kind"`
	Name        string    `json:"name"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"content_type"`
	SizeBytes   int64     `json:"size_bytes"`
	URL         string    `json:"url"`
	CreatedAt   time.Time `json:"created_at"`
}

type Token struct {
	ID        string    `json:"id"`
	SceneID   string    `json:"scene_id"`
	AssetID   string    `json:"asset_id,omitempty"`
	Name      string    `json:"name"`
	X         int       `json:"x"`
	Y         int       `json:"y"`
	HP        int       `json:"hp"`
	MaxHP     int       `json:"max_hp"`
	AC        int       `json:"ac"`
	Hidden    bool      `json:"hidden"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Player struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	WorldID   string    `json:"world_id"`
	IsGM      bool      `json:"is_gm"`
	IsMobile  bool      `json:"is_mobile"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatMessage struct {
	ID        string    `json:"id"`
	WorldID   string    `json:"world_id"`
	SceneID   string    `json:"scene_id,omitempty"`
	Speaker   string    `json:"speaker"`
	Type      string    `json:"type"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type WorldSnapshot struct {
	World  World              `json:"world"`
	Scenes []Scene            `json:"scenes"`
	Assets []Asset            `json:"assets"`
	Tokens map[string][]Token `json:"tokens_by_scene"`
}
