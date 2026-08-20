use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Debug, starknet::Store)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
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
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::{IVaultAnonymizer, IERC20Dispatcher, IERC20DispatcherTrait, OpenNoteDeposit, errors};
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
            let caller = get_caller_address();
            let pool = self.privacy_pool_address.read();
            if pool.is_non_zero() {
                assert(caller == pool, errors::CALLER_NOT_POOL);
            }

            assert(in_token.is_non_zero(), errors::ZERO_IN_TOKEN);
            assert(in_amount > 0, errors::ZERO_AMOUNT);
            assert(note_id.is_non_zero(), errors::ZERO_NOTE_ID);

            // 1. Verify policy onchain
            let policy_addr = self.policy_vault_address.read();
            if policy_addr.is_non_zero() {
                let policy_dispatcher = IPolicyVaultDispatcher { contract_address: policy_addr };
                let is_valid = policy_dispatcher
                    .verify_transfer_policy(amount: in_amount, recipient: recipient, token: in_token);
                assert(is_valid, errors::POLICY_REJECTED);
            }

            // 2. Approve pool spending
            let token_erc20 = IERC20Dispatcher { contract_address: in_token };
            token_erc20.approve(spender: caller, amount: in_amount.into());

            // 3. Return open note deposit
            let mut deposits = array![];
            deposits
                .append(
                    OpenNoteDeposit { note_id: note_id, token: out_token, amount: in_amount },
                );
            deposits.span()
        }
    }
}
