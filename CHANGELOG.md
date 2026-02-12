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
