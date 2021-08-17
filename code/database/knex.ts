import '../app/env'

const {
	DB_ENDPOINT,
	DB_PORT,
	DATABASE_USER,
	DATABASE_PASSWORD,
	DATABASE_NAME,
} = process.env

module.exports = {
	client: 'postgres',
	connection: {
		host: DB_ENDPOINT,
		port: DB_PORT,
		user: DATABASE_USER,
		password: DATABASE_PASSWORD,
		database: DATABASE_NAME,
	},
	development: {
		client: 'postgres',
		connection: {
			host: DB_ENDPOINT,
			port: DB_PORT,
			user: DATABASE_USER,
			password: DATABASE_PASSWORD,
			database: DATABASE_NAME,
		},
		migrations: {
			directory: './migrations',
		},
		seeds: {
			directory: './seeds',
		},
	},
}
