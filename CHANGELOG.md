## [0.60.1](https://github.com/basevoley/volleyball-score-tracker/compare/v0.60.0...v0.60.1) (2026-03-26)


### Bug Fixes

* fire SetEnded/MatchEnded events when adjustScore triggers a set/match end ([40a4d37](https://github.com/basevoley/volleyball-score-tracker/commit/40a4d37205d0fd5fafa0378fb38893bc19d4cddf))

# [0.60.0](https://github.com/basevoley/volleyball-score-tracker/compare/v0.59.2...v0.60.0) (2026-03-24)


### Bug Fixes

* adjusted times on pre-match sequence ([a0567e3](https://github.com/basevoley/volleyball-score-tracker/commit/a0567e38ebf4b83490b1736eddd2a76fdefbcf72))
* small adjustment to the size of the switches ([d930325](https://github.com/basevoley/volleyball-score-tracker/commit/d930325f2ff655eb6e217fc90d759eecbc93ca19))


### Features

* added automations ([3910eb4](https://github.com/basevoley/volleyball-score-tracker/commit/3910eb46d4e6441a303e96d57bab7fe5d7ac6b73))
* added no-stats mode as configurable user setting ([25fb776](https://github.com/basevoley/volleyball-score-tracker/commit/25fb776208b9f8fca7f5412b3410cc136fac9003))
* added session restoring functionality ([2bd6772](https://github.com/basevoley/volleyball-score-tracker/commit/2bd677286d8126d982f7e116788fd904c980e410))
* added teams lineup support for display only ([0ac491e](https://github.com/basevoley/volleyball-score-tracker/commit/0ac491ed23a51156f33e2528f565b6c5d714f3d0))
* improvement on club logo selection ([d8c9bde](https://github.com/basevoley/volleyball-score-tracker/commit/d8c9bdefe4e0275c121fde0ae3285d4020912bad))
* modified so that automation step execution condition is evaluated at run time ([825f320](https://github.com/basevoley/volleyball-score-tracker/commit/825f32098044d37f9b259a06ebbf67148067daf5))

## [0.59.2](https://github.com/basevoley/volleyball-score-tracker/compare/v0.59.1...v0.59.2) (2026-03-10)


### Bug Fixes

* solved import issues and adjusted props passing between components ([f208b47](https://github.com/basevoley/volleyball-score-tracker/commit/f208b47d2c624e59de723eb4bbded54bea18e9d9))

## [0.59.1](https://github.com/basevoley/volleyball-score-tracker/compare/v0.59.0...v0.59.1) (2026-03-10)


### Bug Fixes

* empty commit to force deployment ([529d88d](https://github.com/basevoley/volleyball-score-tracker/commit/529d88d228826547c5e73b2c886b260c4ebee378))

# [0.59.0](https://github.com/basevoley/volleyball-score-tracker/compare/v0.58.0...v0.59.0) (2026-03-06)

### Bug Fixes

* adapt tabs style on bigger screens ([101cabe](https://github.com/basevoley/volleyball-score-tracker/commit/101cabea28b75ec1c4462b5429f94b950de1b4c4))
* change graph legend position on pdf export ([06ba96c](https://github.com/basevoley/volleyball-score-tracker/commit/06ba96c147512cf7c61e138ce98e495d02ed1b07))
* ensure point chart is always displayed ([2966872](https://github.com/basevoley/volleyball-score-tracker/commit/2966872d534a795dbee1384ac9ce4a0b9283dab7))


### Features

* added double confirmation on set end ([f84de45](https://github.com/basevoley/volleyball-score-tracker/commit/f84de45b76f194070a763f7db067937bbd311b05))
* refactor Match into smaller components ([9f963e7](https://github.com/basevoley/volleyball-score-tracker/commit/9f963e7621f7a3482acd641abfd299297b4dfb4f))

# [0.58.0](https://github.com/dagarfol/volleyball-score-tracker/compare/v0.57.0...v0.58.0) (2026-02-13)


### Features

* change copy url alert for MUI snackbar ([4870fe5](https://github.com/dagarfol/volleyball-score-tracker/commit/4870fe5da60e8ffbff26286967e9333a5aca8d1f))
* change status snackbar for slide-in panel ([2de0c81](https://github.com/dagarfol/volleyball-score-tracker/commit/2de0c8196e4d96caf6887aef9868673bdae71b17))

# [0.57.0](https://github.com/dagarfol/volleyball-score-tracker/compare/v0.56.2...v0.57.0) (2026-02-12)


### Bug Fixes

* adjusted select width on scoreboard ([1504c67](https://github.com/dagarfol/volleyball-score-tracker/commit/1504c673e1ab2907dfd565b5a702ab3b214a071a))


### Features

* added integrated end-of-match dialog instead of browser alert ([dc09e5a](https://github.com/dagarfol/volleyball-score-tracker/commit/dc09e5a5f98372b79212bfcccfec8c6795fe3fa3))
* added support for subscribe component ([bb9314c](https://github.com/dagarfol/volleyball-score-tracker/commit/bb9314c44c21357ad13b9d4e694af11cdb429dfd))

## [0.56.2](https://github.com/dagarfol/volleyball-score-tracker/compare/v0.56.1...v0.56.2) (2026-02-11)


### Bug Fixes

* cleaned up commented out and leftover code ([794d8a4](https://github.com/dagarfol/volleyball-score-tracker/commit/794d8a403545771fba2c17a199c2148276e5bdd1))
* corrected master branch name on release flow ([b54d4e7](https://github.com/dagarfol/volleyball-score-tracker/commit/b54d4e7f1819a13b7bf4b9317fa459aff460a7eb))
* updated master branch name on releaserc file too ([ac90269](https://github.com/dagarfol/volleyball-score-tracker/commit/ac902690285628d61fe8fbd91baed9411408b208))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.56.1 (2026-02-11)


### Features

* add versioning and release management 7b7d70a
* added a color selector to reflect the teams' colors rather than having fixed colors 3c3f6c4
* added accordion panel for stats and downloads 4e84acf
* Added chart of points and events by set e92db70
* added control for handling sponsors panel 976faaf
* added excel download. Small fixes 279d75e
* added force reload for overlay. Cleaned initial data. Added sample logos 201962d
* added handshake protocol to show connection status with control app d5154d7
* added new favicon 8975750
* added pdf report generation base 160d422
* added point evolution to excel export 7a28491
* added social media panel support 6a83dfb
* added stats by set and point evolution chart to pdf export 13350c0
* added stats per set 1449105
* added substitutions support 4ee535d
* added support for hiding stats from result panel and hiding previous sets from scoreboard 7b88bfe
* applied material ui to prematch component b5bd931
* facelift to 'match' screen using mUI components. Cosmetic adjustments. Added version on footer 09d0b3f
* improved websocket connection handling and added UI feedback c521ad6
* made match selector to appear on a modal dialog 9c9b3b6
* migrate to material ui modal dialog and matchSelector 8de39dd
* migrated main app to material UI cd188cb
* migrated to MUI the custom combobox component c950ab7
* refactor match and stats logic out of Match component 39bd11b
* refactored rally handling logic out of RallyControl 283f4e5
* refactored socket to context provider e08dcd1
* Translated to sp. Added some calculated stats. Small visual adjustments 31eb94c


### Bug Fixes

* Added field competitionPoints 68ee5cc
* added label of team that's doing the next action ab74a79
* adjusted initial preview size to not cause lateral scroll on phone d7eecf2
* adjusted preview resolution to SD resolution so it shows as will be seen in the video 0c42067
* adjusted set winner for cases when both teams are above the typical points limits 2448843
* change how color similarity is checked to really ensure there is no color crash d4956f6
* corrected how the socket payload sub-objects were created to prevent unwanted deletion of local data a9292aa
* disable discard point button unless there is something to discard 71daf82
* ensure element colors do not fuse with background 0f84126
* hide point button on stages where it should not be shown 792e813
* make custom combo show images even if the filter is empty or if no matches are found e1ae7bd
* migrate to exceljs due to security issue on xlsx library 5bac5bc
* moved navigation button to the top 9c58b9d
* points chart start at 0 1b64ef9
* prevent pdf being regenerated at every point 1f1a2d3
* recover aggregated total stats 642ed50
* reduce appearance on controls tab a552f5f
* refactor to split stats out of Match.js 9bc924c
* removed unused import 5068f10
* send proper stats for each set 7879943
* send proper winner. a02f799
* small cosmetic changes 0971c94
* small UI adjustments 73c9e77
* stats adding random values when returning from other tab 0ec46c2
* styles to show a more compact and better view on phone b8b2d82
* translated some texts that were missing translation 61a598a
