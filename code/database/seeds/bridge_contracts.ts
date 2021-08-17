import * as Knex from 'knex'

const { BRIDGE_CONTRACTS_TABLE } = process.env

export async function seed(knex: Knex): Promise<void> {
	// Deletes ALL existing entries
	await knex(BRIDGE_CONTRACTS_TABLE).del()

	// Inserts seed entries
	await knex(BRIDGE_CONTRACTS_TABLE).insert([
		{
			bridge_contract_address: '0xCF714F6a3A6BaF99C7d6046c176Db7456F4a4715',
			admin_key_name: 'WALLET_MNEMONIC',
			chain_id: 137,
			tx_fee: 0.1,
			token_contract_address: '0x727A401fdDb5cd6074FaF5Fa7cbd2BA7b3ae7aFd',
		},
		{
			parent_bridge_contract_address:
				'0xCF714F6a3A6BaF99C7d6046c176Db7456F4a4715',
			bridge_contract_address: '0x1DBFDbD16d0c72E9b9c0EFBCa74F64DF9a2a90be',
			admin_key_name: 'WALLET_MNEMONIC',
			chain_id: 100,
			tx_fee: 0.1,
			token_contract_address: '0x727A401fdDb5cd6074FaF5Fa7cbd2BA7b3ae7aFd',
			wrapped_token_contract_address:
				'0xe7e934626382FE9d74d72428911601Bda1a3a326',
		},
	])
}
