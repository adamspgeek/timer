'use strict';

var range = document.querySelector('#range');
var rangeTrack = document.querySelector('#rangeTrack');
var value = document.querySelector('.ui-value');
var num1 = document.querySelector('#num1');
var num2 = document.querySelector('#num2');
var ticks = document.querySelectorAll('.ui-range-tick');
var docStyle = document.documentElement.style;

var _Rx$Observable = Rx.Observable;
var fromEvent = _Rx$Observable.fromEvent;
var interval = _Rx$Observable.interval;

var clamp = function clamp(min, max) {
  return function (val) {
    return Math.min(Math.max(val, min), max);
  };
};

var lerp = function lerp(curr, next) {
  var delta = next - curr;
  if (Math.abs(delta) < 0.01) return curr;
  return curr + (next - curr) * 0.13;
};

var touch$ = fromEvent(range, 'input');

var touchEnd$ = fromEvent(range, 'mouseup').merge(fromEvent(range, 'touchend')).mapTo(false);

var change$ = touch$.mapTo(true).merge(touchEnd$).distinctUntilChanged();

var num$ = touch$.map(function (e) {
  return +e.target.value;
}).distinctUntilChanged().startWith(6);

var af$ = interval(0, Rx.Scheduler.animationFrame);

var smoothNum$ = af$.withLatestFrom(num$, function (_, num) {
  return num;
}).scan(lerp).distinctUntilChanged();

var progress$ = smoothNum$.map(function (num) {
  return num - Math.floor(num);
});

smoothNum$.subscribe(function (num) {
  num1.innerHTML = Math.floor(num);
  num2.innerHTML = Math.ceil(num);
  docStyle.setProperty('--value', num);

  Array.from(ticks).forEach(function (tick) {
    var proximity = Math.min(Math.abs(tick.getAttribute('data-value') - num), 2);
    tick.style.setProperty('--proximity', proximity);
  });
});

progress$.subscribe(function (progress) {
  docStyle.setProperty('--progress', progress);

  if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    // Firefox does not support custom properties
    // inside of scale() for whatever reason
    num1.setAttribute('style', '\n      transform:\n        translateX(calc(' + progress + ' * -10vh))\n        scale(' + (1 + progress) + ');\n      opacity: ' + (1 - progress) + ';\n\n    ');

    num2.setAttribute('style', '\n      transform:\n        translateX(calc(' + progress + ' * -10vh + 10vh))\n        scale(' + progress + ');\n      opacity: ' + progress + ';\n    ');
  }
});

change$.subscribe(function (changing) {
  num1.parentElement.style.setProperty('--changing', +changing);
});