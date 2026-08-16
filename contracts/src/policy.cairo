use starknet::ContractAddress;

#[starknet::interface]
pub trait IPolicyVault<TContractState> {
    /// Verifies if a transfer of `amount` to `recipient` for `token` satisfies the policy rules.
    fn verify_transfer_policy(
        self: @TContractState,
        amount: u128,
        recipient: ContractAddress,
        token: ContractAddress,
    ) -> bool;

    /// Sets the maximum allowable single transfer cap.
    fn set_max_transfer_cap(ref self: TContractState, new_cap: u128);

    /// Sets the daily aggregate outflow limit.
    fn set_daily_outflow_limit(ref self: TContractState, new_limit: u128);

    /// Adds an address to the approved recipient allowlist.
    fn add_approved_recipient(ref self: TContractState, recipient: ContractAddress);

    /// Removes an address from the approved recipient allowlist.
    fn remove_approved_recipient(ref self: TContractState, recipient: ContractAddress);

    /// Checks if an address is on the approved recipient allowlist.
    fn is_approved_recipient(self: @TContractState, recipient: ContractAddress) -> bool;

    /// Returns policy details: (max_transfer_cap, daily_outflow_limit, owner).
    fn get_policy_details(self: @TContractState) -> (u128, u128, ContractAddress);
}

pub mod errors {
    pub const CALLER_NOT_OWNER: felt252 = 'CALLER_NOT_OWNER';
    pub const ZERO_MAX_CAP: felt252 = 'ZERO_MAX_CAP';
    pub const ZERO_RECIPIENT: felt252 = 'ZERO_RECIPIENT';
    pub const RECIPIENT_NOT_APPROVED: felt252 = 'RECIPIENT_NOT_APPROVED';
    pub const AMOUNT_EXCEEDS_CAP: felt252 = 'AMOUNT_EXCEEDS_CAP';
}

#[starknet::contract]
pub mod PolicyVault {
    use core::num::traits::Zero;
    use starknet::storage::{
        StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess, Map,
    };
    use starknet::{ContractAddress, get_caller_address};
    use super::{IPolicyVault, errors};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        max_transfer_cap: u128,
        daily_outflow_limit: u128,
        approved_recipients: Map<ContractAddress, bool>,
        enforce_whitelist: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PolicyUpdated: PolicyUpdated,
        RecipientWhitelisted: RecipientWhitelisted,
        RecipientRevoked: RecipientRevoked,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PolicyUpdated {
        pub max_transfer_cap: u128,
        pub daily_outflow_limit: u128,
        pub updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RecipientWhitelisted {
        pub recipient: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RecipientRevoked {
        pub recipient: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_owner: ContractAddress,
        initial_max_cap: u128,
        initial_daily_limit: u128,
        enforce_whitelist: bool,
    ) {
        assert(initial_owner.is_non_zero(), errors::CALLER_NOT_OWNER);
        assert(initial_max_cap.is_non_zero(), errors::ZERO_MAX_CAP);

        self.owner.write(initial_owner);
        self.max_transfer_cap.write(initial_max_cap);
        self.daily_outflow_limit.write(initial_daily_limit);
        self.enforce_whitelist.write(enforce_whitelist);
    }

    #[abi(embed_v0)]
    impl PolicyVaultImpl of IPolicyVault<ContractState> {
        fn verify_transfer_policy(
            self: @ContractState,
            amount: u128,
            recipient: ContractAddress,
            token: ContractAddress,
        ) -> bool {
            assert(recipient.is_non_zero(), errors::ZERO_RECIPIENT);

            let max_cap = self.max_transfer_cap.read();
            assert(amount <= max_cap, errors::AMOUNT_EXCEEDS_CAP);

            if self.enforce_whitelist.read() {
                assert(self.approved_recipients.read(recipient), errors::RECIPIENT_NOT_APPROVED);
            }

            true
        }

        fn set_max_transfer_cap(ref self: ContractState, new_cap: u128) {
            self.assert_only_owner();
            assert(new_cap.is_non_zero(), errors::ZERO_MAX_CAP);
            self.max_transfer_cap.write(new_cap);

            self
                .emit(
                    PolicyUpdated {
                        max_transfer_cap: new_cap,
                        daily_outflow_limit: self.daily_outflow_limit.read(),
                        updated_by: get_caller_address(),
                    },
                );
        }

        fn set_daily_outflow_limit(ref self: ContractState, new_limit: u128) {
            self.assert_only_owner();
            self.daily_outflow_limit.write(new_limit);

            self
                .emit(
                    PolicyUpdated {
                        max_transfer_cap: self.max_transfer_cap.read(),
                        daily_outflow_limit: new_limit,
                        updated_by: get_caller_address(),
                    },
                );
        }

        fn add_approved_recipient(ref self: ContractState, recipient: ContractAddress) {
            self.assert_only_owner();
            assert(recipient.is_non_zero(), errors::ZERO_RECIPIENT);
            self.approved_recipients.write(recipient, true);
            self.emit(RecipientWhitelisted { recipient });
        }

        fn remove_approved_recipient(ref self: ContractState, recipient: ContractAddress) {
            self.assert_only_owner();
            self.approved_recipients.write(recipient, false);
            self.emit(RecipientRevoked { recipient });
        }

        fn is_approved_recipient(self: @ContractState, recipient: ContractAddress) -> bool {
            self.approved_recipients.read(recipient)
        }

        fn get_policy_details(self: @ContractState) -> (u128, u128, ContractAddress) {
            (self.max_transfer_cap.read(), self.daily_outflow_limit.read(), self.owner.read())
        }
    }

    #[generate_trait]
    impl InternalMethods of InternalMethodsTrait {
        fn assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), errors::CALLER_NOT_OWNER);
        }
    }
}
