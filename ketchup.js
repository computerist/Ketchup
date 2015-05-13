KETCHUP_DEBUG = true;

// some constants
const TIMER_SECONDS = 1;
const TIMER_MINUTES = 2;
const TIMER_HOURS= 3;

function Task(aDescription) {
  this.description = aDescription;
  this.complete = false;
  this.squashes = 0;
}

Task.prototype.getDescription = function() {
  return this.description;
};

Task.prototype.squash = function() {
  this.squashes++;
};

Task.prototype.markComplete = function() {
  this.complete = true;
};

Task.prototype.isComplete = function() {
  return this.complete;
};

TIMER_STATE_WAITING  = 1;
TIMER_STATE_RUNNING  = 2;
TIMER_STATE_PAUSED   = 3;
TIMER_STATE_FINISHED = 4;
TIMER_TICK = 5;

function Timer(aDuration, aUnit, aListener) {
  this.duration = 0;
  this.state = TIMER_STATE_WAITING;
  this.listener = aListener;

  switch (aUnit) {
  case TIMER_SECONDS:
    this.duration = aDuration;
    break;
  case TIMER_MINUTES:
    this.duration = aDuration * 60;
    break;
  case TIMER_HOURS:
    this.duration = aDuration * 60 * 60;
  }
}

Timer.prototype.changeState = function(aState) {
  this.state = aState;
  this.listener({"state":aState,
                 "time": Math.round((this.end - Date.now()) / 1000),
                 "target":this});
}

Timer.prototype.finish = function() {
  if (KETCHUP_DEBUG) {
    console.log("Timer finish");
  }
  if (this.state != TIMER_STATE_RUNNING) {
    //TODO: log a warning
    console.log("inconsistent timer state at finish");
    return;
  }
  clearTimeout(this.timeout);
  clearTimeout(this.interval);
  this.changeState(TIMER_STATE_FINISHED);
};

Timer.prototype.start = function() {
  if (KETCHUP_DEBUG) {
    console.log("Timer start for "+this.duration+" seconds");
  }

  if (this.state != TIMER_STATE_WAITING && this.state != TIMER_STATE_PAUSED) {
    console.log("inconsistent timer state - will not start");
    return;
  }

  this.end = Date.now() + (this.duration * 1000);
  this.changeState(TIMER_STATE_RUNNING);
  this.timeout = setTimeout(this.finish.bind(this), this.duration * 1000);
  this.interval = setInterval(this.tick.bind(this), 1000);
};

Timer.prototype.tick = function() {
  this.listener({"state": TIMER_TICK,
                 "time": Math.round((this.end - Date.now()) / 1000),
                 "target": this});
}

Timer.prototype.pause = function() {
  if (KETCHUP_DEBUG) {
    console.log("Timer pause");
  }
  if (this.state != TIMER_STATE_RUNNING) {
    console.log("inconsistent timer state - will not pause");
    return;
  }
  this.changeState(TIMER_STATE_PAUSED);
  // keep note of the remaining running time
  this.duration = (this.end - Date.now()) / 1000;

  // clear the timeout and interval
  if (this.timeout) {
    clearTimeout(this.timeout);
  }

  if (this.interval) {
    clearInterval(this.interval);
  }

  if (KETCHUP_DEBUG) {
    console.log(this.duration + " seconds remaining");
  }
};

function pad(val, size, pad) {
  padded = val.toString();
  while (padded.length < size) {
    padded = pad.toString()+padded;
  }
  return padded;
}

function TimerDisplay(elem) {
  this.element = elem;
}

TimerDisplay.prototype.onEvent= function(evt) {
  this.element.textContent = pad(Math.floor(evt.time/60),2,0)+":"
      +pad(Math.round(evt.time%60),2,0);
  console.log(evt.time + " seconds remaining");
};

TimerDisplay.prototype.start = function () {
  // TODO: Get the time period from the UI
  this.timer = new Timer(25, TIMER_MINUTES, this.onEvent.bind(this));
  this.timer.start();
};
