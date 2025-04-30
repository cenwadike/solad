# Solad Data Upload, Sharding, and Cost Analysis

## Overview

The `upload_data` function in the Solad storage system manages data uploads by creating a logical sharding plan, assigning shards to nodes, and handling payments. It supports user-specified storage duration and scales costs with data size, shard count, and duration. Each shard contains the full data, replicated across up to 3 nodes per shard, ensuring high availability. Costs are based on $6/GB/20 years/shard, with payments split between treasury (25%) and nodes (75%). Nodes submit Proof of Storage (PoS) to claim rewards, with slashing mechanisms enforcing compliance.

## Sharding Process (Redundancy-Based)

The function creates a logical sharding plan where each shard stores the entire data, replicated across nodes. Key steps:

1. Input Validation

    - Validates `size_bytes` (≥ 1 KB), `shard_count` (within `min_shard_count` to `max_shard_count`), `data_hash` (≤ 64 chars, non-empty), and `storage_duration_days` (1 day to 2000 years).

    - `data_hash` is a cryptographic hash for data identification and PoS verification.

2. Shard Size Calculation

    ```rust
        let size_mb = (size_bytes + (1024 * 1024 - 1)) / (1024 * 1024); // Ceiling to MB
        let mut adjusted_shard_count = shard_count;
        let mut shard_sizes_mb = vec![0u64; shard_count as usize];
        let base_shard_size = size_mb / (shard_count as u64);
        let remainder_mb = size_mb % (shard_count as u64);
        for i in 0..shard_count as usize {
            shard_sizes_mb[i] = base_shard_size + if i < remainder_mb as usize { 1 } else { 0 };
        }
        if size_mb >= config.shard_min_mb {
            let mut all_valid = true;
            for &size in shard_sizes_mb.iter() {
                if size > 0 && size < config.shard_min_mb {
                    all_valid = false;
                    break;
                }
            }
            if !all_valid {
                adjusted_shard_count = ((size_mb + config.shard_min_mb - 1) / config.shard_min_mb)
                    .max(config.min_shard_count as u64)
                    .min(max_possible_shards as u64)
                    .min(shard_count as u64) as u8;
                shard_sizes_mb = vec![0u64; adjusted_shard_count as usize];
                let new_base_size = size_mb / (adjusted_shard_count as u64);
                let new_remainder = size_mb % (adjusted_shard_count as u64);
                for j in 0..adjusted_shard_count as usize {
                    shard_sizes_mb[j] = new_base_size + if j < new_remainder as usize { 1 } else { 0 };
                }
            }
        }
    ```

    - Converts `size_bytes` to `size_mb` (ceiling).
    - Distributes `size_mb` across `shard_count` shards (e.g., [4, 3, 3] MB for 10 MB, 3 shards).
    - Adjusts `adjusted_shard_count` if shards are below `shard_min_mb`, ensuring viable sizes.
    - Each shard stores the full data, with `shard_sizes_mb` used for payment allocation.

3. Node Assignment

    - Assigns 1–3 nodes per shard using stake-weighted random selection, seeded by `data_hash`, shard index, and slot.
    - Tracks unique nodes in `updated_nodes` for `UploadEvent`.
    - Redundancy: Each shard’s data is replicated across its nodes (up to 3 copies/shard).

4. Shard Metadata Storage

- Creates `ShardInfo` for each shard, storing `shard_id`, `node_keys`, `size_mb`, and `verified_count` (for PoS).
- `size_mb` reflects the full data size; `data_hash` ensures identical data across shards.

5. Client’s Role

    - Clients send the entire data to all nodes in each shard’s `node_keys`, using `shard_id` for identification.

    - Nodes verify data against `data_hash`, store it, and submit PoS via `process_submit_pos`.

    - Retrieval: Clients access data from any shard’s nodes, ensuring availability.

6. Event Emission

    ```rust 
    emit!(UploadEvent {
        upload_pda: upload.key(),
        data_hash,
        size_mb,
        shard_count: adjusted_shard_count,
        payer: ctx.accounts.payer.key(),
        nodes: updated_nodes,
    });
    ```

    - Emits `UploadEvent` with node assignments, notifying nodes of their roles.

## Cost Structure

Costs scale with `size_bytes`, `shard_count`, and `storage_duration_days`, based on **$6/GB/20 years/shard**. Payments are split: 25% to treasury, 75% to nodes (escrowed, claimed via PoS).

### Cost Calculation

```rust
    let base_lamports = size_bytes
        .checked_mul(config.sol_per_gb)
        .ok_or(SoladError::MathOverflow)?
        .checked_div(1024 * 1024 * 1024)
        .ok_or(SoladError::MathOverflow)?
        .checked_mul(shard_count as u64)
        .ok_or(SoladError::MathOverflow)?
        .checked_mul(storage_duration_days)
        .ok_or(SoladError::MathOverflow)?
        .checked_div(7300)
        .ok_or(SoladError::MathOverflow)?;
    let total_lamports = base_lamports;
    let treasury_lamports = total_lamports
        .checked_mul(config.treasury_fee_percent)
        .ok_or(SoladError::MathOverflow)?
        / 100;
    let node_lamports = total_lamports
        .checked_mul(config.node_fee_percent)
        .ok_or(SoladError::MathOverflow)?
        / 100;
```

