# Composer - AI-Powered Document Editor

Composer is an intelligent document editing platform that combines the power of AI with collaborative editing capabilities. It supports both rich text documents and code editing, with real-time AI assistance.

## Features

- 🤖 AI-powered document and code improvements
- 📝 Rich text document editor
- 💻 Code editor with syntax highlighting
- 💬 Chat interface for AI interactions
- 📚 Version history tracking
- 🔄 Seamless switching between document and code modes
- 🎨 Modern, responsive UI

## Prerequisites

- Go 1.20 or later
- Node.js 16 or later
- PostgreSQL database
- Google Cloud Platform account (for Vertex AI)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DB_TYPE=sqlite3
DB_CONNECTION_STRING=composer.db
```

## Installation

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/pyljain/composer.git
cd composer
```

2. Install Go dependencies:
```bash
go mod download
```

3. Run the backend server:
```bash
go run main.go
```

The server will start on port 9081.

### Frontend Setup

1. Navigate to the UI directory:
```bash
cd ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The UI development server will start and provide you with a local URL.

## Project Structure

```
composer/
├── internal/
│   ├── db/          # Database interactions
│   ├── models/      # Data models
│   └── routes/      # API routes
├── ui/
│   ├── src/
│   │   ├── components/  # React components
│   │   └── models/      # TypeScript interfaces
│   └── public/          # Static assets
└── main.go          # Application entry point
```

## API Endpoints

- `GET /api/v1/healthz` - Health check endpoint
- `POST /api/chat-sessions` - Create a new chat session
- `GET /api/chat-sessions` - List all chat sessions
- `GET /api/chat-sessions/:id` - Get a specific chat session
- `PUT /api/chat-sessions/:id` - Update a chat session
- `DELETE /api/chat-sessions/:id` - Delete a chat session
- `POST /api/chat-sessions/:id/messages` - Create a new message in a chat session

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.



