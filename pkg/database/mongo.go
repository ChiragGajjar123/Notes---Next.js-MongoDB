package database

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var (
	clientInstance *mongo.Client
	clientOnce     sync.Once
)

// ConnectDB returns a thread-safe singleton connection to MongoDB.
func ConnectDB() (*mongo.Client, error) {
	var err error
	clientOnce.Do(func() {
		uri := os.Getenv("MONGODB_URI")
		if uri == "" {
			// default for local development if not set
			uri = "mongodb://localhost:27017/notes-app"
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		clientOpts := options.Client().ApplyURI(uri)
		client, connErr := mongo.Connect(clientOpts)
		if connErr != nil {
			err = connErr
			return
		}

		// Ping the database
		pingCtx, pingCancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer pingCancel()
		if pingErr := client.Ping(pingCtx, nil); pingErr != nil {
			err = pingErr
			return
		}

		clientInstance = client
		log.Println("Successfully connected to MongoDB")
	})

	return clientInstance, err
}

// GetCollection returns a mongo.Collection from the default database "notes-app" or parsed from URI
func GetCollection(name string) (*mongo.Collection, error) {
	client, err := ConnectDB()
	if err != nil {
		return nil, err
	}
	// On Vercel / serverless environment, the DB name is usually determined by the MONGODB_URI or defaults to notes-app.
	// Since we don't parse the DB name dynamically here for simplicity, we can default to "notes-app" or read from env.
	dbName := os.Getenv("MONGODB_DB")
	if dbName == "" {
		dbName = "notes-app"
	}
	return client.Database(dbName).Collection(name), nil
}
