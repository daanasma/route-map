# Route Map - Backlog

## Features
### High Prio
- Add code list interfaces to interfaces (https://chatgpt.com/c/678ffdbc-9148-800b-9d8d-28eb345ab535)
- Card layout + side panel layout. Reusable component?
- Image carousel
- Add extra POI - basic points (2 categories)
- Add line style based on attribute category
- Add feature Popup
- 
### Low Prio
- change map attribution to be closed on load (hacky probably)
- drag down panel -> dont drag down text.

## Bugs
### High Prio

### Low Prio
- when moving a lot between screen sizes, the isTablet composable gets overwhelmed. shouldn't happen.
- click on start and end let it scroll



## V0.1.0

### Features
- Add watcher to bottom bar swiper to make it scroll to stop points if they are selected on map.
- change stop data ids to be equal everywhere (data / routepath). 1-based
- Rework stop and route data -> 1 dataset (or array of features?). Route index = server side.
- make card scrollable if opened and only partial view if not
- Add photo to description
- Start updating data

### Bugfixes
- background map: blue -> none
- maximized card -> if you close, it scrolls to next one. shouldn't happen.
  -> fixed by making an overlay that is not equal to the original card but rather a new one.
