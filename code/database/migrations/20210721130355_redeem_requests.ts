import * as Knex from 'knex'
import dotenv from 'dotenv'
dotenv.config()

const { REDEEM_REQUEST_TABLE } = process.env

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(REDEEM_REQUEST_TABLE, (t) => {
		t.increments('index').primary()
		t.string('bridge_contract_address').notNullable()
		t.string('burn_tx_id').notNullable().unique()
		t.string('account').notNullable()
		t.string('amount').notNullable()
		t.integer('chain_id_origin').notNullable()
		t.integer('chain_id_destination').notNullable()
		t.integer('nonce')
		t.string('signed_tx').notNullable()
		t.string('tx_receipt').notNullable()
		t.integer('retry_count').defaultTo(0)
		t.boolean('is_successful').defaultTo(false)
		t.dateTime('created_at').defaultTo(knex.fn.now())
		t.dateTime('date_archived')
		t.boolean('archived').defaultTo(false)
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(REDEEM_REQUEST_TABLE)
}
