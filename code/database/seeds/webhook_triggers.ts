import * as Knex from 'knex'

const { WEBHOOK_TRIGGERS_TABLE } = process.env

export async function seed(knex: Knex): Promise<void> {
	// Deletes ALL existing entries
	await knex(WEBHOOK_TRIGGERS_TABLE).del()

	// Inserts seed entries
	await knex(WEBHOOK_TRIGGERS_TABLE).insert([
		{
			event_broker_trigger_id: 'e9053c1a-9f3c-41b9-bb8f-695a8c9bc791',
			event_name: 'Deposit Received',
			chain_id_origin: 137,
			contract_address_origin: '0xCF714F6a3A6BaF99C7d6046c176Db7456F4a4715',
			token_contract_address: '0x727A401fdDb5cd6074FaF5Fa7cbd2BA7b3ae7aFd',
		},
		{
			event_broker_trigger_id: '57954f25-a172-47f2-afca-01660c9f7c52',
			event_name: 'Burnt',
			chain_id_origin: 100,
			contract_address_origin: '0x1DBFDbD16d0c72E9b9c0EFBCa74F64DF9a2a90be',
			token_contract_address: '0x727A401fdDb5cd6074FaF5Fa7cbd2BA7b3ae7aFd',
		},
	])
}
