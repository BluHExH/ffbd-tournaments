# Android APK release preparation

This commit triggers the explicitly approved Android Gradle APK build after merging the secure admin portal and wallet improvements into the player-wallet integration branch.

Included app changes:
- Secure tournament room credentials visibility for confirmed players.
- Wallet-funded tournament entry is confirmed immediately after the atomic debit.
- Tournament capacity is checked again before opening registration, and full tournaments disable registration.
- Admin portal handoff and notification UI changes are included in the merged feature source.

The website production release remains gated on resolving the existing main-branch merge conflicts.
