package main

import (
	"composer/internal/db"
	"composer/internal/routes"
	"context"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/tmc/langchaingo/llms/googleai"
	"github.com/tmc/langchaingo/llms/googleai/vertex"
)

func main() {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	dbType := os.Getenv("DB_TYPE")
	dbConnectionString := os.Getenv("DB_CONNECTION_STRING")

	conn, err := db.New(dbType, dbConnectionString)
	if err != nil {
		e.Logger.Fatal(err)
	}

	// llm, err := anthropic.New(
	// 	anthropic.WithModel("claude-3-5-sonnet-latest"),
	// )
	// if err != nil {
	// 	e.Logger.Fatal(err)
	// }

	ctx := context.Background()

	project := "kodespaces"

	llm, err := vertex.New(ctx,
		googleai.WithCloudProject(project),
		googleai.WithDefaultModel("gemini-2.0-flash-exp"),
		googleai.WithDefaultMaxTokens(8192),
	)
	if err != nil {
		e.Logger.Fatal(err)
	}

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("db", conn)
			c.Set("llm", llm)
			return next(c)
		}
	})

	e.GET("/api/v1/healthz", routes.Healthz)
	routes.RegisterMessageRoutes(e)
	routes.RegisterChatSessionRoutes(e, conn)

	e.Static("/", "ui/dist")

	err = e.Start(":9081")
	if err != nil {
		e.Logger.Fatal(err)
	}
}
