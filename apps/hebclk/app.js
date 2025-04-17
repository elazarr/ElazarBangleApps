locale = require("locale");
// Load fonts
require("Font7x11Numeric7Seg").add(Graphics);
require("Font5x7Numeric7Seg").add(Graphics);
// X/Y are the position of the bottom right of the HH:MM text - make it central!
// const X = g.getWidth()/2 + 45,
//       Y = g.getHeight()/2 + 20;
const LCD_CENTER_H = g.getWidth()/2;
const LCD_CENTER_V = g.getHeight()/2;
const LCD_BOTTOM = g.getHeight();
const LCD_RIGHT = g.getWidth();

function drawClock() {
  // work out how to display the current time
  var curd = new Date();
  var clock = locale.time(curd, 1 /*omit seconds*/);
  // var seconds = curd.getSeconds().toString().padStart(2,0);
  var meridian = locale.meridian(curd);
  // Reset the state of the graphics library
  g.reset();
  // draw the current time (4x size 7 segment)
  g.setFontAlign(0,1);
  g.setFont("7x11Numeric7Seg:5");
  g.drawString(clock, LCD_CENTER_H, LCD_CENTER_V, true /*clear background*/);
  // draw the meridian(am/pm) and seconds (2x size 7 segment)
  g.setFontAlign(-1,1); // align bottom left
  // g.setFont("6x8:2");
  // g.drawString(meridian, X+4, Y-26, true /*clear background*/);

  // draw the date, in a normal font
  g.setFont("6x8:3");
  g.setFontAlign(0,1); // align center bottom
  const dateStr = `${curd.getDate()}/${curd.getMonth()}/${curd.getFullYear().toString().slice(2,)}`;
  g.drawString(dateStr, LCD_CENTER_H, LCD_CENTER_V+25, true /*clear background*/);
  const dowStr= locale.dow(curd).slice(0,3);
  g.drawString(dowStr, LCD_CENTER_H, LCD_CENTER_V+45, true /*clear background*/);
}

function updateSeconds(curd) {
  // Position at center dot
  const SEC_POS_H = LCD_CENTER_H;
  const SEC_POS_V = LCD_CENTER_V - 40;
  // const SEC_POS_V = LCD_CENTER_V - 13; // Bottom dot
  var secondsStr = curd.getSeconds().toString().padStart(2,0);
  g.setFontAlign(0,0);
  g.setFont("5x7Numeric7Seg:2");
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
