package auth

import (
	"errors"
	"net/http"
	"os"
)

// ValidateInternalRequest checks the headers for matching internal key and a valid user ID.
func ValidateInternalRequest(r *http.Request) (string, error) {
	internalKey := r.Header.Get("X-Internal-Key")
	expectedKey := os.Getenv("INTERNAL_API_KEY")

	if expectedKey == "" {
		return "", errors.New("INTERNAL_API_KEY is not configured on the server")
	}

	if internalKey != expectedKey {
		return "", errors.New("unauthorized: invalid internal API key")
	}

	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		return "", errors.New("unauthorized: missing user ID header")
	}

	return userID, nil
}
