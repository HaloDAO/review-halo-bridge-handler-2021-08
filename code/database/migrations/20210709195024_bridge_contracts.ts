import * as Knex from 'knex'
import dotenv from 'dotenv'
dotenv.config()

const { BRIDGE_CONTRACTS_TABLE } = process.env

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(BRIDGE_CONTRACTS_TABLE, (t) => {
		t.increments('index').primary()
		t.string('parent_bridge_contract_address')
		t.string('bridge_contract_address').notNullable()
		t.integer('chain_id').notNullable()
		t.float('tx_fee', 6, 6).notNullable()
		t.string('token_contract_address').notNullable()
		t.string('wrapped_token_contract_address')
		t.string('admin_key_name').notNullable()
		t.dateTime('created_at').defaultTo(knex.fn.now())
		t.dateTime('date_archived')
		t.boolean('archived').defaultTo(false)
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(BRIDGE_CONTRACTS_TABLE)
}
