# George
I've written my own link shortener and his name is George.

## Technology
George is written in node.js using koa and enmap.

Nothing that fancy.

## Usage
I didn't really design this for other people to use, but if you wanted to:

### Docker
Copy the `docker-compose.yml` and `docker compose up -d`

### Locally
Install node.js and yarn.

Clone the repo and run `yarn install` and `node .`.

## Configuration
You can configure George using environment variables

| Variable          | Description                                                                               | Default     |
|-------------------|-------------------------------------------------------------------------------------------|-------------|
| `PORT`            | The port to listen on                                                                     | `3000`      |
| `SECRET`          | The secret to use for accessing the dash. Leaving blank allows anyone to access the dash. | None        |
| `MANAGEMENT_HOST` | The host to use for the management dashboard                                              | `localhost` |

Good luck!