- **Total Cost**: `total_lamports` = (`size_bytes` * `sol_per_gb` / 1GB) * `shard_count` * `storage_duration_days` / 7300 (20 years = 7300 days).

    - For $6/GB/20 years, sol_per_gb ≈ 30,000,000,000 lamports/GB.

    - Example: 1 GB, 3 shards, 20 years: total_lamports ≈ 90,000,000,000 lamports (30,000,000,000 * 3).

- **Split**: `treasury_lamports` = 25% (e.g., 22,500,000,000 lamports), `node_lamports` = 75% (e.g., 67,500,000,000 lamports).

- **Node Rewards**:

    - Initial 25% reward (e.g., 1,875,000,000 lamports/node for 3 nodes/shard, 3 shards) claimed post-PoS via `process_submit_pos` and `process_claim_rewards`.

    - Remaining 75% distributed as endowment over `epochs_total` (e.g., 56,250,000 lamports/epoch for 100 epochs).

- **Duration Impact**: Costs scale linearly with `storage_duration_days`, allowing flexible pricing (e.g., 1 month ≈ 1/240 of 20-year cost).

- **Redundancy Impact**: Costs scale with shard_count, ensuring nodes are compensated for additional storage (e.g., 5 shards vs. 3 shards increases `total_lamports`).

### Example

- 1 GB (`size_bytes` = 1,073,741,824), `shard_count` = 3, `storage_duration_days` = 7300 (20 years), 3 nodes/shard:

    - `total_lamports` ≈ 90,000,000,000 lamports.

    - `treasury_lamports` ≈ 22,500,000,000, `node_lamports` ≈ 67,500,000,000.

    - Per node (9 nodes): 7,500,000,000 lamports.

    - Initial reward: 1,875,000,000 lamports/node.

    - Endowment: 5,625,000,000 lamports/node over 100 epochs (56,250,000 lamports/epoch).


## Slashing Mechanisms

Slashing ensures economic fairness by penalizing non-compliance.

### Node Slashing (`process_slash_timeout`)

```rust
let slash_amount = exiting_node
    .stake_amount
    .checked_mul(config.slash_penalty_percent)
    .ok_or(SoladError::MathOverflow)?
    / 100;
let treasury_amount = slash_amount
    .checked_mul(90)
    .ok_or(SoladError::MathOverflow)?
    / 100;
let caller_amount = slash_amount
    .checked_sub(treasury_amount)
    .ok_or(SoladError::MathOverflow)?;
```

- **Trigger**: Nodes failing to submit PoS within `replacement_timeout_epochs` after replacement request.

- **Penalty**: `slash_amount` = `stake_amount` * `slash_penalty_percent` / 100 (e.g., 10% of stake).

- **Distribution**: 90% to treasury, 10% to caller.


### User Slashing (`process_slash_user`)

```rust
let shard_lamports = node_lamports
    .checked_mul(shard.size_mb)
    .ok_or(SoladError::MathOverflow)?
    .checked_div(size_mb)
    .ok_or(SoladError::MathOverflow)?;
let slash_amount = shard_lamports
    .checked_mul(config.user_slash_penalty_percent)
    .ok_or(SoladError::MathOverflow)?
    / 100;
let refund_amount = shard_lamports
    .checked_sub(slash_amount)
    .ok_or(SoladError::MathOverflow)?;
```

- **Trigger**: 2/3 of shard’s nodes report oversized data (`verified_count` == u8::MAX).

- **Penalty**: `slash_amount` = `shard_lamports` * `user_slash_penalty_percent` / 100 (e.g., 10%) to treasury.

- **Refund**: `refund_amount` = `shard_lamports` - `slash_amount` to payer.

- **Impact**: Penalizes incorrect size reporting, frees nodes, and prevents reward claims.


### Redundancy and Cost Proportionality

- **Current State**: Costs scale with `shard_count` and `storage_duration_days`, ensuring nodes are compensated for storage overhead (e.g., 5 shards × 3 nodes = 15 copies vs. 3 shards × 3 nodes = 9 copies).

- **Payment Allocation**: `shard_sizes_mb` distributes `node_lamports` per shard, ensuring per-shard fairness.

- **Impact**: Aligns with economic fairness, as higher redundancy increases payments, supporting availability.

### Storage Duration

- **Implementation**: storage_duration_days sets expiry_time = upload_time + storage_duration_days * 86400.

- **Implications**:

    - **User Flexibility**: Users specify duration (1 day to 2000 years), enabling short-term or archival storage.

    - **Cost Fairness**: Costs scale with duration, ensuring proportionality (e.g., 1 month vs. 20 years).

    - **Node Management**: Nodes delete data post-`expiry_time`, with PoS and rewards until then.

    - **Slashing**: Applies until `expiry_time`, clarifying obligations.

### Analysis of Cost Structure and Economic Implications

- **High Availability**: Redundancy ensures data access from any shard’s nodes (April 24, 2025).

- **Client Experience**: Duration flexibility and proportional costs enhance user control.

- **Economic Fairness**: Costs reflect size, redundancy, and duration; PoS and slashing prevent abuse.

- **Node Incentives**: Initial reward and endowment, tied to PoS, ensure long-term participation.

## Conclusion

The `process_upload_data` function implements redundancy-based sharding, with each shard storing full data across 1–3 nodes, ensuring availability. Costs scale with size, shard count, and duration ($6/GB/20 years/shard base), with 25% to treasury and 75% to nodes (25% initial, 75% endowment). Slashing ensures compliance. The `storage_duration_days` parameter enables flexible, fair pricing, aligning with Solad’s goals of availability, fairness, and user-centricity.