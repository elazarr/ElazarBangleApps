locale = require("locale");
// Load fonts
require("Font7x11Numeric7Seg").add(Graphics);
require("Font5x7Numeric7Seg").add(Graphics);
require("Font8x16").add(Graphics);

// Generic display locations
const LCD_CENTER_H = g.getWidth()/2;
const LCD_CENTER_V = g.getHeight()/2;
const LCD_TOP = 0;
const LCD_BOTTOM = g.getHeight();
const LCD_LEFT = 0;
const LCD_RIGHT = g.getWidth();
// Main time position above center 
const TIME_POS_H = LCD_RIGHT;
const TIME_ALIGN_H = 1 // To the left from right side
const TIME_POS_V = LCD_CENTER_V;
const TIME_ALIGN_V = 1 // Above given position
// Position seconds at center dot
const SEC_POS_H = LCD_CENTER_H + 5;
const SEC_POS_V = LCD_CENTER_V - 40;
// const SEC_POS_V = LCD_CENTER_V - 13; // Bottom dot
// AM/PM inside left hour digit (would be at most '1' in 12H case)
const AMPM_POS_H = LCD_LEFT + 5;
const AMPM_ALIGN_H = -1;
const AMPM_POS_V = LCD_CENTER_V - 40;
const AMPM_ALIGN_V = 0;
// Position date below center
const DATE_POS_V = LCD_CENTER_V;
const DATE_ALIGN_V = -1; // Flow below

// Position for events preview
const EVENT_FRAME_V = LCD_BOTTOM - 40;
const EVENT_NOW_POS_V = LCD_BOTTOM - 20;
const EVENT_NEXT_POS_V = LCD_BOTTOM - 2;
const EVENT_ALIGN_V = 1; // Above anchor
const EVENT_POS_H = LCD_LEFT + 1;
const EVENT_ALIGN_H = -1; // From left side to the right

// Context for calendar events preview
var activeEventStr;
var nextEventStr;
// Constants to define events preview window limit
// Since the preview only displays event hours
// we should limit the preview to next 23 hours
// to avoid confusion with events at the same hour
// but on the following day
const SEC_PER_HOUR = 60 * 60;
const EVENTS_PREVIEW_LIMIT = 23 * SEC_PER_HOUR; // 23 hours in seconds


// Draw active and upcoming calendar events
function drawCalEvents() {
  g.drawLine(LCD_LEFT, EVENT_FRAME_V, LCD_RIGHT, EVENT_FRAME_V);
  g.setFont("6x8:2").setFontAlign(EVENT_ALIGN_H, EVENT_ALIGN_V);
  if (activeEventStr) {
    console.log("Drawing active event");
    g.setColor(0,0,0); // TODO: Use red for active event
    g.drawString(activeEventStr, EVENT_POS_H, EVENT_NOW_POS_V, true);
  }
  if (nextEventStr) {
    console.log("Drawing next event");
    g.setColor(0,0,0); // TODO: Use yellow (?) for active event
    g.drawString(nextEventStr, EVENT_POS_H, EVENT_NEXT_POS_V, true);
  }
}

