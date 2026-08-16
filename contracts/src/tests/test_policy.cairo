use core::traits::TryInto;
use starknet::ContractAddress;
use crate::policy::{IPolicyVaultDispatcher, IPolicyVaultDispatcherTrait, PolicyVault, errors};

fn OWNER() -> ContractAddress {
    starknet::contract_address_const::<0x123>()
}

fn RECIPIENT() -> ContractAddress {
    starknet::contract_address_const::<0x456>()
}

fn UNAPPROVED() -> ContractAddress {
    starknet::contract_address_const::<0x789>()
}

fn TOKEN() -> ContractAddress {
    starknet::contract_address_const::<0xabc>()
}

#[test]
fn test_policy_cap_enforcement_pass() {
    let mut state = PolicyVault::contract_state_for_testing();
    PolicyVault::constructor(ref state, OWNER(), 100_000, 500_000, false);

    // Transfer 50,000 <= 100,000 max cap
    let result = state.verify_transfer_policy(50_000, RECIPIENT(), TOKEN());
    assert(result == true, 'Policy verification should pass');
}

#[test]
#[should_panic(expected: ('AMOUNT_EXCEEDS_CAP',))]
fn test_policy_cap_enforcement_fail_exceeds_cap() {
    let mut state = PolicyVault::contract_state_for_testing();
    PolicyVault::constructor(ref state, OWNER(), 100_000, 500_000, false);

    // Transfer 150,000 > 100,000 max cap (should panic)
    state.verify_transfer_policy(150_000, RECIPIENT(), TOKEN());
}

#[test]
fn test_policy_whitelist_enforcement() {
    let mut state = PolicyVault::contract_state_for_testing();
    PolicyVault::constructor(ref state, OWNER(), 100_000, 500_000, true);

    // Whitelist RECIPIENT
    starknet::testing::set_caller_address(OWNER());
    state.add_approved_recipient(RECIPIENT());

    assert(state.is_approved_recipient(RECIPIENT()), 'Should be whitelisted');
    assert(!state.is_approved_recipient(UNAPPROVED()), 'Should not be whitelisted');

    let valid = state.verify_transfer_policy(25_000, RECIPIENT(), TOKEN());
    assert(valid == true, 'Whitelisted transfer should pass');
}

#[test]
fn test_policy_update_by_owner() {
    let mut state = PolicyVault::contract_state_for_testing();
    PolicyVault::constructor(ref state, OWNER(), 100_000, 500_000, false);

    starknet::testing::set_caller_address(OWNER());
    state.set_max_transfer_cap(200_000);

    let (max_cap, daily_limit, owner) = state.get_policy_details();
    assert(max_cap == 200_000, 'Cap should be updated');
    assert(daily_limit == 500_000, 'Daily limit intact');
    assert(owner == OWNER(), 'Owner intact');
}
