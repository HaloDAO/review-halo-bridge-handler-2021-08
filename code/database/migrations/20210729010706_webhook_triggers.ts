import * as Knex from 'knex'
import dotenv from 'dotenv'
dotenv.config()

const { WEBHOOK_TRIGGERS_TABLE } = process.env

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(WEBHOOK_TRIGGERS_TABLE, (t) => {
		t.increments('index').primary()
		t.string('event_broker_trigger_id').notNullable()
		t.string('event_name').notNullable()
		t.integer('chain_id_origin').notNullable()
		t.string('contract_address_origin').notNullable()
		t.string('token_contract_address').notNullable()
		t.dateTime('created_at').defaultTo(knex.fn.now())
		t.dateTime('date_archived')
		t.boolean('archived').defaultTo(false)
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(WEBHOOK_TRIGGERS_TABLE)
}
