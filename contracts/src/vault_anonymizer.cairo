use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Debug, starknet::Store)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}

#[starknet::interface]
pub trait IVaultAnonymizer<TContractState> {
    /// Entry point invoked by STRK20 privacy pool via `INVOKE_SELECTOR`.
    /// Enforces the vault spending policy onchain before crediting the open note deposit.
    fn privacy_invoke(
        ref self: TContractState,
        in_token: ContractAddress,
        out_token: ContractAddress,
        in_amount: u128,
        note_id: felt252,
        recipient: ContractAddress,
    ) -> Span<OpenNoteDeposit>;
}

pub mod errors {
    pub const ZERO_IN_TOKEN: felt252 = 'ZERO_IN_TOKEN';
    pub const ZERO_AMOUNT: felt252 = 'ZERO_AMOUNT';
    pub const ZERO_NOTE_ID: felt252 = 'ZERO_NOTE_ID';
    pub const POLICY_REJECTED: felt252 = 'POLICY_REJECTED';
    pub const INSUFFICIENT_FUNDS: felt252 = 'INSUFFICIENT_FUNDS';
    pub const CALLER_NOT_POOL: felt252 = 'CALLER_NOT_POOL';
}

#[starknet::contract]
pub mod VaultAnonymizer {
    use core::num::traits::Zero;
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::{IVaultAnonymizer, OpenNoteDeposit, errors};
    use crate::policy::{IPolicyVaultDispatcher, IPolicyVaultDispatcherTrait};

    #[storage]
    struct Storage {
        policy_vault_address: ContractAddress,
        privacy_pool_address: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        policy_vault_address: ContractAddress,
        privacy_pool_address: ContractAddress,
    ) {
        self.policy_vault_address.write(policy_vault_address);
        self.privacy_pool_address.write(privacy_pool_address);
    }

    #[abi(embed_v0)]
    impl VaultAnonymizerImpl of IVaultAnonymizer<ContractState> {
        fn privacy_invoke(
            ref self: ContractState,
            in_token: ContractAddress,
            out_token: ContractAddress,
            in_amount: u128,
            note_id: felt252,
            recipient: ContractAddress,
        ) -> Span<OpenNoteDeposit> {
            assert(in_token.is_non_zero(), errors::ZERO_IN_TOKEN);
            assert(in_amount.is_non_zero(), errors::ZERO_AMOUNT);
            assert(note_id.is_non_zero(), errors::ZERO_NOTE_ID);

            let self_addr = get_contract_address();
            let caller = get_caller_address();

            // 0. Enforce caller is the verified privacy pool
            let expected_pool = self.privacy_pool_address.read();
            if expected_pool.is_non_zero() {
                assert(caller == expected_pool, errors::CALLER_NOT_POOL);
            }

            // 1. Verify transfer adheres to the onchain policy vault
            let policy_addr = self.policy_vault_address.read();
            if policy_addr.is_non_zero() {
                let policy_dispatcher = IPolicyVaultDispatcher { contract_address: policy_addr };
                let is_valid = policy_dispatcher
                    .verify_transfer_policy(amount: in_amount, :recipient, token: in_token);
                assert(is_valid, errors::POLICY_REJECTED);
            }

            // 2. Measure actual token balance
            let token_erc20 = IERC20Dispatcher { contract_address: in_token };
            let current_balance = token_erc20.balance_of(account: self_addr);
            assert(current_balance >= in_amount.into(), errors::INSUFFICIENT_FUNDS);

            // 3. Approve the privacy pool (the caller) to pull the settlement tokens
            token_erc20.approve(spender: caller, amount: in_amount.into());

            // 4. Return OpenNoteDeposit instruction for the STRK20 pool to apply
            [OpenNoteDeposit { note_id, token: in_token, amount: in_amount }].span()
        }
    }
}