// Update calendar events from Android calendar, if available
function updateCalEvents() {
  calendar = require("Storage").readJSON("android.calendar.json",true);
  if (!calendar) {
    console.warn("Could not fetch Android calendar data");
    return;
  }
  // Clear previous events strings
  activeEventStr = undefined;
  nextEventStr = undefined;
  var nextStartTime; // Save start of selected next in case earlier is found
  // Scan events to find active and upcoming (next) event
  const now = getTime();
  const previewHorizon = now + EVENTS_PREVIEW_LIMIT;
  for (var i in calendar) {
    const e = calendar[i]
    const startTime = e.timestamp;
    const endTime = startTime + e.durationInSeconds;
    if (!activeEventStr) {
      // Look for active event if not found, yet
      if (now >= startTime && now < endTime) {
        activeEventStr = `Now: ${e.title}`
        continue; // Cannot be "next"
      }
    }
    if (!nextEventStr || (startTime < nextStartTime)) {
      // If no upcoming event, yet,
      // or this event starts before previously set next event
      // (this sets next and the earliest in the future)
      if ((startTime > now) && (startTime < previewHorizon)) { 
        // This event has not stared, yet, and not too far.
        // Convert event timestamp in Unix Epoch seconds
        // to Date(epoch millisec) then use locale.time
        // to get current time without seconds
        const startDate = Date(startTime * 1000)
        const timeStr = locale.time(startDate, 1);
        const ampm = locale.is12Hours() ? locale.meridian(startDate)[0] : ""
        nextEventStr = `${ampm}${timeStr}:${e.title}`
        nextStartTime = startTime; // Save for testing against other events in the future
      }
    }
  }
  drawCalEvents(); // Redraw after update of events data
}

// Draw main clock components: current time (no sec.) + date
function drawClock() {
  // work out how to display the current time
  var curd = new Date();
  var timeStr = locale.time(curd, 1 /*omit seconds*/);
  var ampmStr = locale.meridian(curd).toUpperCase();

  // Reset the state of the graphics library
  g.reset();
  g.setColor(0, 0, 0); // Black

  // draw the current time (4x size 7 segment)
  g.setFont("7x11Numeric7Seg:5").setFontAlign(TIME_ALIGN_H, TIME_ALIGN_V);
  g.drawString(timeStr, TIME_POS_H, TIME_POS_V, true /*clear background*/);
  // draw the meridian (am/pm)
  g.setFont("6x8:2").setFontAlign(AMPM_ALIGN_H, AMPM_ALIGN_V);
  g.drawString(ampmStr, AMPM_POS_H, AMPM_POS_V, true /*clear background*/);

  // draw the date, in a normal font
  const dayStr = `${locale.dow(curd).slice(0,2)}.`
  // Push day to the left
  g.setFont("8x16:2").setFontAlign(-1, DATE_ALIGN_V).drawString(dayStr, LCD_LEFT + 1, DATE_POS_V, true /*clear background*/);
  const dateStr = `${curd.getDate()}/${curd.getMonth()}/${curd.getFullYear().toString().slice(2,)}`;
  // Push date to the right
  g.setFont("8x16:2").setFontAlign(1, DATE_ALIGN_V).drawString(dateStr, LCD_RIGHT - 1, DATE_POS_V, true /*clear background*/);
}

// Update just the seconds
// Invoked only when clock is unlocked
function updateSeconds(curd) {
  var secondsStr = curd.getSeconds().toString().padStart(2,0);
  g.setFont("5x7Numeric7Seg:2").setFontAlign(0,0).setColor(0, 0, 0);
  g.drawString(secondsStr, SEC_POS_H, SEC_POS_V, true /*clear background*/);
}

// Update the clock
function updateClock(forceDrawAll) {
  var curd = new Date();
  if (curd.getSeconds() == 0 || forceDrawAll) { 
    // Should update the whole clock
    drawClock();
    updateCalEvents();
  }
  if (!Bangle.isLocked()) { // Update seconds only when unlocked
    updateSeconds(curd);
  }
}

// Clear the screen once, at startup
g.clear();
// First time draw - force update of the whole clock face
updateClock(true);
// Schedule clock update every second
// TODO: Avoid timer event every second if locked
var secondInterval = setInterval(updateClock, 1000);

// Hook to "lock" event to trigger appearance/vanish of seconds 
// immediately when unlocked/locked
Bangle.on('lock',(locked,reason)=>{
    console.log("lock event: locked =", locked, "reason =", reason);
    updateClock(true); // Redraw immediately when state changes
});


// Load and display widgets
Bangle.loadWidgets();
Bangle.drawWidgets();
// Show launcher when middle button pressed
Bangle.setUI("clock");
