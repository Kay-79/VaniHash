# Marketplace Deployment & Initialization Instructions

## 1. Deploy the Package

```bash
sui client publish --gas-budget 100000000
```
Note the `PackageID` from the output.

## 2. Initialize TransferPolicy (For Creators)

To enable Kiosk trading, you must create a `TransferPolicy` for your Type `T`.

```bash
# Obtain a Publisher capability (usually from your package init)
# Call transfer_policy::new
sui client call --package 0x2 --module transfer_policy --function new \
 --type-args <VANIHASH_PACKAGE_ID>::<MODULE>::<TYPE> \
 --args <PUBLISHER_ID>
```

## 3. Add Royalty Rule

Configure the `royalty_rule` for your policy.

```bash
# amount_bp: 500 = 5%
sui client call --package <MARKET_PACKAGE_ID> --module royalty_rule --function add \
 --type-args <VANIHASH_PACKAGE_ID>::<MODULE>::<TYPE> \
 --args <POLICY_ID> <POLICY_CAP_ID> 500 <BENEFICIARY_ADDRESS>
```

## 4. Initialize BidPool

The `BidPool` is initialized automatically on publish (via `init`). 
Find the `BidPool` Shared Object ID in the publish output.

## 5. Usage

### Listing an Item
```bash
sui client call --package <MARKET_PACKAGE_ID> --module market --function list \
 --type-args <ITEM_TYPE> \
 --args <KIOSK_ID> <KIOSK_CAP_ID> <ITEM_ID> <PRICE>
```

### Buying an Item
```bash
# You must provide a Coin that covers Price + Royalty.
# If Royalty is 5% and Price is 100, provide at least 105.
sui client call --package <MARKET_PACKAGE_ID> --module market --function purchase \
 --type-args <ITEM_TYPE> \
 --args <KIOSK_ID> <ITEM_ID> <PRICE> <COIN_ID> <POLICY_ID>
```

### Creating a Bid
```bash
sui client call --package <MARKET_PACKAGE_ID> --module bids --function create_bid \
 --type-args <ITEM_TYPE> \
 --args <BID_POOL_ID> <COIN_ID> <POLICY_ID>
```

### Accepting a Bid
Call this as the Seller:
```bash
sui client call --package <MARKET_PACKAGE_ID> --module bids --function accept_bid \
 --type-args <ITEM_TYPE> \
 --args <BID_POOL_ID> <KIOSK_ID> <KIOSK_CAP_ID> <ITEM_ID> <BID_ID> <POLICY_ID>
```
