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

function updateSeconds(curd) {
  var secondsStr = curd.getSeconds().toString().padStart(2,0);
  g.setFont("5x7Numeric7Seg:2").setFontAlign(0,0).setColor(0, 0, 0);
  g.drawString(secondsStr, SEC_POS_H, SEC_POS_V, true /*clear background*/);
}

function updateClock() {
  var curd = new Date();
  if (curd.getSeconds() == 0) { // Should update the whole clock
    drawClock();
  }
  if (!Bangle.isLocked()) { // Update seconds only when unlocked
    updateSeconds(curd);
  }
}

// Clear the screen once, at startup
g.clear();
// draw immediately at first
drawClock();
// Stop seconds updates when locked
var secondInterval = setInterval(updateClock, 1000);
updateClock();

// Hook to "lock" event to trigger appearance/vanish of seconds 
// immediately when unlocked/locked
Bangle.on('lock',(locked,reason)=>{
    console.log("lock event: locked =", locked, "reason =", reason);
    drawClock(); // Draw base clock, i.e., without seconds
});


// Load and display widgets
Bangle.loadWidgets();
Bangle.drawWidgets();
// Show launcher when middle button pressed
Bangle.setUI("clock");
