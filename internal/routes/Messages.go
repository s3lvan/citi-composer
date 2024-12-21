package routes

import (
	"composer/internal/db"
	"composer/internal/models"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/sergi/go-diff/diffmatchpatch"
	"github.com/tmc/langchaingo/llms"
)

func RegisterMessageRoutes(e *echo.Echo) {
	e.POST("/api/chat-sessions/:id/messages", createMessage)
}

func systemPrompt(isDocumentEditor bool) string {

	formatType := `The artifact should be valid rich HTML document fit for presentation. Make sure that you add adequate spacing / line breaks after sections.`
	if !isDocumentEditor {
		formatType = `The artifact should be a valid Markdown document`
	}

	logo := `The artifact must always start with the following logo.

<img src="/citi.png" alt="logo" />`
	if !isDocumentEditor {
		logo = ""
	}

	return fmt.Sprintf(`
You are a helpful assistant. For the request made to you, please provide your
response in the following format, where you are providing the contents of the artifact
you are generating and your thought process in distinctly demarcated tags. Please ensure that
you do not provide any content outside of these tags.

%s

If you are asked to generate a document, please think though the various sections of the document and put in as
much detail as possible. Be thorough and detailed.

Here is example output:

---
<artifact>
<img src="/citi.svg" alt="logo" />
<h1>Section 1</h1>
<br/>
<p>Some contents</p>
<br/>
<h1>Section 2</h1>
</artifact>
<explanation>
Users first need to install the pre-requisites because...
</explanation>
---

Please always respond with the complete artifact - do not add placeholders like "[Rest of the document remains the same...]"

If the user makes a change to the artifact during the course of the conversation, you will recieve a diff of the user 
change in the <user_edits> tag.

%s
`, formatType, logo)
}

func createMessage(c echo.Context) error {
	sessionID := c.Param("id")
	database := c.Get("db").(*db.Db)
	aiModel := c.Get("llm").(llms.Model)

	rb := requestBody{}
	err := c.Bind(&rb)
	if err != nil {
		return err
	}

	diff := rb.Artifact
	previousArtifact, err := getPreviousArtifactVersion(database, sessionID, "ai")
	if err != nil {
		return err
	}

	if previousArtifact != "" {
		dmp := diffmatchpatch.New()
		diff = dmp.DiffPrettyText(dmp.DiffMain(previousArtifact, rb.Artifact, false))
		log.Printf("Diff calculated is %s", diff)
	}

	msg := models.ChatMessage{
		SessionID:    sessionID,
		Role:         "human",
		Content:      rb.Content,
		CreatedAt:    time.Now(),
		Doc:          rb.Artifact,
		Diff:         diff,
		SelectedText: rb.SelectedText,
	}

	err = database.InsertChatMessage(&msg)
	if err != nil {
		return err
	}

	history, err := database.ListChatMessages(sessionID)
	if err != nil {
		return err
	}

	messageToModel := []llms.MessageContent{
		llms.TextParts(llms.ChatMessageType("system"), systemPrompt(rb.IsDocumentEditor)),
	}

	for _, m := range history {
		prompt := ""
		if m.Role == "ai" {
			prompt = fmt.Sprintf("<artifact>\n%s\n</artifact>\n<explanation>\n%s\n</explanation>\n", m.Doc, m.Content)
		} else if m.Role == "human" {
			prompt = fmt.Sprintf("<user_edits>\n%s\n</user_edits>\n<message>\n%s\n</message>\n<selected_text>\n%s\n</selected_text>", m.Diff, m.Content, m.SelectedText)
		}

		messageToModel = append(messageToModel, llms.TextParts(llms.ChatMessageType(m.Role), prompt))
	}

	w := c.Response()
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	streamMessage := &UserChatMessageResponse{
		Message:  "",
		Artifact: "",
	}

	inArtifact := false
	inExplanation := false
	collectedChunks := ""

	result, err := aiModel.GenerateContent(c.Request().Context(), messageToModel, llms.WithMaxTokens(8192), llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
		// log.Printf("Chunk is %s", chunk)
		// log.Printf("inArtifact is %v", inArtifact)
		// log.Printf("inExplanation is %v", inExplanation)
		collectedChunks += string(chunk)

		if strings.Contains(collectedChunks, "<artifact>") {
			inArtifact = true
			collectedChunks = strings.Replace(collectedChunks, "<artifact>", "", -1)
			streamMessage.Artifact += collectedChunks
			return nil
		}

		if strings.Contains(collectedChunks, "</artifact>") {
			inArtifact = false
			frags := strings.Split(string(chunk), "</artifact>")
			streamMessage.Artifact += frags[0]
			log.Printf("Ending artifact with message %s", streamMessage.Artifact)
			err := json.NewEncoder(w).Encode(streamMessage)
			if err != nil {
				return err
			}
			w.Write([]byte("\r\n"))
			w.Flush()
			collectedChunks = ""
			if len(frags) > 1 {
				collectedChunks = frags[1]
			}
			return nil
		}

		if inArtifact {
			streamMessage.Artifact += string(chunk)
			streamMessage.Artifact = strings.Replace(streamMessage.Artifact, "</artifact", "", -1)
			err := json.NewEncoder(w).Encode(streamMessage)
			if err != nil {
				return err
			}
			w.Write([]byte("\r\n"))
			w.Flush()
		}

		if strings.Contains(collectedChunks, "<explanation>") {
			inExplanation = true
			collectedChunks = strings.Replace(collectedChunks, "<explanation>", "", -1)
			streamMessage.Message += collectedChunks
			return nil
		}

		if strings.Contains(collectedChunks, "</explanation>") {
			inExplanation = false
			frags := strings.Split(string(chunk), "</explanation>")
			streamMessage.Message += frags[0]
			err := json.NewEncoder(w).Encode(streamMessage)
			if err != nil {
				return err
			}
			w.Write([]byte("\r\n"))
			w.Flush()
			if len(frags) > 1 {
				collectedChunks = frags[1]
			}
			return nil
		}

		if inExplanation {
			streamMessage.Message += string(chunk)
			// streamMessage.Message = strings.Replace(streamMessage.Message, "</explanation", "", -1)
			err := json.NewEncoder(w).Encode(streamMessage)
			if err != nil {
				return err
			}
			w.Write([]byte("\r\n"))
			w.Flush()
		}

		return nil
	}))
	if err != nil {
		return err
	}

	err = database.InsertChatMessage(&models.ChatMessage{
		SessionID: sessionID,
		Role:      "ai",
		Content:   streamMessage.Message,
		Doc:       streamMessage.Artifact,
		CreatedAt: time.Now(),
	})
	if err != nil {
		return err
	}

	log.Printf("response from LLM is %+s", result.Choices[0].Content)
	return nil
}

func getPreviousArtifactVersion(database *db.Db, sessionID, perspective string) (string, error) {
	msgs, err := database.ListChatMessages(sessionID)
	if err != nil {
		return "", err
	}

	for i := len(msgs) - 1; i >= 0; i-- {
		if msgs[i].Doc != "" {
			if perspective == "" || msgs[i].Role == perspective {
				return msgs[i].Doc, nil
			}
		}
	}

	return "", nil
}

type requestBody struct {
	Content          string `json:"content"`
	Artifact         string `json:"artifact,omitempty"`
	SelectedText     string `json:"selectedText"`
	IsDocumentEditor bool   `json:"isDocumentEditor"`
}

type UserChatMessageResponse struct {
	Message  string `json:"message"`
	Artifact string `json:"artifact,omitempty"`
}
