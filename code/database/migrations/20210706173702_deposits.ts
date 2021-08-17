import * as Knex from 'knex'
import dotenv from 'dotenv'
dotenv.config()

const { DEPOSIT_TABLE } = process.env

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(DEPOSIT_TABLE, (t) => {
		t.increments('index').primary()
		t.string('bridge_contract_address').notNullable()
		t.string('token_contract_address').notNullable()
		t.string('account').notNullable()
		t.string('amount').notNullable()
		t.string('token').notNullable()
		t.integer('block').notNullable()
		t.integer('chain_id_origin').notNullable()
		t.integer('chain_id_destination').notNullable()
		t.string('tx_receipt').notNullable()
		t.dateTime('created_at').defaultTo(knex.fn.now())
		t.dateTime('date_archived')
		t.boolean('archived').defaultTo(false)
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(DEPOSIT_TABLE)
}
