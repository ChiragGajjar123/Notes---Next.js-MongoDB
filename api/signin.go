package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"notes-app/pkg/auth"
	"notes-app/pkg/models"
	"notes-app/pkg/ratelimit"
	"notes-app/pkg/response"
)

type signinInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Handler handles signin credential validation
func Handler(w http.ResponseWriter, r *http.Request) {
	// Validate internal key (only internal NextAuth service should call signin)
	_, err := auth.ValidateInternalRequest(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract Client IP passed by NextAuth proxy
	clientIP := r.Header.Get("X-Client-IP")
	if clientIP == "" {
		clientIP = ratelimit.GetClientIp(r)
	}

	// Enforce Rate Limiting
	_, _, err = ratelimit.EnforceRateLimit(r.Context(), "login", clientIP, ratelimit.LoginLimit)
	if err != nil {
		response.Error(w, http.StatusTooManyRequests, err.Error())
		return
	}

	var input signinInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))
	password := input.Password

	if email == "" || password == "" {
		response.Error(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	user, err := models.AuthenticateUser(r.Context(), email, password)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, user)
}
