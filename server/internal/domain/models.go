package domain

import "time"

type Room struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	GMID        string    `json:"gm_id"`
	CreatedAt   time.Time `json:"created_at"`
	MapImageURL string    `json:"map_image_url"`
	State       string    `json:"state"` // EXPLORATION, COMBAT, etc.
}

type Player struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	RoomID   string `json:"room_id"`
	IsGM     bool   `json:"is_gm"`
	IsMobile bool   `json:"is_mobile"`
}

type Token struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	HP       int     `json:"hp"`
	MaxHP    int     `json:"max_hp"`
	PlayerID string  `json:"player_id"`
}
